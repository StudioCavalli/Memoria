"""GDPR compliance endpoints: data export, account deletion, consent management."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.encryption import decrypt_text
from app.models.alert import Alert
from app.models.cognitive_metric import CognitiveMetric
from app.models.gazette import Gazette
from app.models.memory import Memory
from app.models.senior import Senior
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.models.user import FamilyMember, User

router = APIRouter(prefix="/gdpr", tags=["gdpr"])


@router.get("/export")
def export_user_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """RGPD - Droit d'acces : export complet des donnees de l'utilisateur."""
    links = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    senior_ids = [link.senior_id for link in links]

    # User data
    user_data = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "gdpr_consent": current_user.gdpr_consent,
            "gdpr_consent_date": str(current_user.gdpr_consent_date) if current_user.gdpr_consent_date else None,
            "created_at": str(current_user.created_at),
        },
        "seniors": [],
    }

    for sid in senior_ids:
        senior = db.query(Senior).filter(Senior.id == sid).first()
        if not senior:
            continue

        # Sessions and transcriptions
        sessions_data = []
        sessions = db.query(ConvSession).filter(ConvSession.senior_id == sid).all()
        for s in sessions:
            transcriptions = db.query(Transcription).filter(Transcription.session_id == s.id).all()
            sessions_data.append({
                "id": s.id,
                "started_at": str(s.started_at),
                "ended_at": str(s.ended_at) if s.ended_at else None,
                "duration_seconds": s.duration_seconds,
                "transcriptions": [
                    {
                        "speaker": t.speaker,
                        "content": decrypt_text(t.content_encrypted),
                        "timestamp": str(t.timestamp),
                    }
                    for t in transcriptions
                ],
            })

        # Memories
        memories = db.query(Memory).filter(Memory.senior_id == sid).all()
        memories_data = [
            {
                "title": m.title,
                "summary": decrypt_text(m.summary_encrypted),
                "period": m.period,
                "people": json.loads(m.people) if m.people else [],
                "places": json.loads(m.places) if m.places else [],
                "themes": [t.name for t in m.themes],
                "created_at": str(m.created_at),
            }
            for m in memories
        ]

        # Metrics
        metrics = db.query(CognitiveMetric).filter(CognitiveMetric.senior_id == sid).all()
        metrics_data = [
            {
                "unique_words": m.unique_words,
                "type_token_ratio": m.type_token_ratio,
                "avg_latency_ms": m.avg_latency_ms,
                "recorded_at": str(m.recorded_at),
            }
            for m in metrics
        ]

        user_data["seniors"].append({
            "id": senior.id,
            "first_name": senior.first_name,
            "last_name": senior.last_name,
            "birth_date": str(senior.birth_date) if senior.birth_date else None,
            "sessions": sessions_data,
            "memories": memories_data,
            "cognitive_metrics": metrics_data,
        })

    return JSONResponse(content=user_data)


@router.delete("/delete-account")
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """RGPD - Droit a l'effacement : suppression totale du compte et des donnees."""
    # Get all linked seniors
    links = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()

    for link in links:
        # Check if this user is the only family member for this senior
        other_links = (
            db.query(FamilyMember)
            .filter(FamilyMember.senior_id == link.senior_id, FamilyMember.user_id != current_user.id)
            .count()
        )

        if other_links == 0:
            # Last family member — delete the senior and all their data.
            # The link is removed via Senior.family_members cascade.
            senior = db.query(Senior).filter(Senior.id == link.senior_id).first()
            if senior:
                db.delete(senior)
        else:
            # Senior is shared with other users — keep it, drop only this link.
            # (Deleting the user directly would try to NULL family_members.user_id,
            #  which violates the NOT NULL constraint on both SQLite and Postgres.)
            db.delete(link)

    # All of the user's links are now removed; delete the user itself.
    db.delete(current_user)
    db.commit()

    return {"message": "Compte et donnees supprimees avec succes"}

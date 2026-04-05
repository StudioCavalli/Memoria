from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.encryption import encrypt_text
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.models.user import User
from app.schemas.session import MessageRequest, MessageResponse, SessionCreate, SessionResponse
from app.services.ai_conversation import AIConversationService

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionResponse, status_code=201)
def start_session(data: SessionCreate, db: Session = Depends(get_db)):
    session = ConvSession(senior_id=data.senior_id, status="active")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/message", response_model=MessageResponse)
def send_message(
    session_id: int,
    data: MessageRequest,
    db: Session = Depends(get_db),
):
    session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
    if not session or session.status != "active":
        raise HTTPException(status_code=404, detail="Session introuvable ou terminee")

    last_order = (
        db.query(Transcription)
        .filter(Transcription.session_id == session_id)
        .count()
    )

    # Save user message
    user_transcription = Transcription(
        session_id=session_id,
        speaker="senior",
        content_encrypted=encrypt_text(data.text),
        sequence_order=last_order + 1,
    )
    db.add(user_transcription)

    # Get AI response
    start = time.time()
    ai_service = AIConversationService()
    ai_response = ai_service.get_response(session_id, data.text, db)
    latency_ms = (time.time() - start) * 1000

    # Save AI response
    ai_transcription = Transcription(
        session_id=session_id,
        speaker="ai",
        content_encrypted=encrypt_text(ai_response),
        sequence_order=last_order + 2,
        latency_ms=latency_ms,
    )
    db.add(ai_transcription)
    db.commit()

    return MessageResponse(
        session_id=session_id,
        user_text=data.text,
        ai_response=ai_response,
        latency_ms=round(latency_ms, 2),
    )


@router.post("/{session_id}/end", response_model=SessionResponse)
def end_session(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)

    if session.started_at:
        delta = session.ended_at - session.started_at
        session.duration_seconds = int(delta.total_seconds())

    db.commit()
    db.refresh(session)

    # Trigger post-session pipeline in background (non-blocking)
    background_tasks.add_task(_run_post_session_pipeline, session_id)

    return session


def _run_post_session_pipeline(session_id: int):
    """Post-session processing: extract memories, analyze cognitive metrics, generate summary."""
    from app.core.database import SessionLocal
    from app.services.memory_extraction import MemoryExtractionService

    db = SessionLocal()
    try:
        service = MemoryExtractionService(db)
        service.process_session(session_id)
    except Exception:
        pass  # Don't fail the response if post-processing fails
    finally:
        db.close()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    return session

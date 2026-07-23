from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, verify_senior_access
from app.core.encryption import encrypt_text
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.models.user import User
from app.schemas.session import MessageRequest, MessageResponse, SessionCreate, SessionResponse
from app.services.ai_conversation import AIConversationService
from app.services.session_lifecycle import close_session

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _get_owned_session(session_id: int, current_user: User, db: Session) -> ConvSession:
    """Load a session and verify the current user is linked to its senior."""
    session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    verify_senior_access(session.senior_id, current_user, db)
    return session


@router.post("/start", response_model=SessionResponse, status_code=201)
def start_session(
    data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_senior_access(data.senior_id, current_user, db)
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
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, current_user, db)
    if session.status != "active":
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, current_user, db)
    # Marks completed, computes duration, and enqueues the durable post-session
    # pipeline. Same path used by the server-side stale-session safety net.
    close_session(db, session)
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_session(session_id, current_user, db)

"""Audio file upload and streaming endpoints for sessions."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, verify_senior_access
from app.models.session import Session as ConvSession
from app.models.user import User
from app.services.storage_service import StorageService

router = APIRouter(prefix="/sessions", tags=["audio"])


def _get_owned_session(session_id: int, current_user: User, db: Session) -> ConvSession:
    session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    verify_senior_access(session.senior_id, current_user, db)
    return session


@router.post("/{session_id}/audio")
async def upload_session_audio(
    session_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload the audio recording of a session."""
    session = _get_owned_session(session_id, current_user, db)

    audio_data = await file.read()
    format = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "webm"

    storage = StorageService()
    url = storage.upload_audio(session_id, audio_data, format)

    session.audio_url = url
    db.commit()

    return {"audio_url": url}


@router.get("/{session_id}/audio")
def get_session_audio(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get/stream the audio recording of a session."""
    session = _get_owned_session(session_id, current_user, db)
    if not session.audio_url:
        raise HTTPException(status_code=404, detail="Audio introuvable")

    return RedirectResponse(url=session.audio_url)

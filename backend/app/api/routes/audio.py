"""Audio file upload and streaming endpoints for sessions."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.session import Session as ConvSession
from app.services.storage_service import StorageService

router = APIRouter(prefix="/sessions", tags=["audio"])


@router.post("/{session_id}/audio")
async def upload_session_audio(session_id: int, file: UploadFile, db: Session = Depends(get_db)):
    """Upload the audio recording of a session."""
    session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    audio_data = await file.read()
    format = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "webm"

    storage = StorageService()
    url = storage.upload_audio(session_id, audio_data, format)

    session.audio_url = url
    db.commit()

    return {"audio_url": url}


@router.get("/{session_id}/audio")
def get_session_audio(session_id: int, db: Session = Depends(get_db)):
    """Get/stream the audio recording of a session."""
    session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
    if not session or not session.audio_url:
        raise HTTPException(status_code=404, detail="Audio introuvable")

    return RedirectResponse(url=session.audio_url)

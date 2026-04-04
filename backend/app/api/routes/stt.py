from __future__ import annotations

from fastapi import APIRouter, UploadFile
from fastapi.responses import JSONResponse

from app.services.stt_service import STTService

router = APIRouter(prefix="/stt", tags=["speech"])


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile):
    """Transcribe an audio file to text."""
    audio_data = await file.read()
    format = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "webm"

    stt = STTService()
    text = await stt.transcribe(audio_data, format)

    return JSONResponse(content={"text": text})

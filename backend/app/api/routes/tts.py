from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.models.user import User
from app.services.tts_service import TTSService

router = APIRouter(prefix="/tts", tags=["speech"])


class SynthesizeRequest(BaseModel):
    text: str


@router.post("/synthesize")
async def synthesize_speech(
    data: SynthesizeRequest,
    current_user: User = Depends(get_current_user),
):
    """Convert text to audio (full synthesis, returns mp3)."""
    tts = TTSService()
    audio = await tts.synthesize(data.text)
    return Response(content=audio, media_type="audio/mpeg")


@router.post("/stream")
async def stream_speech(
    data: SynthesizeRequest,
    current_user: User = Depends(get_current_user),
):
    """Stream audio chunks for low-latency playback."""
    tts = TTSService()
    return StreamingResponse(
        tts.synthesize_stream(data.text),
        media_type="audio/mpeg",
    )

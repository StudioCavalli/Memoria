from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from app.services.tts_service import TTSService

router = APIRouter(prefix="/tts", tags=["speech"])


class SynthesizeRequest(BaseModel):
    text: str


@router.post("/synthesize")
async def synthesize_speech(data: SynthesizeRequest):
    """Convert text to audio (full synthesis, returns mp3)."""
    tts = TTSService()
    audio = await tts.synthesize(data.text)
    return Response(content=audio, media_type="audio/mpeg")


@router.post("/stream")
async def stream_speech(data: SynthesizeRequest):
    """Stream audio chunks for low-latency playback."""
    tts = TTSService()
    return StreamingResponse(
        tts.synthesize_stream(data.text),
        media_type="audio/mpeg",
    )

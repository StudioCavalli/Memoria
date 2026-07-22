from __future__ import annotations

import tempfile
from pathlib import Path

from app.core.config import settings


class STTService:
    """Speech-to-Text service supporting Whisper API and Azure Speech."""

    async def transcribe(self, audio_data: bytes, format: str = "webm") -> str:
        """Transcribe audio bytes to text."""
        if settings.openai_api_key:
            return await self._whisper_transcribe(audio_data, format)
        elif settings.azure_speech_key:
            return await self._azure_transcribe(audio_data, format)
        else:
            raise RuntimeError("Aucun service STT configure (OPENAI_API_KEY ou AZURE_SPEECH_KEY requis)")

    async def transcribe_chunk(self, audio_chunk: bytes, format: str = "webm") -> str:
        """Transcribe a single audio chunk (for streaming)."""
        return await self.transcribe(audio_chunk, format)

    async def _whisper_transcribe(self, audio_data: bytes, format: str) -> str:
        """Transcribe using OpenAI Whisper API."""
        import httpx

        suffix = f".{format}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = Path(tmp.name)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                    files={"file": (f"audio{suffix}", open(tmp_path, "rb"), f"audio/{format}")},
                    data={
                        "model": "whisper-1",
                        "language": "fr",
                        "response_format": "text",
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.text.strip()
        finally:
            tmp_path.unlink(missing_ok=True)

    async def _azure_transcribe(self, audio_data: bytes, format: str) -> str:
        """Transcribe using Azure Speech Services."""
        import httpx

        url = (
            f"https://{settings.azure_speech_region}.stt.speech.microsoft.com"
            f"/speech/recognition/conversation/cognitiveservices/v1"
            f"?language=fr-FR"
        )

        content_type_map = {
            "wav": "audio/wav",
            "webm": "audio/webm",
            "ogg": "audio/ogg",
            "mp3": "audio/mpeg",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers={
                    "Ocp-Apim-Subscription-Key": settings.azure_speech_key,
                    "Content-Type": content_type_map.get(format, "audio/wav"),
                },
                content=audio_data,
                timeout=30.0,
            )
            response.raise_for_status()
            result = response.json()

            if result.get("RecognitionStatus") == "Success":
                return result["DisplayText"]
            return ""

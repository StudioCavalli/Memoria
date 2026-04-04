from __future__ import annotations

import hashlib
from collections.abc import AsyncIterator

from app.core.config import settings

# Simple in-memory cache for frequently used phrases
_tts_cache: dict[str, bytes] = {}
_CACHE_MAX_SIZE = 50

CACHED_PHRASES = [
    "Bonjour, comment allez-vous aujourd'hui ?",
    "C'est tres interessant, continuez.",
    "Pouvez-vous m'en dire un peu plus ?",
    "Merci beaucoup pour ce beau souvenir.",
    "Prenons une petite pause si vous le souhaitez.",
    "Je suis la quand vous serez pret a continuer.",
]


class TTSService:
    """Text-to-Speech service supporting ElevenLabs and Azure Neural TTS."""

    async def synthesize(self, text: str) -> bytes:
        """Convert text to audio bytes (full synthesis)."""
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if cache_key in _tts_cache:
            return _tts_cache[cache_key]

        if settings.elevenlabs_api_key:
            audio = await self._elevenlabs_synthesize(text)
        elif settings.azure_speech_key:
            audio = await self._azure_synthesize(text)
        else:
            raise RuntimeError("Aucun service TTS configure (ELEVENLABS_API_KEY ou AZURE_SPEECH_KEY requis)")

        # Cache short phrases
        if len(text) < 200 and len(_tts_cache) < _CACHE_MAX_SIZE:
            _tts_cache[cache_key] = audio

        return audio

    async def synthesize_stream(self, text: str) -> AsyncIterator[bytes]:
        """Stream audio chunks for low-latency playback."""
        if settings.elevenlabs_api_key:
            async for chunk in self._elevenlabs_stream(text):
                yield chunk
        else:
            # Fallback to full synthesis then yield
            audio = await self.synthesize(text)
            yield audio

    async def warm_up(self):
        """Pre-cache frequently used phrases for instant playback."""
        for phrase in CACHED_PHRASES:
            try:
                await self.synthesize(phrase)
            except Exception:
                pass

    # --- ElevenLabs ---

    async def _elevenlabs_synthesize(self, text: str) -> bytes:
        import httpx

        # Default to a warm French female voice
        voice_id = "EXAVITQu4vr4xnSDxMaL"  # "Sarah" — natural and warm

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.75,
                        "similarity_boost": 0.75,
                        "style": 0.3,
                        "use_speaker_boost": True,
                    },
                },
                timeout=15.0,
            )
            response.raise_for_status()
            return response.content

    async def _elevenlabs_stream(self, text: str) -> AsyncIterator[bytes]:
        import httpx

        voice_id = "EXAVITQu4vr4xnSDxMaL"

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.75,
                        "similarity_boost": 0.75,
                        "style": 0.3,
                        "use_speaker_boost": True,
                    },
                    "output_format": "mp3_44100_128",
                },
                timeout=15.0,
            ) as response:
                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk

    # --- Azure Neural TTS ---

    async def _azure_synthesize(self, text: str) -> bytes:
        import httpx

        url = (
            f"https://{settings.azure_speech_region}.tts.speech.microsoft.com"
            f"/cognitiveservices/v1"
        )

        ssml = f"""
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fr-FR'>
            <voice name='fr-FR-DeniseNeural'>
                <prosody rate='-10%' pitch='-5%'>
                    {text}
                </prosody>
            </voice>
        </speak>
        """

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers={
                    "Ocp-Apim-Subscription-Key": settings.azure_speech_key,
                    "Content-Type": "application/ssml+xml",
                    "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
                },
                content=ssml.strip(),
                timeout=15.0,
            )
            response.raise_for_status()
            return response.content

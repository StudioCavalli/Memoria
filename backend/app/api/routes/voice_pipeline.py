"""
WebSocket voice pipeline: audio in → STT → LLM → TTS → audio out.
Optimized for < 1.5s total latency using streaming at every stage.
"""
from __future__ import annotations

import asyncio
import json
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session as DBSession

from app.core.database import SessionLocal
from app.core.deps import get_user_from_token, user_has_senior_access
from app.core.encryption import encrypt_text
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.services.ai_conversation import AIConversationService
from app.services.stt_service import STTService
from app.services.tts_service import TTSService

router = APIRouter(tags=["voice"])


@router.websocket("/ws/voice/{session_id}")
async def voice_pipeline(websocket: WebSocket, session_id: int, token: str | None = None):
    """
    Bidirectional WebSocket voice pipeline.

    Client sends: binary audio chunks (during recording)
    Client sends: JSON {"action": "end_turn"} when senior stops speaking
    Client sends: JSON {"action": "interrupt"} to stop AI response
    Client sends: JSON {"action": "end_session"} to close

    Server sends: JSON {"type": "transcription", "text": "..."} after STT
    Server sends: binary audio chunks (TTS response)
    Server sends: JSON {"type": "response_text", "text": "..."} full AI text
    Server sends: JSON {"type": "status", "status": "listening|thinking|speaking|idle"}
    Server sends: JSON {"type": "latency", "stt_ms": N, "llm_ms": N, "tts_ms": N, "total_ms": N}
    Server sends: JSON {"type": "silence_detected"} after 30s of no audio
    """
    await websocket.accept()

    db = SessionLocal()
    stt = STTService()
    ai = AIConversationService()
    tts = TTSService()

    audio_buffer = bytearray()
    is_interrupted = False
    last_audio_time = time.time()

    try:
        # Validate session
        session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
        if not session or session.status != "active":
            await websocket.send_json({"type": "error", "message": "Session invalide"})
            await websocket.close()
            return

        # Authenticate: the token must belong to a user linked to this senior
        user = get_user_from_token(token, db)
        if user is None or not user_has_senior_access(user, session.senior_id, db):
            await websocket.send_json({"type": "error", "message": "Non autorise"})
            await websocket.close(code=1008)
            return

        await websocket.send_json({"type": "status", "status": "idle"})

        # Send initial greeting if no transcriptions yet
        count = db.query(Transcription).filter(Transcription.session_id == session_id).count()
        if count == 0:
            await _send_greeting(websocket, session, tts, db)

        # Silence detection task
        silence_task = asyncio.create_task(_silence_detector(websocket, lambda: last_audio_time))

        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                # Audio chunk received
                audio_buffer.extend(message["bytes"])
                last_audio_time = time.time()

            elif "text" in message:
                data = json.loads(message["text"])
                action = data.get("action")

                if action == "end_turn":
                    # Process the collected audio
                    if audio_buffer:
                        is_interrupted = False
                        await _process_turn(
                            websocket, bytes(audio_buffer), session_id,
                            session.senior_id, stt, ai, tts, db,
                            lambda: is_interrupted,
                        )
                        audio_buffer.clear()

                elif action == "interrupt":
                    is_interrupted = True
                    await websocket.send_json({"type": "status", "status": "idle"})

                elif action == "end_session":
                    break

        silence_task.cancel()

    except WebSocketDisconnect:
        pass
    finally:
        db.close()


async def _process_turn(
    websocket: WebSocket,
    audio_data: bytes,
    session_id: int,
    senior_id: int,
    stt: STTService,
    ai: AIConversationService,
    tts: TTSService,
    db: DBSession,
    is_interrupted: callable,
):
    """Process one full turn: STT → LLM → TTS."""
    total_start = time.time()

    # --- STT ---
    await websocket.send_json({"type": "status", "status": "listening"})
    stt_start = time.time()
    user_text = await stt.transcribe(audio_data)
    stt_ms = (time.time() - stt_start) * 1000

    if not user_text.strip():
        await websocket.send_json({"type": "status", "status": "idle"})
        return

    await websocket.send_json({"type": "transcription", "text": user_text})

    # Save user transcription
    last_order = db.query(Transcription).filter(Transcription.session_id == session_id).count()
    user_trans = Transcription(
        session_id=session_id,
        speaker="senior",
        content_encrypted=encrypt_text(user_text),
        sequence_order=last_order + 1,
    )
    db.add(user_trans)
    db.flush()

    # --- LLM ---
    await websocket.send_json({"type": "status", "status": "thinking"})
    llm_start = time.time()

    full_response = ""
    sentence_buffer = ""

    tts_start = None
    tts_total_ms = 0

    async for chunk in ai.get_response_stream(session_id, user_text, db):
        if is_interrupted():
            break

        full_response += chunk
        sentence_buffer += chunk

        # Stream TTS sentence by sentence for low latency
        if any(sentence_buffer.endswith(p) for p in [".", "!", "?", "...", "\n"]):
            if tts_start is None:
                llm_ms = (time.time() - llm_start) * 1000
                tts_start = time.time()
                await websocket.send_json({"type": "status", "status": "speaking"})

            # Stream TTS audio
            async for audio_chunk in tts.synthesize_stream(sentence_buffer.strip()):
                if is_interrupted():
                    break
                await websocket.send_bytes(audio_chunk)

            sentence_buffer = ""

    # Flush remaining text
    if sentence_buffer.strip() and not is_interrupted():
        if tts_start is None:
            llm_ms = (time.time() - llm_start) * 1000
            tts_start = time.time()
            await websocket.send_json({"type": "status", "status": "speaking"})

        async for audio_chunk in tts.synthesize_stream(sentence_buffer.strip()):
            if is_interrupted():
                break
            await websocket.send_bytes(audio_chunk)

    if tts_start is None:
        llm_ms = (time.time() - llm_start) * 1000
    tts_total_ms = (time.time() - tts_start) * 1000 if tts_start else 0

    total_ms = (time.time() - total_start) * 1000

    # Save AI transcription
    if full_response:
        ai_trans = Transcription(
            session_id=session_id,
            speaker="ai",
            content_encrypted=encrypt_text(full_response),
            sequence_order=last_order + 2,
            latency_ms=total_ms,
        )
        db.add(ai_trans)
        db.commit()

    # Send metadata
    await websocket.send_json({"type": "response_text", "text": full_response})
    await websocket.send_json({
        "type": "latency",
        "stt_ms": round(stt_ms, 1),
        "llm_ms": round(llm_ms, 1),
        "tts_ms": round(tts_total_ms, 1),
        "total_ms": round(total_ms, 1),
    })
    await websocket.send_json({"type": "status", "status": "idle"})


async def _send_greeting(websocket: WebSocket, session: ConvSession, tts: TTSService, db: DBSession):
    """Send an initial greeting at the start of a session."""
    from datetime import datetime, timezone

    hour = datetime.now(timezone.utc).hour
    if hour < 12:
        greeting = "Bonjour ! Comment allez-vous ce matin ? Je suis Memoria, et j'adorerais que vous me racontiez un souvenir."
    elif hour < 18:
        greeting = "Bon apres-midi ! Je suis Memoria. J'aimerais beaucoup que vous me parliez d'un moment qui vous a marque."
    else:
        greeting = "Bonsoir ! Je suis Memoria. Racontez-moi un beau souvenir de votre journee ou de votre vie."

    await websocket.send_json({"type": "status", "status": "speaking"})
    await websocket.send_json({"type": "response_text", "text": greeting})

    try:
        async for chunk in tts.synthesize_stream(greeting):
            await websocket.send_bytes(chunk)
    except Exception:
        pass

    # Save greeting as transcription
    greeting_trans = Transcription(
        session_id=session.id,
        speaker="ai",
        content_encrypted=encrypt_text(greeting),
        sequence_order=0,
    )
    db.add(greeting_trans)
    db.commit()

    await websocket.send_json({"type": "status", "status": "idle"})


async def _silence_detector(websocket: WebSocket, get_last_audio_time: callable):
    """Detect 30s silence and prompt the senior with a new question."""
    while True:
        await asyncio.sleep(5)
        elapsed = time.time() - get_last_audio_time()
        if elapsed > 30:
            try:
                await websocket.send_json({"type": "silence_detected"})
            except Exception:
                break

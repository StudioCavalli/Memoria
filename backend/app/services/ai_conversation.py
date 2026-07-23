from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.encryption import decrypt_text
from app.models.memory import Memory
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription

SYSTEM_PROMPT = """Tu es Memoria, un biographe bienveillant et chaleureux.
Tu parles avec une personne agee pour recueillir ses souvenirs de vie.

Regles :
- Pose des questions ouvertes sur l'enfance, le travail, les passions, la famille, les voyages.
- Ne donne jamais d'ordres. Sois doux, patient et encourage la personne a raconter.
- Utilise le vouvoiement.
- Si la personne semble fatiguee ou confuse, propose gentiment de faire une pause.
- Relance avec des sous-questions quand un souvenir interessant emerge.
- Varie les themes pour ne pas lasser.
- Tes reponses doivent etre courtes (2-3 phrases max) pour maintenir un dialogue naturel.
- Ne repete jamais une question deja posee dans la conversation.
- Si le senior mentionne un souvenir deja collecte, approfondis un aspect different.
"""


class AIConversationService:
    def get_response(self, session_id: int, user_text: str, db: Session) -> str:
        messages = self._build_messages(session_id, user_text, db)
        system_prompt = self._system_prompt_for_session(session_id, db)

        if settings.anthropic_api_key:
            return self._call_anthropic(messages, system_prompt)
        elif settings.openai_api_key:
            return self._call_openai(messages, system_prompt)
        else:
            return self._fallback_response()

    async def get_response_stream(self, session_id: int, user_text: str, db: Session) -> AsyncIterator[str]:
        """Stream the LLM response token by token for low-latency TTS pipeline."""
        messages = self._build_messages(session_id, user_text, db)
        system_prompt = self._system_prompt_for_session(session_id, db)

        if settings.anthropic_api_key:
            async for chunk in self._stream_anthropic(messages, system_prompt):
                yield chunk
        elif settings.openai_api_key:
            async for chunk in self._stream_openai(messages, system_prompt):
                yield chunk
        else:
            yield self._fallback_response()

    def _system_prompt_for_session(self, session_id: int, db: Session) -> str:
        """System prompt enriched with the senior's already-collected memories,
        so the biographer avoids repeating topics and deepens them instead."""
        session = db.query(ConvSession).filter(ConvSession.id == session_id).first()
        senior_id = session.senior_id if session else None
        return self._get_system_prompt(senior_id, db)

    def _build_messages(self, session_id: int, user_text: str, db: Session) -> list[dict]:
        # Get conversation history
        transcriptions = (
            db.query(Transcription)
            .filter(Transcription.session_id == session_id)
            .order_by(Transcription.sequence_order)
            .all()
        )

        messages = []
        for t in transcriptions:
            role = "user" if t.speaker == "senior" else "assistant"
            messages.append({"role": role, "content": decrypt_text(t.content_encrypted)})

        messages.append({"role": "user", "content": user_text})
        return messages

    def _build_memory_context(self, senior_id: int, db: Session) -> str:
        """Build context from previously collected memories to avoid repetition."""
        memories = (
            db.query(Memory)
            .filter(Memory.senior_id == senior_id)
            .order_by(Memory.created_at.desc())
            .limit(20)
            .all()
        )
        if not memories:
            return ""

        context = "\n\nSouvenirs deja collectes (ne repete pas ces sujets, approfondis plutot) :\n"
        for m in memories:
            context += f"- {m.title} ({m.period or 'periode inconnue'})\n"
        return context

    def _get_system_prompt(self, senior_id: int | None = None, db: Session | None = None) -> str:
        prompt = SYSTEM_PROMPT
        if senior_id and db:
            prompt += self._build_memory_context(senior_id, db)
        return prompt

    # --- Synchronous calls ---

    def _call_anthropic(self, messages: list[dict], system: str = SYSTEM_PROMPT) -> str:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=300,
            # Sonnet 5 runs adaptive thinking by default; disable it to keep the
            # real-time voice pipeline low-latency and the token budget intact.
            thinking={"type": "disabled"},
            system=system,
            messages=messages,
        )
        return response.content[0].text

    def _call_openai(self, messages: list[dict], system: str = SYSTEM_PROMPT) -> str:
        import httpx

        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={
                "model": "gpt-4o",
                "messages": [{"role": "system", "content": system}] + messages,
                "max_tokens": 300,
                "temperature": 0.8,
            },
            timeout=10.0,
        )
        return response.json()["choices"][0]["message"]["content"]

    # --- Streaming calls (for low-latency pipeline) ---

    async def _stream_anthropic(self, messages: list[dict], system: str = SYSTEM_PROMPT) -> AsyncIterator[str]:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        async with client.messages.stream(
            model=settings.anthropic_model,
            max_tokens=300,
            thinking={"type": "disabled"},  # low-latency voice pipeline
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def _stream_openai(self, messages: list[dict], system: str = SYSTEM_PROMPT) -> AsyncIterator[str]:
        import httpx

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "system", "content": system}] + messages,
                    "max_tokens": 300,
                    "temperature": 0.8,
                    "stream": True,
                },
                timeout=10.0,
            ) as response:
                import json

                async for line in response.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        data = json.loads(line[6:])
                        delta = data["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta

    def _fallback_response(self) -> str:
        return (
            "C'est tres interessant ce que vous me racontez. "
            "Pouvez-vous m'en dire un peu plus ? "
            "Je suis vraiment curieux d'en apprendre davantage sur votre histoire."
        )

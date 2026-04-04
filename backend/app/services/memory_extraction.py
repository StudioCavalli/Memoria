"""
Memory extraction pipeline: transcription → summary → thematic classification.
Runs as a post-session async job.
"""
from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.encryption import decrypt_text, encrypt_text
from app.models.memory import Memory
from app.models.session import Session as ConvSession
from app.models.theme import Theme
from app.models.transcription import Transcription

EXTRACTION_PROMPT = """Analyse cette conversation entre un biographe IA et une personne agee.
Extrais les souvenirs distincts mentionnes.

Pour chaque souvenir, retourne un objet JSON avec :
- "title": titre court du souvenir (max 10 mots)
- "summary": resume en 2-3 phrases, ecrit a la troisieme personne
- "period": periode temporelle ("Enfance", "Annees 50", "Annees 60", "Vie adulte", etc.)
- "year_approx": annee approximative si mentionnee (int ou null)
- "people": liste des noms de personnes mentionnees
- "places": liste des lieux mentionnes
- "themes": liste de themes parmi [Enfance, Adolescence, Famille, Travail, Voyages, Passions, Cuisine, Fetes, Histoire, Vie quotidienne]
- "emotion": emotion dominante ("joie", "nostalgie", "fierte", "tristesse", "humour", "tendresse")

Retourne UNIQUEMENT un tableau JSON valide. Si aucun souvenir clair, retourne [].
Ne retourne aucun texte avant ou apres le JSON.
"""

SUMMARY_PROMPT = """Resume cette session de conversation entre Memoria (IA biographe) et une personne agee.
Ecris un paragraphe de 3-4 phrases qui capture l'essence des souvenirs partages.
Le resume doit etre chaleureux et ecrit a la troisieme personne.
"""

DEDUP_PROMPT = """Compare ce nouveau souvenir avec les souvenirs existants.
Nouveau souvenir : {new_memory}

Souvenirs existants :
{existing_memories}

Le nouveau souvenir est-il un doublon d'un souvenir existant ?
Reponds UNIQUEMENT par "OUI" ou "NON".
"""


class MemoryExtractionService:
    def __init__(self, db: Session):
        self.db = db

    def process_session(self, session_id: int) -> dict:
        """Full post-session pipeline: extract memories + generate summary + analyze."""
        memories = self.extract_from_session(session_id)
        summary = self.generate_session_summary(session_id)

        # Update session summary
        session = self.db.query(ConvSession).filter(ConvSession.id == session_id).first()
        if session and summary:
            session.summary = summary
            self.db.commit()

        # Trigger cognitive analysis
        from app.services.semantic_analysis import SemanticAnalysisService
        analyzer = SemanticAnalysisService()
        if session:
            analyzer.analyze_session(session_id, session.senior_id, self.db)

        return {
            "memories_extracted": len(memories),
            "summary": summary,
        }

    def extract_from_session(self, session_id: int) -> list[Memory]:
        """Extract distinct memories from a session's transcriptions."""
        transcriptions = (
            self.db.query(Transcription)
            .filter(Transcription.session_id == session_id)
            .order_by(Transcription.sequence_order)
            .all()
        )

        if not transcriptions:
            return []

        conversation = "\n".join(
            f"{'Senior' if t.speaker == 'senior' else 'Memoria'}: {decrypt_text(t.content_encrypted)}"
            for t in transcriptions
        )

        session = self.db.query(ConvSession).filter(ConvSession.id == session_id).first()
        if not session:
            return []

        extracted = self._call_extraction_llm(conversation)
        memories = []

        for item in extracted:
            # Deduplication check
            if self._is_duplicate(session.senior_id, item):
                continue

            theme_names = item.get("themes", [])
            themes = self.db.query(Theme).filter(Theme.name.in_(theme_names)).all()

            memory = Memory(
                senior_id=session.senior_id,
                session_id=session_id,
                title=item["title"],
                summary_encrypted=encrypt_text(item["summary"]),
                period=item.get("period"),
                people=json.dumps(item.get("people", []), ensure_ascii=False),
                places=json.dumps(item.get("places", []), ensure_ascii=False),
                themes=themes,
            )
            self.db.add(memory)
            memories.append(memory)

        self.db.commit()
        return memories

    def generate_session_summary(self, session_id: int) -> str | None:
        """Generate a human-readable summary of the session."""
        transcriptions = (
            self.db.query(Transcription)
            .filter(Transcription.session_id == session_id)
            .order_by(Transcription.sequence_order)
            .all()
        )

        if not transcriptions:
            return None

        conversation = "\n".join(
            f"{'Senior' if t.speaker == 'senior' else 'Memoria'}: {decrypt_text(t.content_encrypted)}"
            for t in transcriptions
        )

        if not settings.anthropic_api_key:
            return None

        import anthropic
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=SUMMARY_PROMPT,
            messages=[{"role": "user", "content": conversation}],
        )
        return response.content[0].text

    def _is_duplicate(self, senior_id: int, new_item: dict) -> bool:
        """Check if a memory is a duplicate of an existing one."""
        existing = (
            self.db.query(Memory)
            .filter(Memory.senior_id == senior_id)
            .order_by(Memory.created_at.desc())
            .limit(30)
            .all()
        )

        if not existing:
            return False

        # Simple title similarity check (avoid LLM call for performance)
        new_title = new_item.get("title", "").lower()
        for m in existing:
            if m.title.lower() == new_title:
                return True
            # Check for high word overlap
            new_words = set(new_title.split())
            existing_words = set(m.title.lower().split())
            if len(new_words) > 2 and len(new_words & existing_words) / len(new_words) > 0.7:
                return True

        return False

    def _call_extraction_llm(self, conversation: str) -> list[dict]:
        """Call LLM to extract structured memories from conversation text."""
        if not settings.anthropic_api_key:
            return []

        import anthropic
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=EXTRACTION_PROMPT,
            messages=[{"role": "user", "content": conversation}],
        )
        text = response.content[0].text

        try:
            start = text.find("[")
            end = text.rfind("]") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except (json.JSONDecodeError, ValueError):
            pass
        return []

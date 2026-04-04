"""
Semantic and cognitive analysis service.
Tracks vocabulary richness, response latency, and named entities per session.
Uses spaCy for NLP when available, falls back to regex-based analysis.
"""
from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.core.encryption import decrypt_text
from app.models.cognitive_metric import CognitiveMetric
from app.models.transcription import Transcription

# French stop words to exclude from unique word count
FRENCH_STOP_WORDS = {
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "en",
    "que", "qui", "dans", "ce", "il", "ne", "se", "pas", "plus", "son",
    "sur", "au", "avec", "tout", "mais", "par", "pour", "ou", "je", "me",
    "nous", "vous", "on", "lui", "leur", "y", "mon", "ma", "mes", "ton",
    "ta", "tes", "sa", "ses", "notre", "votre", "ca", "a", "ai", "dit",
    "fait", "bien", "oui", "non", "tres", "aussi", "alors", "comme",
    "quand", "si", "avait", "etait", "cette", "ces", "moi", "elle",
}

EVASIVE_PATTERNS = [
    "je sais pas", "je ne sais pas", "aucune idee", "je me souviens pas",
    "je ne me souviens pas", "je me rappelle pas", "je ne me rappelle pas",
    "je ne sais plus", "bof", "peut-etre", "je sais plus",
]


class SemanticAnalysisService:
    def __init__(self):
        self._nlp = None

    def _get_nlp(self):
        """Lazy-load spaCy French model."""
        if self._nlp is None:
            try:
                import spacy
                self._nlp = spacy.load("fr_core_news_sm")
            except (ImportError, OSError):
                self._nlp = False  # Mark as unavailable
        return self._nlp if self._nlp is not False else None

    def analyze_session(self, session_id: int, senior_id: int, db: Session) -> CognitiveMetric:
        """Analyze a complete session and store cognitive metrics."""
        transcriptions = (
            db.query(Transcription)
            .filter(Transcription.session_id == session_id, Transcription.speaker == "senior")
            .order_by(Transcription.sequence_order)
            .all()
        )

        if not transcriptions:
            return self._empty_metric(session_id, senior_id, db)

        # Decrypt all senior text
        texts = [decrypt_text(t.content_encrypted) for t in transcriptions]
        all_text = " ".join(texts)

        # --- Semantic Richness ---
        nlp = self._get_nlp()
        if nlp:
            metrics = self._analyze_with_spacy(nlp, all_text)
        else:
            metrics = self._analyze_with_regex(all_text)

        # --- Response Latency ---
        latencies = [t.latency_ms for t in transcriptions if t.latency_ms is not None]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        max_latency = max(latencies) if latencies else 0
        silence_count = sum(1 for lat in latencies if lat > 10000)

        # --- Evasive Responses ---
        evasive_count = sum(
            1 for text in texts
            if any(p in text.lower() for p in EVASIVE_PATTERNS)
        )

        metric = CognitiveMetric(
            senior_id=senior_id,
            session_id=session_id,
            unique_words=metrics["unique_words"],
            type_token_ratio=round(metrics["type_token_ratio"], 4),
            avg_sentence_length=round(metrics["avg_sentence_length"], 2),
            named_entities_count=metrics["named_entities"],
            avg_latency_ms=round(avg_latency, 2),
            max_latency_ms=round(max_latency, 2),
            silence_count=silence_count,
            evasive_responses=evasive_count,
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

    def _analyze_with_spacy(self, nlp, text: str) -> dict:
        """Full NLP analysis using spaCy."""
        doc = nlp(text)

        # Tokens (excluding punctuation and stop words)
        words = [token.text.lower() for token in doc if token.is_alpha and not token.is_stop]
        unique_words = len(set(words))
        total_words = len(words)

        # Sentences
        sentences = list(doc.sents)
        avg_sentence_length = total_words / len(sentences) if sentences else 0

        # Named entities (persons, places, organizations)
        named_entities = len([ent for ent in doc.ents if ent.label_ in ("PER", "LOC", "ORG", "GPE")])

        return {
            "unique_words": unique_words,
            "type_token_ratio": unique_words / total_words if total_words > 0 else 0,
            "avg_sentence_length": avg_sentence_length,
            "named_entities": named_entities,
        }

    def _analyze_with_regex(self, text: str) -> dict:
        """Fallback analysis without spaCy."""
        words = re.findall(r"\b\w+\b", text.lower())
        content_words = [w for w in words if w not in FRENCH_STOP_WORDS and len(w) > 2]
        unique_words = len(set(content_words))
        total_words = len(content_words)

        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        avg_sentence_length = total_words / len(sentences) if sentences else 0

        # Simple named entity heuristic: capitalized words not at sentence start
        named_entities = 0
        for sent in sentences:
            words_in_sent = sent.split()
            for i, w in enumerate(words_in_sent):
                if i > 0 and w[0].isupper() and w.lower() not in FRENCH_STOP_WORDS:
                    named_entities += 1

        return {
            "unique_words": unique_words,
            "type_token_ratio": unique_words / total_words if total_words > 0 else 0,
            "avg_sentence_length": avg_sentence_length,
            "named_entities": named_entities,
        }

    def _empty_metric(self, session_id: int, senior_id: int, db: Session) -> CognitiveMetric:
        metric = CognitiveMetric(session_id=session_id, senior_id=senior_id)
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

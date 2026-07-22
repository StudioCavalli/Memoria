"""Durable background jobs (Celery).

These replace the old fire-and-forget `except: pass` post-session handling: any
failure (LLM timeout, rate limit, transient DB error) now retries with exponential
backoff instead of silently losing data.
"""
from __future__ import annotations

import logging

from app.core.celery_app import celery_app
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

_RETRY = dict(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=3,
    acks_late=True,
)


@celery_app.task(bind=True, **_RETRY)
def process_session_task(self, session_id: int) -> dict:
    """Post-session pipeline: extract memories, generate summary, cognitive analysis."""
    from app.services.memory_extraction import MemoryExtractionService

    db = SessionLocal()
    try:
        return MemoryExtractionService(db).process_session(session_id)
    finally:
        db.close()


@celery_app.task(bind=True, **_RETRY)
def generate_gazette_task(self, senior_id: int) -> int | None:
    """Generate + email one senior's weekly gazette. Returns the gazette id (or None)."""
    from app.services.gazette_service import GazetteGeneratorService

    db = SessionLocal()
    try:
        gazette = GazetteGeneratorService(db).generate_for_senior(senior_id)
        return gazette.id if gazette else None
    finally:
        db.close()

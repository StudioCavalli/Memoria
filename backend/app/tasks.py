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


@celery_app.task(bind=True, **_RETRY)
def send_alert_email_task(self, senior_id: int, subject: str, body_html: str) -> int:
    """Email a Sentinelle alert to a senior's family members (durable, with retries).

    Runs in a plain sync worker — no event loop — which is exactly why the alert
    service enqueues this instead of firing an async coroutine that never ran.
    Returns the number of emails sent."""
    import httpx

    from app.core.config import settings
    from app.models.user import FamilyMember, User

    if not settings.sendgrid_api_key:
        return 0

    db = SessionLocal()
    try:
        links = (
            db.query(FamilyMember)
            .filter(FamilyMember.senior_id == senior_id, FamilyMember.notify_email.is_(True))
            .all()
        )
        sent = 0
        for link in links:
            user = db.query(User).filter(User.id == link.user_id).first()
            if not user:
                continue
            resp = httpx.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {settings.sendgrid_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "personalizations": [{"to": [{"email": user.email}]}],
                    "from": {"email": settings.gazette_sender_email, "name": "Memoria"},
                    "subject": subject,
                    "content": [{"type": "text/html", "value": body_html}],
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            sent += 1
        return sent
    finally:
        db.close()

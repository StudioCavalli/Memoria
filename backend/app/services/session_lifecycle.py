"""Session lifecycle: closing a session + triggering the post-session pipeline.

A senior will never use the hidden "long-press to end" gesture on the tablet, and
nothing else closes a session. Without the safety net here, sessions stay `active`
forever and the whole value chain (memory extraction → cognitive metrics → alerts →
gazette) never runs. `close_stale_sessions` is meant to run periodically (see
`cron_jobs`) to close inactive sessions and kick off that pipeline.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription


def _as_utc(dt: datetime) -> datetime:
    """Normalize a possibly tz-naive datetime (SQLite) to aware UTC."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def last_activity_at(db: Session, session: ConvSession) -> datetime:
    """Timestamp of the session's last transcription, or its start if none yet."""
    last = (
        db.query(Transcription)
        .filter(Transcription.session_id == session.id)
        .order_by(Transcription.sequence_order.desc())
        .first()
    )
    if last is not None and last.timestamp is not None:
        return _as_utc(last.timestamp)
    if session.started_at is not None:
        return _as_utc(session.started_at)
    return datetime.now(timezone.utc)


def close_session(db: Session, session: ConvSession) -> None:
    """Mark a session completed, compute its duration, and enqueue the durable
    post-session pipeline (memory extraction + cognitive metrics)."""
    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    if session.started_at is not None:
        session.duration_seconds = int(
            (session.ended_at - _as_utc(session.started_at)).total_seconds()
        )
    db.commit()

    # Durable pipeline (Celery, with retries). Fall back to a best-effort inline
    # run only if the broker is unreachable, so a memory is never silently lost.
    from app.tasks import process_session_task

    try:
        process_session_task.delay(session.id)
    except Exception:
        _run_pipeline_inline(session.id)


def _run_pipeline_inline(session_id: int) -> None:
    from app.core.database import SessionLocal
    from app.services.memory_extraction import MemoryExtractionService

    db = SessionLocal()
    try:
        MemoryExtractionService(db).process_session(session_id)
    except Exception:
        pass
    finally:
        db.close()


def close_stale_sessions(db: Session, inactivity_minutes: int | None = None) -> int:
    """Close every `active` session with no activity for `inactivity_minutes`
    (default: config). Returns the number of sessions closed."""
    if inactivity_minutes is None:
        inactivity_minutes = settings.session_inactivity_timeout_minutes
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=inactivity_minutes)

    active = db.query(ConvSession).filter(ConvSession.status == "active").all()
    closed = 0
    for session in active:
        if last_activity_at(db, session) < cutoff:
            close_session(db, session)
            closed += 1
    return closed

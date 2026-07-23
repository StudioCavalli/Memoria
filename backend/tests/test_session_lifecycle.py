"""Server-side session lifecycle — the safety net that makes the product actually
produce something when the senior never presses the hidden 'end' gesture."""

from datetime import datetime, timedelta, timezone

from app.core.encryption import encrypt_text
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.services.session_lifecycle import close_stale_sessions


def _active_session(db, senior_id, started_minutes_ago):
    started = datetime.now(timezone.utc) - timedelta(minutes=started_minutes_ago)
    s = ConvSession(senior_id=senior_id, status="active", started_at=started)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def test_closes_stale_active_session(client, senior_id, db):
    """An active session idle past the threshold is auto-completed."""
    s = _active_session(db, senior_id, started_minutes_ago=30)

    closed = close_stale_sessions(db, inactivity_minutes=15)

    assert closed == 1
    db.refresh(s)
    assert s.status == "completed"
    assert s.ended_at is not None
    assert s.duration_seconds is not None


def test_keeps_recent_active_session(client, senior_id, db):
    """A freshly-started active session is left alone."""
    s = _active_session(db, senior_id, started_minutes_ago=2)

    closed = close_stale_sessions(db, inactivity_minutes=15)

    assert closed == 0
    db.refresh(s)
    assert s.status == "active"


def test_recent_transcription_keeps_session_open(client, senior_id, db):
    """Even if started long ago, a recent transcription = still ongoing → not closed."""
    s = _active_session(db, senior_id, started_minutes_ago=60)
    db.add(Transcription(
        session_id=s.id,
        speaker="senior",
        content_encrypted=encrypt_text("je vous raconte..."),
        sequence_order=1,
        timestamp=datetime.now(timezone.utc),
    ))
    db.commit()

    closed = close_stale_sessions(db, inactivity_minutes=15)

    assert closed == 0
    db.refresh(s)
    assert s.status == "active"

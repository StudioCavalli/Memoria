"""Tests for GDPR endpoints: data export, account deletion, cascading deletes."""

import json
from datetime import datetime, timedelta, timezone

from app.core.encryption import encrypt_text
from app.models.alert import Alert
from app.models.cognitive_metric import CognitiveMetric
from app.models.gazette import Gazette
from app.models.memory import Memory
from app.models.senior import Senior
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.models.user import FamilyMember, User


def _populate_full_data(db, senior_id):
    """Create sessions, transcriptions, memories, metrics, alerts, gazettes for a senior."""
    now = datetime.now(timezone.utc)

    # Session with transcriptions
    session = ConvSession(
        senior_id=senior_id, status="completed",
        started_at=now - timedelta(hours=3),
        ended_at=now - timedelta(hours=2),
        duration_seconds=3600,
    )
    db.add(session)
    db.flush()

    db.add(Transcription(
        session_id=session.id, speaker="senior",
        content_encrypted=encrypt_text("Je me souviens de mon enfance a Nice."),
        sequence_order=1, latency_ms=1500.0,
    ))
    db.add(Transcription(
        session_id=session.id, speaker="ai",
        content_encrypted=encrypt_text("C'est tres interessant, racontez-moi davantage."),
        sequence_order=2,
    ))

    # Memory
    db.add(Memory(
        senior_id=senior_id, session_id=session.id,
        title="Enfance a Nice",
        summary_encrypted=encrypt_text("Un beau souvenir de la mer Mediterranee."),
        period="Enfance",
        people=json.dumps(["Marie"], ensure_ascii=False),
        places=json.dumps(["Nice"], ensure_ascii=False),
    ))

    # Cognitive metric
    db.add(CognitiveMetric(
        senior_id=senior_id, session_id=session.id,
        unique_words=85, type_token_ratio=0.68,
        avg_sentence_length=11.0, named_entities_count=4,
        avg_latency_ms=1500.0, max_latency_ms=2500.0,
        silence_count=0, evasive_responses=0,
    ))

    # Alert
    db.add(Alert(
        senior_id=senior_id, type="inactivity", severity="low",
        message="Pas de session depuis 3 jours.",
    ))

    # Gazette
    from datetime import date
    db.add(Gazette(
        senior_id=senior_id,
        title="La Gazette de Jeanne",
        pdf_url="https://storage.example.com/gazette.pdf",
        week_start=date.today() - timedelta(days=7),
        week_end=date.today() - timedelta(days=1),
    ))

    db.commit()
    return session.id


def test_gdpr_export_contains_user_data(client, auth_headers, senior_id, db):
    """Export includes user profile data."""
    _populate_full_data(db, senior_id)

    response = client.get("/api/gdpr/export", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["user"]["email"] == "test@memoria.fr"
    assert data["user"]["first_name"] == "Marie"
    assert data["user"]["last_name"] == "Dupont"
    assert data["user"]["gdpr_consent"] is True


def test_gdpr_export_contains_senior_data(client, auth_headers, senior_id, db):
    """Export includes senior profile data."""
    _populate_full_data(db, senior_id)

    response = client.get("/api/gdpr/export", headers=auth_headers)
    data = response.json()

    assert len(data["seniors"]) == 1
    senior = data["seniors"][0]
    assert senior["first_name"] == "Jeanne"
    assert senior["last_name"] == "Martin"


def test_gdpr_export_contains_sessions(client, auth_headers, senior_id, db):
    """Export includes session data with decrypted transcriptions."""
    _populate_full_data(db, senior_id)

    response = client.get("/api/gdpr/export", headers=auth_headers)
    data = response.json()

    senior = data["seniors"][0]
    assert len(senior["sessions"]) >= 1
    session = senior["sessions"][0]
    assert session["duration_seconds"] == 3600
    assert len(session["transcriptions"]) == 2
    # Transcriptions should be decrypted
    texts = [t["content"] for t in session["transcriptions"]]
    assert any("enfance" in t.lower() for t in texts)


def test_gdpr_export_contains_memories(client, auth_headers, senior_id, db):
    """Export includes decrypted memories."""
    _populate_full_data(db, senior_id)

    response = client.get("/api/gdpr/export", headers=auth_headers)
    data = response.json()

    senior = data["seniors"][0]
    assert len(senior["memories"]) >= 1
    mem = senior["memories"][0]
    assert mem["title"] == "Enfance a Nice"
    assert "Mediterranee" in mem["summary"]


def test_gdpr_export_contains_metrics(client, auth_headers, senior_id, db):
    """Export includes cognitive metrics."""
    _populate_full_data(db, senior_id)

    response = client.get("/api/gdpr/export", headers=auth_headers)
    data = response.json()

    senior = data["seniors"][0]
    assert len(senior["cognitive_metrics"]) >= 1
    metric = senior["cognitive_metrics"][0]
    assert metric["unique_words"] == 85


def test_gdpr_export_empty_user(client, auth_headers):
    """Export works even when user has no seniors."""
    response = client.get("/api/gdpr/export", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@memoria.fr"
    assert data["seniors"] == []


def test_gdpr_delete_account(client, auth_headers, senior_id, db):
    """DELETE /gdpr/delete-account removes the user and all data."""
    _populate_full_data(db, senior_id)

    response = client.delete("/api/gdpr/delete-account", headers=auth_headers)
    assert response.status_code == 200
    assert "supprimees" in response.json()["message"].lower()


def test_gdpr_delete_cascades_user(client, auth_headers, senior_id, db):
    """After deletion, the user no longer exists."""
    _populate_full_data(db, senior_id)

    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    users = db.query(User).filter(User.email == "test@memoria.fr").all()
    assert len(users) == 0


def test_gdpr_delete_cascades_senior(client, auth_headers, senior_id, db):
    """After deletion, the senior no longer exists."""
    _populate_full_data(db, senior_id)

    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    seniors = db.query(Senior).filter(Senior.id == senior_id).all()
    assert len(seniors) == 0


def test_gdpr_delete_cascades_sessions(client, auth_headers, senior_id, db):
    """After deletion, all sessions are removed."""
    _populate_full_data(db, senior_id)

    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    sessions = db.query(ConvSession).filter(ConvSession.senior_id == senior_id).all()
    assert len(sessions) == 0


def test_gdpr_delete_cascades_memories(client, auth_headers, senior_id, db):
    """After deletion, all memories are removed."""
    _populate_full_data(db, senior_id)

    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    memories = db.query(Memory).filter(Memory.senior_id == senior_id).all()
    assert len(memories) == 0


def test_gdpr_delete_cascades_metrics(client, auth_headers, senior_id, db):
    """After deletion, all cognitive metrics are removed."""
    _populate_full_data(db, senior_id)

    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    metrics = db.query(CognitiveMetric).filter(CognitiveMetric.senior_id == senior_id).all()
    assert len(metrics) == 0


def test_gdpr_delete_cascades_alerts(client, auth_headers, senior_id, db):
    """After deletion, all alerts are removed."""
    _populate_full_data(db, senior_id)

    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    alerts = db.query(Alert).filter(Alert.senior_id == senior_id).all()
    assert len(alerts) == 0


def test_gdpr_delete_cascades_transcriptions(client, auth_headers, senior_id, db):
    """After deletion, all transcriptions are removed."""
    session_id = _populate_full_data(db, senior_id)

    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    transcriptions = db.query(Transcription).filter(Transcription.session_id == session_id).all()
    assert len(transcriptions) == 0


def test_gdpr_delete_preserves_shared_senior(client, auth_headers, senior_id, db):
    """If another user also links to the senior, the senior is preserved."""
    _populate_full_data(db, senior_id)

    # Create another user linked to the same senior
    other_reg = client.post("/api/auth/register", json={
        "email": "famille@memoria.fr", "password": "password123",
        "first_name": "Pierre", "last_name": "Martin", "gdpr_consent": True,
    })
    other_user_id = db.query(User).filter(User.email == "famille@memoria.fr").first().id

    # Manually create a family link for the other user
    link = FamilyMember(user_id=other_user_id, senior_id=senior_id, role="family")
    db.add(link)
    db.commit()

    # Delete the first user
    client.delete("/api/gdpr/delete-account", headers=auth_headers)

    # Senior should still exist because the other user is linked
    senior = db.query(Senior).filter(Senior.id == senior_id).first()
    assert senior is not None
    assert senior.first_name == "Jeanne"


def test_gdpr_delete_requires_auth(client):
    """Delete endpoint rejects unauthenticated requests."""
    response = client.delete("/api/gdpr/delete-account")
    assert response.status_code == 403

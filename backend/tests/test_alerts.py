"""Tests for alert service: cognitive decline detection, inactivity, deduplication."""

from datetime import datetime, timedelta, timezone

from app.models.alert import Alert
from app.models.cognitive_metric import CognitiveMetric
from app.models.senior import Senior
from app.models.session import Session as ConvSession
from app.services.alert_service import AlertService


def _create_senior_directly(db, first_name="Jeanne", last_name="Martin"):
    """Create a senior directly in the DB (no auth needed)."""
    senior = Senior(first_name=first_name, last_name=last_name, birth_place="Nice")
    db.add(senior)
    db.commit()
    db.refresh(senior)
    return senior


def _create_metrics_pair(db, senior_id, prev_words, recent_words, prev_latency, recent_latency,
                         prev_evasive=1, recent_evasive=1):
    """Create metrics for previous week and recent week to trigger comparisons."""
    now = datetime.now(timezone.utc)

    # Previous week: 3 sessions
    for i in range(3):
        session = ConvSession(
            senior_id=senior_id, status="completed",
            started_at=now - timedelta(days=10 + i),
            ended_at=now - timedelta(days=10 + i, hours=-1),
            duration_seconds=3600,
        )
        db.add(session)
        db.flush()
        db.add(CognitiveMetric(
            senior_id=senior_id, session_id=session.id,
            unique_words=prev_words, type_token_ratio=0.7,
            avg_sentence_length=12.0, named_entities_count=5,
            avg_latency_ms=prev_latency, max_latency_ms=prev_latency + 500,
            silence_count=1, evasive_responses=prev_evasive,
            recorded_at=now - timedelta(days=10 + i),
        ))

    # Recent week: 3 sessions
    for i in range(3):
        session = ConvSession(
            senior_id=senior_id, status="completed",
            started_at=now - timedelta(days=3 + i),
            ended_at=now - timedelta(days=3 + i, hours=-1),
            duration_seconds=3600,
        )
        db.add(session)
        db.flush()
        db.add(CognitiveMetric(
            senior_id=senior_id, session_id=session.id,
            unique_words=recent_words, type_token_ratio=0.5,
            avg_sentence_length=8.0, named_entities_count=2,
            avg_latency_ms=recent_latency, max_latency_ms=recent_latency + 500,
            silence_count=3, evasive_responses=recent_evasive,
            recorded_at=now - timedelta(days=3 + i),
        ))

    db.commit()


def test_cognitive_decline_high_alert(db):
    """Semantic drop >20% AND latency increase >30% creates vigilance_high alert."""
    senior = _create_senior_directly(db)
    # Previous: 100 words, 2000ms; Recent: 60 words (40% drop), 3000ms (50% increase)
    _create_metrics_pair(db, senior.id, prev_words=100, recent_words=60,
                         prev_latency=2000, recent_latency=3000)

    service = AlertService(db)
    service.check_all_seniors()

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "vigilance_high").all()
    assert len(alerts) == 1
    assert alerts[0].severity == "high"
    assert "baisse" in alerts[0].message.lower()


def test_cognitive_decline_semantic_only(db):
    """Semantic drop >20% without latency spike creates medium vigilance alert."""
    senior = _create_senior_directly(db)
    # Words drop 40%, latency stable
    _create_metrics_pair(db, senior.id, prev_words=100, recent_words=60,
                         prev_latency=2000, recent_latency=2200)

    service = AlertService(db)
    service.check_all_seniors()

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "vigilance").all()
    assert len(alerts) == 1
    assert alerts[0].severity == "medium"
    assert "richesse semantique" in alerts[0].message.lower()


def test_cognitive_decline_latency_only(db):
    """Latency increase >30% without semantic drop creates medium alert."""
    senior = _create_senior_directly(db)
    # Words stable, latency increases 50%
    _create_metrics_pair(db, senior.id, prev_words=100, recent_words=95,
                         prev_latency=2000, recent_latency=3100)

    service = AlertService(db)
    service.check_all_seniors()

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "vigilance").all()
    assert len(alerts) == 1
    assert "temps de reponse" in alerts[0].message.lower()


def test_no_alert_when_metrics_stable(db):
    """No alerts created when metrics are stable."""
    senior = _create_senior_directly(db)
    # Create a recent session to prevent inactivity alert
    now = datetime.now(timezone.utc)
    session = ConvSession(
        senior_id=senior.id, status="completed",
        started_at=now - timedelta(hours=5), ended_at=now - timedelta(hours=4),
        duration_seconds=3600,
    )
    db.add(session)
    db.commit()

    _create_metrics_pair(db, senior.id, prev_words=100, recent_words=98,
                         prev_latency=2000, recent_latency=2100)

    service = AlertService(db)
    service.check_all_seniors()

    # Only inactivity-related alerts should not appear, and no cognitive alerts
    cognitive_alerts = db.query(Alert).filter(
        Alert.senior_id == senior.id,
        Alert.type.in_(["vigilance", "vigilance_high"]),
    ).all()
    assert len(cognitive_alerts) == 0


def test_inactivity_alert_no_sessions(db):
    """Alert created when senior has no sessions for 3+ days."""
    senior = _create_senior_directly(db)

    service = AlertService(db)
    service.check_all_seniors()

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "inactivity").all()
    assert len(alerts) == 1
    assert "3 jours" in alerts[0].message


def test_inactivity_alert_old_session(db):
    """Alert created when last session was more than 3 days ago."""
    senior = _create_senior_directly(db)
    old_session = ConvSession(
        senior_id=senior.id, status="completed",
        started_at=datetime.now(timezone.utc) - timedelta(days=5),
        ended_at=datetime.now(timezone.utc) - timedelta(days=5, hours=-1),
    )
    db.add(old_session)
    db.commit()

    service = AlertService(db)
    service.check_all_seniors()

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "inactivity").all()
    assert len(alerts) == 1


def test_no_inactivity_alert_with_recent_session(db):
    """No inactivity alert when a recent session exists."""
    senior = _create_senior_directly(db)
    recent_session = ConvSession(
        senior_id=senior.id, status="active",
        started_at=datetime.now(timezone.utc) - timedelta(hours=12),
    )
    db.add(recent_session)
    db.commit()

    service = AlertService(db)
    service._check_inactivity(senior)

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "inactivity").all()
    assert len(alerts) == 0


def test_deduplication_no_duplicate_within_7_days(db):
    """Same alert type is not created twice within 7 days."""
    senior = _create_senior_directly(db)

    service = AlertService(db)
    # First inactivity check
    service._check_inactivity(senior)
    alerts_1 = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "inactivity").count()
    assert alerts_1 == 1

    # Second check should not create a duplicate
    service._check_inactivity(senior)
    alerts_2 = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "inactivity").count()
    assert alerts_2 == 1


def test_deduplication_allows_after_period(db):
    """Alert can be created again after the deduplication period expires."""
    senior = _create_senior_directly(db)

    # Create an old inactivity alert (4 days ago, beyond 3-day dedup for inactivity)
    old_alert = Alert(
        senior_id=senior.id, type="inactivity", severity="low",
        message="Ancienne alerte",
        created_at=datetime.now(timezone.utc) - timedelta(days=4),
    )
    db.add(old_alert)
    db.commit()

    service = AlertService(db)
    service._check_inactivity(senior)

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "inactivity").all()
    assert len(alerts) == 2


def test_alert_list_endpoint(client, auth_headers, senior_id, db):
    """GET /alerts/ returns alerts for the senior."""
    alert = Alert(
        senior_id=senior_id, type="inactivity", severity="low",
        message="Pas de session depuis 3 jours.", is_read=False,
    )
    db.add(alert)
    db.commit()

    response = client.get(f"/api/alerts/?senior_id={senior_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "inactivity"
    assert data[0]["is_read"] is False


def test_alert_list_unread_only(client, auth_headers, senior_id, db):
    """Filtering unread_only=true excludes read alerts."""
    db.add(Alert(senior_id=senior_id, type="inactivity", severity="low",
                 message="Non lue", is_read=False))
    db.add(Alert(senior_id=senior_id, type="vigilance", severity="medium",
                 message="Deja lue", is_read=True))
    db.commit()

    response = client.get(
        f"/api/alerts/?senior_id={senior_id}&unread_only=true",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["message"] == "Non lue"


def test_mark_alert_read(client, auth_headers, senior_id, db):
    """PUT /alerts/{id}/read marks alert as read."""
    alert = Alert(
        senior_id=senior_id, type="vigilance", severity="medium",
        message="Alerte de test", is_read=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    response = client.put(f"/api/alerts/{alert.id}/read", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["is_read"] is True

    # Verify persistence
    db.refresh(alert)
    assert alert.is_read is True


def test_mark_alert_read_not_found(client, auth_headers):
    """Marking a non-existent alert returns 404."""
    response = client.put("/api/alerts/99999/read", headers=auth_headers)
    assert response.status_code == 404


def test_alert_list_unauthorized(client, senior_id):
    """Alerts endpoint requires authorization and senior link."""
    # Register a different user with no link to this senior
    reg = client.post("/api/auth/register", json={
        "email": "autre@memoria.fr", "password": "password123",
        "first_name": "Autre", "last_name": "Personne", "gdpr_consent": True,
    })
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    response = client.get(f"/api/alerts/?senior_id={senior_id}", headers=other_headers)
    assert response.status_code == 403


def test_evasive_increase_alert(db):
    """Alert created when evasive responses increase >50%."""
    senior = _create_senior_directly(db)
    # Previous: 2 evasive, Recent: 6 evasive (200% increase)
    _create_metrics_pair(db, senior.id, prev_words=100, recent_words=100,
                         prev_latency=2000, recent_latency=2000,
                         prev_evasive=2, recent_evasive=6)
    # Also add a recent session to prevent inactivity alert confusion
    now = datetime.now(timezone.utc)
    s = ConvSession(senior_id=senior.id, status="completed",
                    started_at=now - timedelta(hours=2), ended_at=now - timedelta(hours=1),
                    duration_seconds=3600)
    db.add(s)
    db.commit()

    service = AlertService(db)
    service._check_evasive_increase(senior)

    alerts = db.query(Alert).filter(Alert.senior_id == senior.id, Alert.type == "evasive").all()
    assert len(alerts) == 1
    assert "evasives" in alerts[0].message.lower()

"""Tests for cognitive metrics endpoints and analysis service."""

from datetime import datetime, timedelta, timezone

from app.models.cognitive_metric import CognitiveMetric
from app.models.session import Session as ConvSession
from app.services.cognitive_analysis import CognitiveAnalysisService


def _create_session(db, senior_id, days_ago=0):
    """Helper to create a completed session."""
    now = datetime.now(timezone.utc)
    session = ConvSession(
        senior_id=senior_id, status="completed",
        started_at=now - timedelta(days=days_ago, hours=2),
        ended_at=now - timedelta(days=days_ago, hours=1),
        duration_seconds=3600,
    )
    db.add(session)
    db.flush()
    return session


def _create_metric(db, senior_id, session_id, unique_words=80, ttr=0.65,
                   avg_latency=2000.0, days_ago=0, evasive=1):
    """Helper to create a cognitive metric."""
    metric = CognitiveMetric(
        senior_id=senior_id, session_id=session_id,
        unique_words=unique_words, type_token_ratio=ttr,
        avg_sentence_length=10.0, named_entities_count=5,
        avg_latency_ms=avg_latency, max_latency_ms=avg_latency + 1000,
        silence_count=1, evasive_responses=evasive,
        recorded_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
    )
    db.add(metric)
    db.commit()
    return metric


def test_metrics_history_returns_recent(client, senior_id, db):
    """GET /metrics/history returns metrics within the time range."""
    session = _create_session(db, senior_id, days_ago=2)
    _create_metric(db, senior_id, session.id, days_ago=2)

    response = client.get(f"/api/seniors/{senior_id}/metrics/history?days=7")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["unique_words"] == 80
    assert data[0]["senior_id"] == senior_id


def test_metrics_history_excludes_old(client, senior_id, db):
    """Metrics older than the requested range are excluded."""
    session = _create_session(db, senior_id, days_ago=15)
    _create_metric(db, senior_id, session.id, days_ago=15)

    response = client.get(f"/api/seniors/{senior_id}/metrics/history?days=7")
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_metrics_history_multiple(client, senior_id, db):
    """Multiple metrics are returned in descending order."""
    for days in [1, 3, 5]:
        session = _create_session(db, senior_id, days_ago=days)
        _create_metric(db, senior_id, session.id, unique_words=100 - days * 5, days_ago=days)

    response = client.get(f"/api/seniors/{senior_id}/metrics/history?days=30")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Most recent first
    assert data[0]["unique_words"] == 95  # days_ago=1


def test_metrics_history_days_param(client, senior_id, db):
    """The days parameter controls the time window."""
    s1 = _create_session(db, senior_id, days_ago=2)
    s2 = _create_session(db, senior_id, days_ago=10)
    _create_metric(db, senior_id, s1.id, days_ago=2)
    _create_metric(db, senior_id, s2.id, days_ago=10)

    resp_5 = client.get(f"/api/seniors/{senior_id}/metrics/history?days=5")
    assert len(resp_5.json()) == 1

    resp_30 = client.get(f"/api/seniors/{senior_id}/metrics/history?days=30")
    assert len(resp_30.json()) == 2


def test_metrics_summary_no_data(client, senior_id):
    """Summary with no metrics returns stable defaults and zero vitality."""
    response = client.get(f"/api/seniors/{senior_id}/metrics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["semantic_richness_trend"] == "stable"
    assert data["latency_trend"] == "stable"
    assert data["vitality_score"] == 0
    assert data["sessions_count_7d"] == 0


def test_metrics_summary_with_data(client, senior_id, senior_with_metrics):
    """Summary calculates trends from metrics data."""
    response = client.get(f"/api/seniors/{senior_id}/metrics/summary")
    assert response.status_code == 200
    data = response.json()
    # With declining metrics, semantic trend should be decreasing
    assert data["semantic_richness_trend"] == "decreasing"
    assert data["sessions_count_7d"] >= 1
    assert data["vitality_score"] > 0


def test_trend_calculation_increasing(db):
    """_compute_trend returns 'increasing' for >10% growth."""
    service = CognitiveAnalysisService(db)
    assert service._compute_trend(100, 115) == "increasing"


def test_trend_calculation_decreasing(db):
    """_compute_trend returns 'decreasing' for >10% decline."""
    service = CognitiveAnalysisService(db)
    assert service._compute_trend(100, 85) == "decreasing"


def test_trend_calculation_stable(db):
    """_compute_trend returns 'stable' for changes within 10%."""
    service = CognitiveAnalysisService(db)
    assert service._compute_trend(100, 105) == "stable"
    assert service._compute_trend(100, 95) == "stable"


def test_trend_calculation_zero_baseline(db):
    """_compute_trend returns 'stable' when old value is zero."""
    service = CognitiveAnalysisService(db)
    assert service._compute_trend(0, 50) == "stable"


def test_vitality_score_high(db):
    """Vitality score is high when metrics are good and trend is positive."""
    service = CognitiveAnalysisService(db)
    score = service._compute_vitality(
        avg_words=120, avg_latency=1500,
        semantic_trend="increasing", latency_trend="stable",
    )
    # 50 (base) + 30 (words>100) + 20 (latency<2000) + 5 (increasing) = 105 -> capped at 100
    assert score == 100.0


def test_vitality_score_low(db):
    """Vitality score is low when metrics are poor with declining trends."""
    service = CognitiveAnalysisService(db)
    score = service._compute_vitality(
        avg_words=15, avg_latency=7000,
        semantic_trend="decreasing", latency_trend="decreasing",
    )
    # 50 (base) + 0 (words<20) + 0 (latency>6000) - 15 (decreasing) - 10 (latency decreasing) = 25
    assert score == 25.0


def test_vitality_score_medium(db):
    """Vitality score is moderate for average metrics."""
    service = CognitiveAnalysisService(db)
    score = service._compute_vitality(
        avg_words=60, avg_latency=3000,
        semantic_trend="stable", latency_trend="stable",
    )
    # 50 + 20 (words>50) + 10 (latency<4000) = 80
    assert score == 80.0


def test_metrics_summary_recent_only(client, senior_id, db):
    """Summary only considers recent 7 days for current stats."""
    # Old session with high words
    old_session = _create_session(db, senior_id, days_ago=20)
    _create_metric(db, senior_id, old_session.id, unique_words=200, days_ago=20)

    # Recent session with low words
    recent_session = _create_session(db, senior_id, days_ago=2)
    _create_metric(db, senior_id, recent_session.id, unique_words=30, days_ago=2)

    response = client.get(f"/api/seniors/{senior_id}/metrics/summary")
    data = response.json()
    assert data["avg_unique_words_7d"] == 30.0
    assert data["sessions_count_7d"] == 1

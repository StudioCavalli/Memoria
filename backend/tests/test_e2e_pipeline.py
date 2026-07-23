"""End-to-end data flow: a senior converses → the session is closed → the
post-session pipeline produces cognitive metrics → accumulated decline → the
Sentinelle emails the family.

This is exactly the chain that was silently broken (5.1 / 5.8 / 5.9 in
ARCHITECTURE_REVIEW) and had no test. The pipeline is invoked against the test DB
directly because the eager Celery task uses the app's `SessionLocal` (a separate,
non-test engine) — a known test-infra limitation noted in the review. The *logic*
of every fixed step is exercised here with the real services.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from app.models.alert import Alert
from app.models.cognitive_metric import CognitiveMetric
from app.models.session import Session as ConvSession
from app.services.alert_service import AlertService
from app.services.memory_extraction import MemoryExtractionService
from app.services.session_lifecycle import close_session


def _seed_decline_history(db, senior_id):
    """Backdated metrics: a healthy previous week, a clearly declined recent week."""
    now = datetime.now(timezone.utc)
    for i in range(3):  # previous week — healthy baseline
        s = ConvSession(senior_id=senior_id, status="completed",
                        started_at=now - timedelta(days=11 + i))
        db.add(s)
        db.flush()
        db.add(CognitiveMetric(
            senior_id=senior_id, session_id=s.id,
            unique_words=120, type_token_ratio=0.72, avg_sentence_length=12.0,
            named_entities_count=6, avg_latency_ms=1800, max_latency_ms=2500,
            silence_count=1, evasive_responses=1,
            recorded_at=now - timedelta(days=11 + i),
        ))
    for i in range(3):  # recent week — marked decline
        s = ConvSession(senior_id=senior_id, status="completed",
                        started_at=now - timedelta(days=4 + i))
        db.add(s)
        db.flush()
        db.add(CognitiveMetric(
            senior_id=senior_id, session_id=s.id,
            unique_words=35, type_token_ratio=0.45, avg_sentence_length=7.0,
            named_entities_count=2, avg_latency_ms=3200, max_latency_ms=6000,
            silence_count=4, evasive_responses=5,
            recorded_at=now - timedelta(days=4 + i),
        ))
    db.commit()


def test_e2e_session_to_family_alert(client, senior_id, db):
    # 1. A real conversation session (real endpoints → senior + AI transcriptions)
    started = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()
    sid = started["id"]
    for text in [
        "Je me souviens de mon enfance a Nice, pres de la mer.",
        "Mon pere Jacques etait boulanger dans le vieux village.",
    ]:
        assert client.post(f"/api/sessions/{sid}/message", json={"text": text}).status_code == 200

    # 2. The session ends (5.8: it actually gets closed instead of hanging forever)
    session = db.query(ConvSession).filter(ConvSession.id == sid).first()
    close_session(db, session)
    db.refresh(session)
    assert session.status == "completed"
    assert session.duration_seconds is not None

    # 3. The post-session pipeline runs and produces a cognitive metric
    #    (5.9: the metric row used to never appear in real use)
    MemoryExtractionService(db).process_session(sid)
    metric = db.query(CognitiveMetric).filter(CognitiveMetric.session_id == sid).first()
    assert metric is not None, "the pipeline produced no cognitive metric"

    # 4. With accumulated decline, the Sentinelle runs and emails the family
    #    (5.1: the email used to be a dead coroutine that never ran)
    _seed_decline_history(db, senior_id)
    with patch("app.tasks.send_alert_email_task.delay") as mock_email:
        AlertService(db).check_all_seniors()

    alert = db.query(Alert).filter(
        Alert.senior_id == senior_id,
        Alert.type.in_(["vigilance", "vigilance_high"]),
    ).first()
    assert alert is not None, "the decline produced no cognitive alert"
    assert mock_email.called, "the family was never emailed"
    assert mock_email.call_args.args[0] == senior_id

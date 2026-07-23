"""
Sentinel Alert Service: detects cognitive decline and sends notifications.
Runs daily to analyze trends and create alerts for family members.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.cognitive_metric import CognitiveMetric
from app.models.senior import Senior
from app.models.session import Session as ConvSession

logger = logging.getLogger(__name__)


class AlertService:
    def __init__(self, db: Session):
        self.db = db

    def check_all_seniors(self):
        """Daily check: analyze all seniors and create alerts if needed."""
        seniors = self.db.query(Senior).all()
        for senior in seniors:
            self._check_cognitive_decline(senior)
            self._check_evasive_increase(senior)
            self._check_inactivity(senior)
            self._check_session_duration_drop(senior)

    def _check_cognitive_decline(self, senior: Senior):
        """Alert if semantic richness drops >20% or latency increases >30% over 7 days."""
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)

        recent = self._get_metrics(senior.id, seven_days_ago, now)
        previous = self._get_metrics(senior.id, fourteen_days_ago, seven_days_ago)

        if not recent or not previous:
            return

        avg_words_recent = sum(m.unique_words for m in recent) / len(recent)
        avg_words_prev = sum(m.unique_words for m in previous) / len(previous)
        avg_latency_recent = sum(m.avg_latency_ms for m in recent) / len(recent)
        avg_latency_prev = sum(m.avg_latency_ms for m in previous) / len(previous)
        avg_ttr_recent = sum(m.type_token_ratio for m in recent) / len(recent)
        avg_ttr_prev = sum(m.type_token_ratio for m in previous) / len(previous)

        semantic_drop = (avg_words_prev - avg_words_recent) / avg_words_prev if avg_words_prev > 0 else 0
        latency_increase = (avg_latency_recent - avg_latency_prev) / avg_latency_prev if avg_latency_prev > 0 else 0
        ttr_drop = (avg_ttr_prev - avg_ttr_recent) / avg_ttr_prev if avg_ttr_prev > 0 else 0

        details = json.dumps({
            "semantic_drop_pct": round(semantic_drop * 100, 1),
            "latency_increase_pct": round(latency_increase * 100, 1),
            "ttr_drop_pct": round(ttr_drop * 100, 1),
            "avg_words_recent": round(avg_words_recent, 1),
            "avg_words_previous": round(avg_words_prev, 1),
            "avg_latency_recent_ms": round(avg_latency_recent, 1),
            "avg_latency_previous_ms": round(avg_latency_prev, 1),
        })

        # Check if alert already sent this week
        if self._alert_exists_recently(senior.id, "vigilance", days=7):
            return

        if semantic_drop > 0.2 and latency_increase > 0.3:
            self._create_alert(
                senior.id, "vigilance_high", "high",
                f"Alerte Vigilance Elevee pour {senior.first_name} : "
                f"baisse de {semantic_drop:.0%} du vocabulaire et augmentation "
                f"de {latency_increase:.0%} du temps de reponse sur 7 jours.",
                details,
            )
        elif semantic_drop > 0.2:
            self._create_alert(
                senior.id, "vigilance", "medium",
                f"Alerte Vigilance pour {senior.first_name} : "
                f"baisse de {semantic_drop:.0%} de la richesse semantique sur 7 jours.",
                details,
            )
        elif latency_increase > 0.3:
            self._create_alert(
                senior.id, "vigilance", "medium",
                f"Alerte Vigilance pour {senior.first_name} : "
                f"augmentation de {latency_increase:.0%} du temps de reponse sur 7 jours.",
                details,
            )

    def _check_evasive_increase(self, senior: Senior):
        """Alert if evasive responses increase significantly."""
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)

        recent = self._get_metrics(senior.id, seven_days_ago, now)
        previous = self._get_metrics(senior.id, fourteen_days_ago, seven_days_ago)

        if not recent or not previous:
            return

        avg_evasive_recent = sum(m.evasive_responses for m in recent) / len(recent)
        avg_evasive_prev = sum(m.evasive_responses for m in previous) / len(previous)

        if avg_evasive_prev > 0:
            increase = (avg_evasive_recent - avg_evasive_prev) / avg_evasive_prev
            if increase > 0.5:  # 50% increase in evasive responses
                if not self._alert_exists_recently(senior.id, "evasive", days=7):
                    self._create_alert(
                        senior.id, "evasive", "low",
                        f"{senior.first_name} donne plus de reponses evasives que d'habitude "
                        f"(+{increase:.0%} sur 7 jours).",
                    )

    def _check_session_duration_drop(self, senior: Senior):
        """Alert if sessions become significantly shorter."""
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)

        recent_sessions = (
            self.db.query(ConvSession)
            .filter(
                ConvSession.senior_id == senior.id,
                ConvSession.started_at >= seven_days_ago,
                ConvSession.status == "completed",
                ConvSession.duration_seconds.isnot(None),
            )
            .all()
        )
        previous_sessions = (
            self.db.query(ConvSession)
            .filter(
                ConvSession.senior_id == senior.id,
                ConvSession.started_at >= fourteen_days_ago,
                ConvSession.started_at < seven_days_ago,
                ConvSession.status == "completed",
                ConvSession.duration_seconds.isnot(None),
            )
            .all()
        )

        if not recent_sessions or not previous_sessions:
            return

        avg_recent = sum(s.duration_seconds for s in recent_sessions) / len(recent_sessions)
        avg_prev = sum(s.duration_seconds for s in previous_sessions) / len(previous_sessions)

        if avg_prev > 0:
            drop = (avg_prev - avg_recent) / avg_prev
            if drop > 0.4:  # Sessions 40% shorter
                if not self._alert_exists_recently(senior.id, "duration_drop", days=7):
                    self._create_alert(
                        senior.id, "duration_drop", "low",
                        f"Les sessions de {senior.first_name} sont {drop:.0%} plus courtes "
                        f"que la semaine precedente (moy. {avg_recent/60:.0f}min vs {avg_prev/60:.0f}min).",
                    )

    def _check_inactivity(self, senior: Senior):
        """Alert if no sessions for 3+ days."""
        three_days_ago = datetime.now(timezone.utc) - timedelta(days=3)
        recent_session = (
            self.db.query(ConvSession)
            .filter(ConvSession.senior_id == senior.id, ConvSession.started_at >= three_days_ago)
            .first()
        )

        if not recent_session:
            if not self._alert_exists_recently(senior.id, "inactivity", days=3):
                self._create_alert(
                    senior.id, "inactivity", "low",
                    f"{senior.first_name} n'a pas eu de session depuis plus de 3 jours.",
                )

    def _get_metrics(self, senior_id: int, start: datetime, end: datetime) -> list[CognitiveMetric]:
        return (
            self.db.query(CognitiveMetric)
            .filter(
                CognitiveMetric.senior_id == senior_id,
                CognitiveMetric.recorded_at >= start,
                CognitiveMetric.recorded_at < end,
            )
            .all()
        )

    def _alert_exists_recently(self, senior_id: int, alert_type: str, days: int) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        return (
            self.db.query(Alert)
            .filter(
                Alert.senior_id == senior_id,
                Alert.type == alert_type,
                Alert.created_at >= cutoff,
            )
            .first()
        ) is not None

    def _create_alert(self, senior_id: int, alert_type: str, severity: str, message: str, details: str | None = None):
        alert = Alert(
            senior_id=senior_id,
            type=alert_type,
            severity=severity,
            message=message,
            details=details,
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)

        # Email the family for actionable alerts. This is the reliable channel:
        # it reaches them whether or not the dashboard is open, and runs as a
        # durable Celery task (the previous `create_task` fired a coroutine with
        # no running event loop from the cron thread → the family was NEVER emailed).
        if severity in ("medium", "high"):
            from app.tasks import send_alert_email_task

            try:
                send_alert_email_task.delay(
                    senior_id,
                    f"Memoria — Alerte {severity.upper()} pour votre proche",
                    f"<h3>{message}</h3><p>Connectez-vous au dashboard Memoria pour plus de details.</p>",
                )
            except Exception:
                logger.warning("Could not enqueue alert email for senior %s", senior_id, exc_info=True)

        # NB: real-time WebSocket push to open dashboards is intentionally not done
        # here — the in-memory connection registry lives in the web process, not the
        # Celery/cron context, so cross-process delivery needs Redis pub/sub
        # (see ARCHITECTURE_REVIEW §4.1). The dashboard loads alerts on open.

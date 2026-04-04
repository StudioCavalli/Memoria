from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.cognitive_metric import CognitiveMetric
from app.schemas.metric import MetricsSummary


class CognitiveAnalysisService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self, senior_id: int) -> MetricsSummary:
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)

        recent = (
            self.db.query(CognitiveMetric)
            .filter(
                CognitiveMetric.senior_id == senior_id,
                CognitiveMetric.recorded_at >= seven_days_ago,
            )
            .all()
        )

        previous = (
            self.db.query(CognitiveMetric)
            .filter(
                CognitiveMetric.senior_id == senior_id,
                CognitiveMetric.recorded_at >= fourteen_days_ago,
                CognitiveMetric.recorded_at < seven_days_ago,
            )
            .all()
        )

        if not recent:
            return MetricsSummary(
                semantic_richness_trend="stable",
                latency_trend="stable",
                avg_unique_words_7d=0,
                avg_latency_7d=0,
                vitality_score=0,
                sessions_count_7d=0,
            )

        avg_words = sum(m.unique_words for m in recent) / len(recent)
        avg_latency = sum(m.avg_latency_ms for m in recent) / len(recent)

        prev_avg_words = sum(m.unique_words for m in previous) / len(previous) if previous else avg_words
        prev_avg_latency = sum(m.avg_latency_ms for m in previous) / len(previous) if previous else avg_latency

        semantic_trend = self._compute_trend(prev_avg_words, avg_words)
        latency_trend = self._compute_trend(avg_latency, prev_avg_latency)  # inverted: lower is better

        vitality = self._compute_vitality(avg_words, avg_latency, semantic_trend, latency_trend)

        return MetricsSummary(
            semantic_richness_trend=semantic_trend,
            latency_trend=latency_trend,
            avg_unique_words_7d=round(avg_words, 1),
            avg_latency_7d=round(avg_latency, 1),
            vitality_score=round(vitality, 1),
            sessions_count_7d=len(recent),
        )

    def _compute_trend(self, old: float, new: float) -> str:
        if old == 0:
            return "stable"
        change = (new - old) / old
        if change > 0.1:
            return "increasing"
        elif change < -0.1:
            return "decreasing"
        return "stable"

    def _compute_vitality(
        self, avg_words: float, avg_latency: float, semantic_trend: str, latency_trend: str
    ) -> float:
        score = 50.0

        # Semantic richness component (0-30 points)
        if avg_words > 100:
            score += 30
        elif avg_words > 50:
            score += 20
        elif avg_words > 20:
            score += 10

        # Latency component (0-20 points) — lower is better
        if avg_latency < 2000:
            score += 20
        elif avg_latency < 4000:
            score += 10
        elif avg_latency < 6000:
            score += 5

        # Trend adjustments
        if semantic_trend == "decreasing":
            score -= 15
        elif semantic_trend == "increasing":
            score += 5

        if latency_trend == "decreasing":
            score -= 10

        return max(0, min(100, score))

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.cognitive_metric import CognitiveMetric
from app.schemas.metric import CognitiveMetricResponse, MetricsSummary
from app.services.cognitive_analysis import CognitiveAnalysisService

router = APIRouter(prefix="/seniors/{senior_id}/metrics", tags=["metrics"])


@router.get("/history", response_model=list[CognitiveMetricResponse])
def get_metrics_history(
    senior_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone

    since = datetime.now(timezone.utc) - timedelta(days=days)
    metrics = (
        db.query(CognitiveMetric)
        .filter(CognitiveMetric.senior_id == senior_id, CognitiveMetric.recorded_at >= since)
        .order_by(CognitiveMetric.recorded_at.desc())
        .all()
    )
    return metrics


@router.get("/summary", response_model=MetricsSummary)
def get_metrics_summary(senior_id: int, db: Session = Depends(get_db)):
    service = CognitiveAnalysisService(db)
    return service.get_summary(senior_id)

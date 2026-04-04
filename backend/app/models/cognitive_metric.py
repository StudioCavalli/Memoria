from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CognitiveMetric(Base):
    __tablename__ = "cognitive_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    senior_id: Mapped[int] = mapped_column(ForeignKey("seniors.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), index=True)

    # Semantic richness
    unique_words: Mapped[int] = mapped_column(Integer, default=0)
    type_token_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    avg_sentence_length: Mapped[float] = mapped_column(Float, default=0.0)
    named_entities_count: Mapped[int] = mapped_column(Integer, default=0)

    # Response latency
    avg_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    max_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    silence_count: Mapped[int] = mapped_column(Integer, default=0)  # silences > 10s
    evasive_responses: Mapped[int] = mapped_column(Integer, default=0)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    senior = relationship("Senior", back_populates="cognitive_metrics")
    session = relationship("Session", back_populates="cognitive_metrics")

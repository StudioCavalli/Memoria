from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Transcription(Base):
    __tablename__ = "transcriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    speaker: Mapped[str] = mapped_column(String(20))  # "senior" or "ai"
    content_encrypted: Mapped[str] = mapped_column(Text, nullable=False)  # AES-256 encrypted
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    latency_ms: Mapped[Optional[float]] = mapped_column(Float)  # response latency in ms
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    session = relationship("Session", back_populates="transcriptions")

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    senior_id: Mapped[int] = mapped_column(ForeignKey("seniors.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary_encrypted: Mapped[str] = mapped_column(Text, nullable=False)  # AES-256 encrypted
    period: Mapped[Optional[str]] = mapped_column(String(100))  # e.g. "Annees 1960", "Enfance"
    people: Mapped[Optional[str]] = mapped_column(Text)  # JSON list of names
    places: Mapped[Optional[str]] = mapped_column(Text)  # JSON list of places
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    senior = relationship("Senior", back_populates="memories")
    themes = relationship("Theme", secondary="memory_themes", back_populates="memories")

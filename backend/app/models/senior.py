from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Senior(Base):
    __tablename__ = "seniors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    birth_date: Mapped[Optional[date]] = mapped_column(Date)
    birth_place: Mapped[Optional[str]] = mapped_column(String(255))
    photo_url: Mapped[Optional[str]] = mapped_column(String(500))
    preferences: Mapped[Optional[str]] = mapped_column(Text)  # JSON string
    session_schedule: Mapped[Optional[str]] = mapped_column(Text)  # JSON cron-like schedule
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    family_members = relationship("FamilyMember", back_populates="senior", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="senior", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="senior", cascade="all, delete-orphan")
    cognitive_metrics = relationship("CognitiveMetric", back_populates="senior", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="senior", cascade="all, delete-orphan")
    gazettes = relationship("Gazette", back_populates="senior", cascade="all, delete-orphan")

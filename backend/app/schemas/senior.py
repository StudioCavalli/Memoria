from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel


class SeniorCreate(BaseModel):
    first_name: str
    last_name: str
    birth_date: date | None = None
    birth_place: str | None = None


class SeniorUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    birth_date: date | None = None
    birth_place: str | None = None
    photo_url: str | None = None
    preferences: str | None = None
    session_schedule: str | None = None


class SeniorResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    birth_date: date | None
    birth_place: str | None
    photo_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScheduleInfo(BaseModel):
    days: list[str] = []
    time: str = "10:00"
    duration_minutes: int = 30


class FamilyMemberInfo(BaseModel):
    id: int
    name: str
    email: str
    role: str


class LastSessionInfo(BaseModel):
    id: int
    date: datetime | None
    summary: str | None


class SeniorDetailResponse(SeniorResponse):
    """Single-senior view: base fields + the schedule, family and last-session
    data the dashboard needs (kept off the list response to avoid N+1 queries)."""
    schedule: ScheduleInfo | None = None
    family_members: list[FamilyMemberInfo] = []
    last_session: LastSessionInfo | None = None

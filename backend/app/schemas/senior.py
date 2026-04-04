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

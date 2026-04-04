from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class MemoryResponse(BaseModel):
    id: int
    senior_id: int
    title: str
    summary: str
    period: str | None
    people: list[str] | None = None
    places: list[str] | None = None
    themes: list[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ThemeResponse(BaseModel):
    id: int
    name: str
    description: str | None
    icon: str | None

    model_config = {"from_attributes": True}

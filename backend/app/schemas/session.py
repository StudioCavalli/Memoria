from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SessionCreate(BaseModel):
    senior_id: int


class SessionResponse(BaseModel):
    id: int
    senior_id: int
    status: str
    duration_seconds: int | None
    summary: str | None
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}


class MessageRequest(BaseModel):
    text: str


class MessageResponse(BaseModel):
    session_id: int
    user_text: str
    ai_response: str
    latency_ms: float

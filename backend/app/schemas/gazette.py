from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel


class GazetteResponse(BaseModel):
    id: int
    senior_id: int
    title: str
    pdf_url: str
    week_start: date
    week_end: date
    email_sent: bool
    created_at: datetime

    model_config = {"from_attributes": True}

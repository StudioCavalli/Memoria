from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, verify_senior_access
from app.models.user import User
from app.services.question_bank import QuestionSelector, THEME_NAMES

router = APIRouter(prefix="/questions", tags=["questions"])


class QuestionResponse(BaseModel):
    text: str
    theme: str
    depth: int


@router.get("/next", response_model=QuestionResponse)
def get_next_question(
    senior_id: int,
    theme: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the next best biographical question for a senior."""
    verify_senior_access(senior_id, current_user, db)
    selector = QuestionSelector(db)
    q = selector.get_next_question(senior_id, preferred_theme=theme)
    return QuestionResponse(text=q.text, theme=q.theme, depth=q.depth)


@router.get("/themes", response_model=list[str])
def get_question_themes(current_user: User = Depends(get_current_user)):
    """List all available question themes."""
    return THEME_NAMES


class FollowupRequest(BaseModel):
    text: str


@router.post("/followup", response_model=QuestionResponse)
def get_followup(
    data: FollowupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a contextual follow-up question based on what the senior said."""
    selector = QuestionSelector(db)
    text = selector.get_followup_question(data.text)
    return QuestionResponse(text=text, theme="Relance", depth=2)

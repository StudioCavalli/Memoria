from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.encryption import decrypt_text
from app.models.memory import Memory
from app.schemas.memory import MemoryResponse, ThemeResponse
from app.models.theme import Theme

router = APIRouter(prefix="/memories", tags=["memories"])


@router.get("/", response_model=list[MemoryResponse])
def list_memories(
    senior_id: int,
    theme_id: int | None = None,
    period: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Memory).filter(Memory.senior_id == senior_id)

    if theme_id:
        query = query.filter(Memory.themes.any(Theme.id == theme_id))
    if period:
        query = query.filter(Memory.period == period)

    memories = query.order_by(Memory.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for m in memories:
        import json
        result.append(MemoryResponse(
            id=m.id,
            senior_id=m.senior_id,
            title=m.title,
            summary=decrypt_text(m.summary_encrypted),
            period=m.period,
            people=json.loads(m.people) if m.people else None,
            places=json.loads(m.places) if m.places else None,
            themes=[t.name for t in m.themes],
            created_at=m.created_at,
        ))
    return result


@router.get("/{memory_id}", response_model=MemoryResponse)
def get_memory(memory_id: int, db: Session = Depends(get_db)):
    import json
    from fastapi import HTTPException

    m = db.query(Memory).filter(Memory.id == memory_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Souvenir introuvable")

    return MemoryResponse(
        id=m.id,
        senior_id=m.senior_id,
        title=m.title,
        summary=decrypt_text(m.summary_encrypted),
        period=m.period,
        people=json.loads(m.people) if m.people else None,
        places=json.loads(m.places) if m.places else None,
        themes=[t.name for t in m.themes],
        created_at=m.created_at,
    )


@router.get("/themes/", response_model=list[ThemeResponse])
def list_themes(db: Session = Depends(get_db)):
    return db.query(Theme).all()

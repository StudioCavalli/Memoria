from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.gazette import Gazette
from app.schemas.gazette import GazetteResponse

router = APIRouter(prefix="/gazettes", tags=["gazettes"])


@router.get("/", response_model=list[GazetteResponse])
def list_gazettes(
    senior_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return (
        db.query(Gazette)
        .filter(Gazette.senior_id == senior_id)
        .order_by(Gazette.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{gazette_id}", response_model=GazetteResponse)
def get_gazette(gazette_id: int, db: Session = Depends(get_db)):
    gazette = db.query(Gazette).filter(Gazette.id == gazette_id).first()
    if not gazette:
        raise HTTPException(status_code=404, detail="Gazette introuvable")
    return gazette


@router.get("/{gazette_id}/pdf")
def download_gazette_pdf(gazette_id: int, db: Session = Depends(get_db)):
    gazette = db.query(Gazette).filter(Gazette.id == gazette_id).first()
    if not gazette:
        raise HTTPException(status_code=404, detail="Gazette introuvable")
    return RedirectResponse(url=gazette.pdf_url)

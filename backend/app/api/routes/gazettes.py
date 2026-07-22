from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, verify_senior_access
from app.models.gazette import Gazette
from app.models.user import User
from app.schemas.gazette import GazetteResponse

router = APIRouter(prefix="/gazettes", tags=["gazettes"])

UPLOADS_DIR = Path(__file__).parent.parent.parent.parent / "uploads"


def _get_owned_gazette(gazette_id: int, current_user: User, db: Session) -> Gazette:
    gazette = db.query(Gazette).filter(Gazette.id == gazette_id).first()
    if not gazette:
        raise HTTPException(status_code=404, detail="Gazette introuvable")
    verify_senior_access(gazette.senior_id, current_user, db)
    return gazette


@router.get("/", response_model=list[GazetteResponse])
def list_gazettes(
    senior_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_senior_access(senior_id, current_user, db)
    return (
        db.query(Gazette)
        .filter(Gazette.senior_id == senior_id)
        .order_by(Gazette.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{gazette_id}", response_model=GazetteResponse)
def get_gazette(
    gazette_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_gazette(gazette_id, current_user, db)


@router.get("/{gazette_id}/pdf")
def download_gazette_pdf(
    gazette_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gazette = _get_owned_gazette(gazette_id, current_user, db)

    # Si c'est un fichier local (uploads/), servir directement
    if gazette.pdf_url.startswith("/uploads/"):
        local_path = UPLOADS_DIR / gazette.pdf_url.replace("/uploads/", "", 1)
        if local_path.exists():
            return FileResponse(
                path=str(local_path),
                media_type="application/pdf",
                filename=f"{gazette.title}.pdf",
            )
        raise HTTPException(status_code=404, detail="Fichier PDF introuvable")

    # Sinon redirect vers l'URL externe (S3, etc.)
    return RedirectResponse(url=gazette.pdf_url)

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.senior import Senior
from app.models.user import FamilyMember, User
from app.schemas.senior import SeniorCreate, SeniorResponse, SeniorUpdate

router = APIRouter(prefix="/seniors", tags=["seniors"])


@router.post("/", response_model=SeniorResponse, status_code=status.HTTP_201_CREATED)
def create_senior(
    data: SeniorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    senior = Senior(**data.model_dump())
    db.add(senior)
    db.flush()

    link = FamilyMember(user_id=current_user.id, senior_id=senior.id, role="family")
    db.add(link)
    db.commit()
    db.refresh(senior)
    return senior


@router.get("/", response_model=list[SeniorResponse])
def list_seniors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    senior_ids = (
        db.query(FamilyMember.senior_id)
        .filter(FamilyMember.user_id == current_user.id)
        .subquery()
    )
    seniors = db.query(Senior).filter(Senior.id.in_(senior_ids)).all()
    return seniors


@router.get("/{senior_id}", response_model=SeniorResponse)
def get_senior(
    senior_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    senior = db.query(Senior).filter(Senior.id == senior_id).first()
    if not senior:
        raise HTTPException(status_code=404, detail="Senior introuvable")

    link = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == current_user.id, FamilyMember.senior_id == senior_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=403, detail="Acces non autorise")

    return senior


@router.put("/{senior_id}", response_model=SeniorResponse)
def update_senior(
    senior_id: int,
    data: SeniorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    senior = db.query(Senior).filter(Senior.id == senior_id).first()
    if not senior:
        raise HTTPException(status_code=404, detail="Senior introuvable")

    link = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == current_user.id, FamilyMember.senior_id == senior_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=403, detail="Acces non autorise")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(senior, field, value)

    db.commit()
    db.refresh(senior)
    return senior

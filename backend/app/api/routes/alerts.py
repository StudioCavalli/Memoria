from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.alert import Alert
from app.models.user import FamilyMember, User
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertResponse])
def list_alerts(
    senior_id: int,
    unread_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == current_user.id, FamilyMember.senior_id == senior_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=403, detail="Acces non autorise")

    query = db.query(Alert).filter(Alert.senior_id == senior_id)
    if unread_only:
        query = query.filter(Alert.is_read == False)

    return query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


@router.put("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte introuvable")

    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert

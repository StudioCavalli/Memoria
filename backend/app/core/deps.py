from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.senior import Senior
from app.models.user import FamilyMember, User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")

    return user


def user_has_senior_access(user: User, senior_id: int, db: Session) -> bool:
    """True if the user is linked (family/caregiver/doctor) to this senior."""
    link = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == user.id, FamilyMember.senior_id == senior_id)
        .first()
    )
    return link is not None


def verify_senior_access(senior_id: int, current_user: User, db: Session) -> Senior:
    """Load a senior and ensure the current user is authorized to access it.

    Raises 404 if the senior does not exist, 403 if the user has no link to it.
    Returns the Senior so callers can reuse it.
    """
    senior = db.query(Senior).filter(Senior.id == senior_id).first()
    if not senior:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior introuvable")
    if not user_has_senior_access(current_user, senior_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces non autorise")
    return senior


def get_user_from_token(token: str | None, db: Session) -> User | None:
    """Resolve a user from a raw JWT (for WebSocket auth via query param)."""
    if not token:
        return None
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()

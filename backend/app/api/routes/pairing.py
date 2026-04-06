from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.models.senior import Senior
from app.models.user import FamilyMember, User

router = APIRouter(prefix="/pairing", tags=["pairing"])


class PairingValidateRequest(BaseModel):
    code: str


@router.post("/validate")
def validate_pairing_code(
    body: PairingValidateRequest,
    db: Session = Depends(get_db),
):
    code = body.code.strip()
    if not code or len(code) != 6:
        raise HTTPException(status_code=404, detail="Code invalide ou expire")

    # Search all seniors for one with a matching pairing code
    seniors = db.query(Senior).filter(Senior.preferences.isnot(None)).all()

    matched_senior: Senior | None = None
    matched_prefs: dict = {}

    for senior in seniors:
        try:
            prefs = json.loads(senior.preferences)
        except (json.JSONDecodeError, TypeError):
            continue

        if prefs.get("pairing_code") != code:
            continue

        # Check expiration
        expires_str = prefs.get("pairing_expires")
        if not expires_str:
            continue

        try:
            expires_at = datetime.fromisoformat(expires_str)
        except (ValueError, TypeError):
            continue

        if datetime.now(timezone.utc) > expires_at:
            # Expired — clean up and skip
            prefs.pop("pairing_code", None)
            prefs.pop("pairing_expires", None)
            senior.preferences = json.dumps(prefs)
            db.commit()
            continue

        matched_senior = senior
        matched_prefs = prefs
        break

    if not matched_senior:
        raise HTTPException(status_code=404, detail="Code invalide ou expire")

    # Find the family member linked to this senior to create a token
    family_link = (
        db.query(FamilyMember)
        .filter(FamilyMember.senior_id == matched_senior.id)
        .first()
    )
    if not family_link:
        raise HTTPException(status_code=404, detail="Aucun compte famille associe")

    user = db.query(User).filter(User.id == family_link.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Create a JWT access token for the tablet
    access_token = create_access_token({"sub": str(user.id)})

    # Delete the pairing code (one-time use)
    matched_prefs.pop("pairing_code", None)
    matched_prefs.pop("pairing_expires", None)
    matched_senior.preferences = json.dumps(matched_prefs)
    db.commit()

    senior_name = f"{matched_senior.first_name} {matched_senior.last_name}".strip()

    return {
        "access_token": access_token,
        "senior_id": matched_senior.id,
        "senior_name": senior_name,
        "settings_pin": matched_prefs.get("settings_pin", "1234"),
        "api_url": "",
    }

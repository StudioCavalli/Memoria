"""WebSocket endpoints for real-time notifications to tablets and dashboards."""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import SessionLocal
from app.core.deps import get_user_from_token, user_has_senior_access
from app.services.notification_service import notification_manager

router = APIRouter(tags=["notifications"])


@router.websocket("/ws/tablet/{senior_id}")
async def tablet_notifications(websocket: WebSocket, senior_id: int, token: str | None = None):
    """WebSocket for tablet to receive session triggers and notifications."""
    await websocket.accept()

    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if user is None or not user_has_senior_access(user, senior_id, db):
            await websocket.close(code=1008)
            return
    finally:
        db.close()

    notification_manager.register_tablet(senior_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        notification_manager.unregister_tablet(senior_id, websocket)


@router.websocket("/ws/dashboard/{user_id}")
async def dashboard_notifications(websocket: WebSocket, user_id: int, token: str | None = None):
    """WebSocket for family dashboard to receive real-time alerts."""
    await websocket.accept()

    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        # A user may only subscribe to their own dashboard channel
        if user is None or user.id != user_id:
            await websocket.close(code=1008)
            return
    finally:
        db.close()

    notification_manager.register_dashboard(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        notification_manager.unregister_dashboard(user_id, websocket)

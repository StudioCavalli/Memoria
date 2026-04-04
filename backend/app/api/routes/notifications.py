"""WebSocket endpoints for real-time notifications to tablets and dashboards."""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.notification_service import notification_manager

router = APIRouter(tags=["notifications"])


@router.websocket("/ws/tablet/{senior_id}")
async def tablet_notifications(websocket: WebSocket, senior_id: int):
    """WebSocket for tablet to receive session triggers and notifications."""
    await websocket.accept()
    notification_manager.register_tablet(senior_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        notification_manager.unregister_tablet(senior_id, websocket)


@router.websocket("/ws/dashboard/{user_id}")
async def dashboard_notifications(websocket: WebSocket, user_id: int):
    """WebSocket for family dashboard to receive real-time alerts."""
    await websocket.accept()
    notification_manager.register_dashboard(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        notification_manager.unregister_dashboard(user_id, websocket)

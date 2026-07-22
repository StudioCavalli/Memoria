"""
Notification service: manages real-time notifications to tablets and family dashboards.
Uses in-memory WebSocket connections + optional email via SendGrid.
"""
from __future__ import annotations

from collections import defaultdict

from fastapi import WebSocket


class NotificationManager:
    def __init__(self):
        # Connected WebSocket clients: {senior_id: [websocket, ...]}
        self._tablet_connections: dict[int, list[WebSocket]] = defaultdict(list)
        # Connected dashboard clients: {user_id: [websocket, ...]}
        self._dashboard_connections: dict[int, list[WebSocket]] = defaultdict(list)

    def register_tablet(self, senior_id: int, ws: WebSocket):
        self._tablet_connections[senior_id].append(ws)

    def unregister_tablet(self, senior_id: int, ws: WebSocket):
        self._tablet_connections[senior_id] = [
            c for c in self._tablet_connections[senior_id] if c != ws
        ]

    def register_dashboard(self, user_id: int, ws: WebSocket):
        self._dashboard_connections[user_id].append(ws)

    def unregister_dashboard(self, user_id: int, ws: WebSocket):
        self._dashboard_connections[user_id] = [
            c for c in self._dashboard_connections[user_id] if c != ws
        ]

    async def notify_tablet(self, senior_id: int, event: str, data: dict):
        """Send notification to all connected tablets for a senior."""
        message = {"event": event, **data}
        for ws in self._tablet_connections.get(senior_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                pass

    async def notify_family(self, senior_id: int, event: str, data: dict):
        """Send notification to all connected family dashboards for a senior."""
        from app.core.database import SessionLocal
        from app.models.user import FamilyMember

        db = SessionLocal()
        try:
            links = db.query(FamilyMember).filter(FamilyMember.senior_id == senior_id).all()
            user_ids = [link.user_id for link in links]

            message = {"event": event, **data}
            for uid in user_ids:
                for ws in self._dashboard_connections.get(uid, []):
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass
        finally:
            db.close()

    async def send_email_alert(self, senior_id: int, subject: str, body: str):
        """Send email alert to all family members of a senior."""
        from app.core.config import settings
        from app.core.database import SessionLocal
        from app.models.user import FamilyMember, User

        if not settings.sendgrid_api_key:
            return

        db = SessionLocal()
        try:
            links = (
                db.query(FamilyMember)
                .filter(FamilyMember.senior_id == senior_id, FamilyMember.notify_email.is_(True))
                .all()
            )

            for link in links:
                user = db.query(User).filter(User.id == link.user_id).first()
                if user:
                    await self._send_sendgrid_email(user.email, subject, body)
        finally:
            db.close()

    async def _send_sendgrid_email(self, to_email: str, subject: str, body: str):
        import httpx

        from app.core.config import settings

        await httpx.AsyncClient().post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {settings.sendgrid_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": settings.gazette_sender_email, "name": "Memoria"},
                "subject": subject,
                "content": [{"type": "text/html", "value": body}],
            },
            timeout=10.0,
        )


# Singleton
notification_manager = NotificationManager()

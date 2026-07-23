"""
Session scheduler: triggers conversation sessions at configured times.
Sends push notifications to the tablet to start a session.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.senior import Senior
from app.models.session import Session as ConvSession


class SessionScheduler:
    def __init__(self):
        self._running = False
        self._task: asyncio.Task | None = None

    async def start(self):
        """Start the scheduler loop."""
        self._running = True
        self._task = asyncio.create_task(self._run())

    async def stop(self):
        """Stop the scheduler loop."""
        self._running = False
        if self._task:
            self._task.cancel()

    async def _run(self):
        """Main scheduler loop — checks every 60s if a session should start."""
        while self._running:
            try:
                await self._check_schedules()
            except Exception:
                pass
            await asyncio.sleep(60)

    async def _check_schedules(self):
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc)
            current_hour = now.hour
            current_minute = now.minute

            seniors = db.query(Senior).filter(Senior.session_schedule.isnot(None)).all()

            for senior in seniors:
                schedule = json.loads(senior.session_schedule)
                # Schedule format: {"times": ["10:00", "15:00"], "days": [0,1,2,3,4,5,6]}
                times = schedule.get("times", [])
                days = schedule.get("days", list(range(7)))

                if now.weekday() not in days:
                    continue

                for time_str in times:
                    hour, minute = map(int, time_str.split(":"))
                    if hour == current_hour and minute == current_minute:
                        # Only a *recent* active session should block a new one.
                        # An abandoned `active` session (senior never ended it) must
                        # not block scheduling forever — the stale-session cleanup
                        # closes it separately.
                        active = (
                            db.query(ConvSession)
                            .filter(
                                ConvSession.senior_id == senior.id,
                                ConvSession.status == "active",
                                ConvSession.started_at >= now - timedelta(hours=1),
                            )
                            .first()
                        )
                        if not active:
                            await self._trigger_session(senior, db)

        finally:
            db.close()

    async def _trigger_session(self, senior: Senior, db: Session):
        """Create a new session and notify the tablet."""
        session = ConvSession(senior_id=senior.id, status="active")
        db.add(session)
        db.commit()
        db.refresh(session)

        # Notify connected tablets via the notification system
        await self._send_push_notification(senior.id, session.id)

    async def _send_push_notification(self, senior_id: int, session_id: int):
        """Send push notification to the senior's tablet to start a session."""
        # This will be connected to the WebSocket notification system
        # or Firebase Cloud Messaging in production
        from app.services.notification_service import notification_manager

        await notification_manager.notify_tablet(
            senior_id=senior_id,
            event="session_start",
            data={"session_id": session_id},
        )


# Singleton
scheduler = SessionScheduler()

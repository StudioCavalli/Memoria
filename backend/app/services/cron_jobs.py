"""
Cron-like background jobs for MEMORIA.
Runs on app startup as async tasks.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.core.database import SessionLocal


async def run_daily_alert_check():
    """Daily job: check cognitive metrics and send alerts if needed."""
    while True:
        # Run at 8:00 UTC every day
        now = datetime.now(timezone.utc)
        if now.hour == 8 and now.minute == 0:
            db = SessionLocal()
            try:
                from app.services.alert_service import AlertService
                service = AlertService(db)
                service.check_all_seniors()
            except Exception:
                pass
            finally:
                db.close()

        await asyncio.sleep(60)  # Check every minute


async def run_weekly_gazette():
    """Weekly job: generate and send gazette PDFs every Sunday at 20:00 UTC."""
    while True:
        now = datetime.now(timezone.utc)
        if now.weekday() == 6 and now.hour == 20 and now.minute == 0:
            db = SessionLocal()
            try:
                from app.services.gazette_service import GazetteGeneratorService
                service = GazetteGeneratorService(db)
                service.generate_for_all_seniors()
            except Exception:
                pass
            finally:
                db.close()

        await asyncio.sleep(60)

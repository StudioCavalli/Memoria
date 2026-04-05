"""
Scheduled background jobs for MEMORIA using APScheduler.
"""
from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def _daily_alert_check():
    """Daily 8:00 UTC — check cognitive metrics and send alerts."""
    db = SessionLocal()
    try:
        from app.services.alert_service import AlertService
        service = AlertService(db)
        service.check_all_seniors()
        logger.info("Daily alert check completed")
    except Exception as e:
        logger.error(f"Daily alert check failed: {e}")
    finally:
        db.close()


def _weekly_gazette():
    """Sunday 20:00 UTC — generate and send gazette PDFs."""
    db = SessionLocal()
    try:
        from app.services.gazette_service import GazetteGeneratorService
        service = GazetteGeneratorService(db)
        gazettes = service.generate_for_all_seniors()
        logger.info(f"Weekly gazette: {len(gazettes)} generated")
    except Exception as e:
        logger.error(f"Weekly gazette failed: {e}")
    finally:
        db.close()


def start_scheduler():
    """Register all jobs and start the scheduler."""
    scheduler.add_job(
        _daily_alert_check,
        CronTrigger(hour=8, minute=0),
        id="daily_alert_check",
        replace_existing=True,
    )
    scheduler.add_job(
        _weekly_gazette,
        CronTrigger(day_of_week="sun", hour=20, minute=0),
        id="weekly_gazette",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started: daily alerts 8:00 UTC, weekly gazette Sun 20:00 UTC")


def stop_scheduler():
    """Shutdown the scheduler gracefully."""
    scheduler.shutdown(wait=False)

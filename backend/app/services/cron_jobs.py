"""
Scheduled background jobs for MEMORIA using APScheduler.
"""
from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def _close_stale_sessions():
    """Every few minutes — close `active` sessions that went idle (the senior put
    the tablet down) and kick off the post-session pipeline. Without this, sessions
    never end and nothing downstream (memories/metrics/alerts/gazette) ever runs."""
    db = SessionLocal()
    try:
        from app.services.session_lifecycle import close_stale_sessions
        n = close_stale_sessions(db)
        if n:
            logger.info(f"Auto-closed {n} stale session(s)")
    except Exception as e:
        logger.error(f"Stale session cleanup failed: {e}")
    finally:
        db.close()


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
    """Sunday 20:00 UTC — enqueue one durable gazette job per senior.

    Each senior's gazette is an independent Celery task with retries, so one
    senior's LLM/email failure no longer aborts everyone else's gazette.
    """
    db = SessionLocal()
    try:
        from app.models.senior import Senior
        senior_ids = [s.id for s in db.query(Senior).all()]
    finally:
        db.close()

    from app.tasks import generate_gazette_task

    enqueued = 0
    for sid in senior_ids:
        try:
            generate_gazette_task.delay(sid)
            enqueued += 1
        except Exception as e:
            logger.error(f"Failed to enqueue gazette for senior {sid}: {e}")
    logger.info(f"Weekly gazette: enqueued {enqueued}/{len(senior_ids)} jobs")


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
    scheduler.add_job(
        _close_stale_sessions,
        IntervalTrigger(minutes=5),
        id="close_stale_sessions",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler started: daily alerts 8:00 UTC, weekly gazette Sun 20:00 UTC, "
        "stale-session cleanup every 5 min"
    )


def stop_scheduler():
    """Shutdown the scheduler gracefully."""
    scheduler.shutdown(wait=False)

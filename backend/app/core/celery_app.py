from __future__ import annotations

from celery import Celery

from app.core.config import settings

# Broker + result backend both on Redis (already part of the stack).
celery_app = Celery(
    "memoria",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery_app.conf.update(
    # In tests, run synchronously with no broker.
    task_always_eager=settings.celery_task_always_eager,
    task_eager_propagates=False,
    # Only ack a task after it finishes, and requeue if the worker dies mid-task,
    # so a crash never silently drops a senior's memories.
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)

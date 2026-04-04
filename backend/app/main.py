from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    alerts,
    audio,
    auth,
    gazettes,
    gdpr,
    memories,
    metrics,
    notifications,
    questions,
    seniors,
    sessions,
    stt,
    tts,
    voice_pipeline,
)
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.services.cron_jobs import run_daily_alert_check, run_weekly_gazette
    from app.services.session_scheduler import scheduler
    from app.services.tts_service import TTSService

    await scheduler.start()

    # Launch background cron jobs
    alert_task = asyncio.create_task(run_daily_alert_check())
    gazette_task = asyncio.create_task(run_weekly_gazette())

    # Pre-cache common TTS phrases
    tts_service = TTSService()
    try:
        await tts_service.warm_up()
    except Exception:
        pass

    yield

    # Shutdown
    await scheduler.stop()
    alert_task.cancel()
    gazette_task.cancel()


app = FastAPI(
    title="MEMORIA API",
    description="Systeme d'IA Biographique et Preventive pour seniors",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API routes
app.include_router(auth.router, prefix="/api")
app.include_router(seniors.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(memories.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(gazettes.router, prefix="/api")
app.include_router(stt.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(audio.router, prefix="/api")
app.include_router(gdpr.router, prefix="/api")

# WebSocket routes
app.include_router(voice_pipeline.router)
app.include_router(notifications.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "memoria-api"}

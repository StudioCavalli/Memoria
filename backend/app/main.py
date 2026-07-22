from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import (
    alerts,
    audio,
    auth,
    gazettes,
    gdpr,
    memories,
    metrics,
    notifications,
    pairing,
    questions,
    seniors,
    sessions,
    stt,
    tts,
    voice_pipeline,
)
from app.core.config import settings
from app.core.rate_limit import limiter


# Insecure defaults that must never reach production
_INSECURE_DEFAULTS = {
    "jwt_secret_key": "change-me-in-production",
    "aes_encryption_key": "change-me-32-bytes-key-here!!!!",
    "s3_secret_key": "minioadmin",
}


def _check_production_secrets() -> None:
    """Fail fast if production is running with placeholder secrets."""
    if settings.environment != "production":
        return
    leaked = [name for name, default in _INSECURE_DEFAULTS.items() if getattr(settings, name) == default]
    if leaked:
        raise RuntimeError(
            "Refus de démarrer en production avec des secrets par défaut : "
            + ", ".join(leaked)
            + ". Définissez-les via les variables d'environnement."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    _check_production_secrets()
    from app.services.cron_jobs import start_scheduler, stop_scheduler
    from app.services.session_scheduler import scheduler as session_scheduler
    from app.services.tts_service import TTSService

    await session_scheduler.start()
    start_scheduler()

    # Pre-cache common TTS phrases
    tts_service = TTSService()
    try:
        await tts_service.warm_up()
    except Exception:
        pass

    yield

    # Shutdown
    await session_scheduler.stop()
    stop_scheduler()


app = FastAPI(
    title="MEMORIA API",
    description="Systeme d'IA Biographique et Preventive pour seniors",
    version="0.1.0",
    lifespan=lifespan,
)

# Rate limiting (slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:19006,https://memoria-dusky.vercel.app,https://memoria-production-aeec.up.railway.app"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
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
app.include_router(pairing.router, prefix="/api")

# Static files for local storage fallback
_uploads = Path(__file__).parent.parent / "uploads"
_uploads.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads)), name="uploads")

# WebSocket routes
app.include_router(voice_pipeline.router)
app.include_router(notifications.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "memoria-api"}

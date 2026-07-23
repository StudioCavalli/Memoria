from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    """Fail fast if production is running with placeholder or weak secrets."""
    if settings.environment != "production":
        return
    problems = [
        f"{name} = valeur par défaut"
        for name, default in _INSECURE_DEFAULTS.items()
        if getattr(settings, name) == default
    ]
    # Reject weak crypto secrets (need real entropy — e.g. `openssl rand -base64 48`).
    if len(settings.jwt_secret_key) < 32:
        problems.append("jwt_secret_key trop court (>= 32 caractères requis)")
    if len(settings.aes_encryption_key) < 32:
        problems.append("aes_encryption_key trop court (>= 32 caractères requis)")
    if problems:
        raise RuntimeError(
            "Refus de démarrer en production — secrets non sûrs : "
            + " ; ".join(problems)
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
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

# NB: the local uploads/ directory is intentionally NOT served as public static
# files. Audio (biometric) and gazette PDFs are sensitive and are only served via
# their authenticated, ownership-checked routes (`/sessions/{id}/audio`,
# `/gazettes/{id}/pdf`). Audio is additionally encrypted at rest.

# WebSocket routes
app.include_router(voice_pipeline.router)
app.include_router(notifications.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "memoria-api"}

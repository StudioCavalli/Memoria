# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# uv (fast, reproducible installs from uv.lock)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# 1) Dependencies only — cached unless pyproject/lock change
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# 2) App source + install the project itself
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
RUN uv sync --frozen --no-dev

# 3) French spaCy model powering the Sentinelle cognitive analysis
RUN python -m spacy download fr_core_news_sm

# Run as an unprivileged user
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Single process: the in-process schedulers (APScheduler / session scheduler)
# are not multi-worker safe. `exec` so uvicorn is PID 1 and gets signals.
# ${PORT} lets the host (e.g. Railway) inject the port.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

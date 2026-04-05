#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[MEMORIA]${NC} $1"; }
warn() { echo -e "${YELLOW}[MEMORIA]${NC} $1"; }
info() { echo -e "${CYAN}[MEMORIA]${NC} $1"; }
err()  { echo -e "${RED}[MEMORIA]${NC} $1"; }

# ─────────────────────────────────────────────
# 1. Environment
# ─────────────────────────────────────────────
if [ ! -f .env ]; then
    warn ".env introuvable — copie de .env.example"
    cp .env.example .env
    warn "Editez .env avec vos cles API avant de relancer."
fi

# Export env vars
set -a
source "$ROOT_DIR/.env"
set +a

# ─────────────────────────────────────────────
# 2. Detect mode
# ─────────────────────────────────────────────
MODE="${1:-local}"

if [ "$MODE" = "docker" ]; then
    log "Demarrage en mode Docker..."

    if ! command -v docker &>/dev/null; then
        err "Docker n'est pas installe."
        exit 1
    fi

    docker compose up -d --build

    log "Attente PostgreSQL..."
    until docker compose exec -T postgres pg_isready -U memoria &>/dev/null; do sleep 1; done

    log "Attente backend..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then break; fi
        sleep 1
    done

    log "Migrations Alembic..."
    if ! docker compose exec -T backend sh -c "cd /app && PYTHONPATH=/app alembic upgrade head" 2>&1; then
        err "Migrations echouees — arret."
        docker compose logs backend
        exit 1
    fi

    log "Seed demo (si premiere installation)..."
    docker compose exec -T backend sh -c "cd /app && PYTHONPATH=/app python scripts/seed_demo.py" 2>&1 | grep -E "(Login|ERROR|SEED COMPLETE|Creating|Skipping)" || true

    echo ""
    log "============================================"
    log "  MEMORIA est pret !"
    log "============================================"
    info "  Backend API  : http://localhost:8000"
    info "  Swagger Docs : http://localhost:8000/docs"
    info "  Site + Dashboard : http://localhost:3000"
    info ""
    info "  Login : demo@memoria.fr / Memoria2026!"
    info ""
    log "============================================"
    log "Logs : docker compose logs -f"
    log "Stop : docker compose down"

else
    # ─────────────────────────────────────────
    # LOCAL MODE
    # ─────────────────────────────────────────
    log "Demarrage en mode local..."

    # Kill previous instances on our ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    # --- Backend Python ---
    log "Setup backend Python..."
    cd "$ROOT_DIR/backend"

    if [ ! -d .venv ]; then
        log "Creation du virtualenv..."
        python3 -m venv .venv
    fi
    source .venv/bin/activate

    log "Installation des dependances Python..."
    pip install --quiet --upgrade pip 2>/dev/null
    pip install --quiet \
        fastapi "uvicorn[standard]" sqlalchemy alembic psycopg2-binary \
        pydantic pydantic-settings python-jose passlib bcrypt==4.0.1 \
        python-multipart httpx cryptography email-validator \
        eval_type_backport \
        2>&1 | grep -v "already satisfied" | tail -3

    log "Lancement du backend FastAPI (port 8000)..."
    cd "$ROOT_DIR/backend"
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!

    # Wait for backend to be ready
    log "Attente du backend..."
    for i in $(seq 1 20); do
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then
            log "Backend OK!"
            break
        fi
        sleep 1
    done

    # --- Website + Dashboard (Next.js) ---
    cd "$ROOT_DIR/website"
    if [ ! -d node_modules ]; then
        log "Installation des dependances website..."
        npm install --legacy-peer-deps --silent 2>&1 | tail -3
    fi

    log "Lancement du site + dashboard Next.js (port 3000)..."
    NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev &
    DASHBOARD_PID=$!

    cd "$ROOT_DIR"

    # Wait a moment for dashboard
    sleep 3

    echo ""
    log "============================================"
    log "  MEMORIA est pret !"
    log "============================================"
    info ""
    info "  Backend API  : http://localhost:8000"
    info "  Swagger Docs : http://localhost:8000/docs"
    info "  Site + Dashboard : http://localhost:3000"
    info ""
    info "  Login : demo@memoria.fr / Memoria2026!"
    info ""
    log "============================================"
    echo ""

    # Graceful shutdown
    cleanup() {
        echo ""
        log "Arret de MEMORIA..."
        kill $BACKEND_PID $DASHBOARD_PID 2>/dev/null
        wait $BACKEND_PID $DASHBOARD_PID 2>/dev/null
        log "Au revoir !"
    }
    trap cleanup EXIT INT TERM

    wait
fi

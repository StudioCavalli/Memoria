# Guide d'installation

## Prerequis
- Docker & Docker Compose
- Node.js 20+ (pour le dev frontend/dashboard)
- Python 3.11+ (pour le dev backend local)

## Demarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/StudioCavalli/Memoria.git
cd Memoria

# 2. Configurer l'environnement
cp .env.example .env
# Editer .env avec vos cles API (Anthropic, ElevenLabs, etc.)

# 3. Lancer les services
make dev

# 4. Lancer les migrations BDD
make db-migrate

# 5. Seed des donnees de base
make db-seed
```

## URLs
- Backend API : http://localhost:8000
- Documentation API (Swagger) : http://localhost:8000/docs
- Dashboard Famille : http://localhost:3000

## Developpement local (sans Docker)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### App tablette
```bash
cd frontend
npm install
npx expo start
```

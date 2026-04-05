# Guide d'installation

## Prérequis
- Docker & Docker Compose
- Node.js 20+ (pour le dev website/dashboard/app)
- Python 3.11+ (pour le dev backend local)

## Démarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/StudioCavalli/Memoria.git
cd Memoria

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API (Anthropic, ElevenLabs, etc.)

# 3. Tout lancer
chmod +x start.sh
./start.sh
```

## URLs
- Backend API : http://localhost:8000
- Documentation API (Swagger) : http://localhost:8000/docs
- Site + Dashboard : http://localhost:3000

## Développement local (sans Docker)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Site + Dashboard (Next.js)
```bash
cd website
npm install --legacy-peer-deps
NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev
```

### App tablette (React Native)
```bash
cd app
npm install
npx expo start
```

## Structure du repo

```
backend/       API Python/FastAPI
app/           App tablette senior — React Native (Expo) + NativeWind
website/       Site vitrine + Dashboard famille — Next.js 15 + Tailwind v4
database/      Scripts SQL, seed des thèmes
docs/          Documentation technique
```

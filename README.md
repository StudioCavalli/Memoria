# MEMORIA

Systeme d'IA Biographique et Preventive pour seniors (80+ ans) a domicile et leurs familles.

## Architecture

```
backend/      — API Python/FastAPI (moteur IA, STT/TTS, analyse cognitive)
frontend/     — App React Native tablette senior (mode kiosque)
dashboard/    — Dashboard famille (React web)
database/     — Scripts SQL et migrations Alembic
docs/         — Documentation technique
```

## Stack technique

- **Backend** : Python 3.11+ / FastAPI / SQLAlchemy / Alembic
- **Base de donnees** : PostgreSQL 15+ avec chiffrement AES-256
- **App Senior** : React Native (Expo) pour tablette
- **Dashboard Famille** : React + Vite + TypeScript
- **IA** : Claude API / GPT-4o + ElevenLabs/Azure TTS
- **Infra** : Docker Compose / CI GitHub Actions

## Demarrage rapide

```bash
cp .env.example .env
docker compose up -d
```

- Backend API : http://localhost:8000
- Dashboard : http://localhost:3000
- Docs API : http://localhost:8000/docs

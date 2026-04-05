# MEMORIA

**Systeme d'IA Biographique et Preventive** pour les seniors de 80 ans et plus, a domicile ou en etablissement, et leurs familles.

Memoria est un compagnon vocal bienveillant qui recueille les souvenirs de vie des aines, les transmet aux proches sous forme de Gazette hebdomadaire, et surveille les premiers signes de declin cognitif grace a l'analyse du langage naturel.

---

## Architecture

```
                Tablette (kiosque)            Backend API                Dashboard Web
               +------------------+      +-------------------+      +------------------+
               |  Senior (80+)    |----->|  FastAPI :8000     |<-----|  Famille         |
               |  1 bouton        | WS   |  PostgreSQL        | REST |  7 pages         |
               |  Voix <-> IA     |      |  IA + Sentinelle   |      |  Souvenirs/Alerts|
               +------------------+      +-------------------+      +------------------+
```

```
backend/       API Python/FastAPI — moteur IA, STT/TTS, analyse cognitive, alertes
frontend/      App React Native (Expo) — tablette senior, mode kiosque
dashboard/     Dashboard famille — React + Vite + TypeScript
database/      Scripts SQL, seed des themes
docs/          Documentation technique (architecture, setup, API)
```

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Backend API** | Python 3.9+ / FastAPI / Uvicorn |
| **ORM & Migrations** | SQLAlchemy 2.0 / Alembic |
| **Base de donnees** | PostgreSQL 15+ (Prisma Postgres heberge) |
| **Chiffrement** | AES-256-GCM sur toutes les transcriptions |
| **Auth** | JWT (access + refresh tokens) / bcrypt |
| **IA conversationnelle** | Anthropic Claude API / OpenAI GPT-4o |
| **Speech-to-Text** | OpenAI Whisper / Azure Speech Services |
| **Text-to-Speech** | ElevenLabs / Azure Neural TTS |
| **Analyse NLP** | spaCy (fr_core_news_sm) + regex fallback |
| **App Senior** | React Native (Expo) / TypeScript |
| **Dashboard Famille** | React 18 + Vite + TypeScript + Recharts |
| **Stockage fichiers** | S3-compatible (MinIO / AWS S3) |
| **Notifications** | WebSocket temps reel + SendGrid email |
| **Infra** | Docker Compose / Makefile |

---

## Backend — Structure detaillee

### 14 groupes de routes API

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` `login` `refresh` `GET me` | Inscription, connexion JWT, refresh token, profil |
| `POST /api/seniors/` `GET` `PUT` | CRUD profil senior (lie aux membres famille) |
| `POST /api/sessions/start` `/{id}/message` `/{id}/end` | Demarrer, converser, terminer une session |
| `GET /api/memories/` `/{id}` | Souvenirs extraits avec filtres (theme, periode, pagination) |
| `GET /api/memories/themes/` | Liste des themes disponibles |
| `GET /api/alerts/` `PUT /{id}/read` | Alertes Sentinelle (filtrage, marquer comme lue) |
| `GET /api/seniors/{id}/metrics/history` `summary` | Metriques cognitives (historique, resume, tendances) |
| `GET /api/gazettes/` `/{id}` `/{id}/pdf` | Gazettes hebdomadaires (liste, detail, telechargement PDF) |
| `POST /api/stt/transcribe` | Transcription audio vers texte |
| `POST /api/tts/synthesize` `stream` | Synthese vocale (complete ou streaming) |
| `GET /api/questions/next` `POST followup` | Questions biographiques intelligentes |
| `POST /api/sessions/{id}/audio` `GET` | Upload et lecture des enregistrements audio |
| `GET /api/gdpr/export` `DELETE delete-account` | Export RGPD et suppression complete du compte |
| `WS /ws/voice/{session_id}` | Pipeline vocal bidirectionnel temps reel |
| `WS /ws/tablet/{senior_id}` `WS /ws/dashboard/{user_id}` | Notifications push temps reel |

### 13 services metier

| Service | Role |
|---------|------|
| `AIConversationService` | Dialogue LLM avec system prompt biographe, streaming async, memoire long-terme |
| `STTService` | Transcription vocale (Whisper API + Azure Speech), support francais |
| `TTSService` | Synthese vocale naturelle (ElevenLabs + Azure Neural), cache phrases frequentes, warm-up |
| `SemanticAnalysisService` | Analyse richesse semantique par session : mots uniques, type/token ratio, longueur phrases, entites nommees (spaCy), reponses evasives |
| `CognitiveAnalysisService` | Resume des tendances cognitives sur 7/14/30 jours, score de vitalite 0-100 |
| `AlertService` | Detection declin cognitif (chute vocabulaire >20%, latence +30%, inactivite 3j+, reponses evasives, duree sessions), notifications email + WebSocket |
| `MemoryExtractionService` | Pipeline post-session : extraction souvenirs par LLM, classification thematique, deduplication, resume de session |
| `QuestionBankService` | 100+ questions biographiques en 8 themes, selection intelligente (evite repetitions, varie les themes), relances contextuelles |
| `GazetteGeneratorService` | Generation PDF hebdomadaire (ReportLab) : compilation narrative des souvenirs, mise en page, envoi email aux proches |
| `StorageService` | Stockage S3-compatible pour audio et PDFs, presigned URLs. Fallback local (backend/uploads/) quand S3 non configure, servi via FastAPI StaticFiles |
| `SessionScheduler` | Declenchement automatique de sessions a horaires configures |
| `NotificationManager` | Notifications temps reel WebSocket (tablettes + dashboards) + email SendGrid |
| `CronJobs` | APScheduler AsyncIO : alertes quotidiennes (CronTrigger 8h UTC), gazette hebdomadaire (dimanche 20h UTC). Execution unique garantie |

### 9 modeles de donnees (PostgreSQL)

| Table | Colonnes cles |
|-------|---------------|
| `users` | email, hashed_password, first_name, last_name, gdpr_consent, gdpr_consent_date |
| `family_members` | user_id, senior_id, role (family/caregiver/doctor), notify_email, notify_push |
| `seniors` | first_name, last_name, birth_date, birth_place, preferences (JSON), session_schedule (JSON) |
| `sessions` | senior_id, status (active/completed), audio_url, duration_seconds, summary |
| `transcriptions` | session_id, speaker (senior/ai), content_encrypted (AES-256), sequence_order, latency_ms |
| `memories` | senior_id, session_id, title, summary_encrypted (AES-256), period, people (JSON), places (JSON) |
| `themes` | name, description, icon — table de liaison memory_themes |
| `cognitive_metrics` | unique_words, type_token_ratio, avg_sentence_length, named_entities_count, avg_latency_ms, max_latency_ms, silence_count, evasive_responses |
| `alerts` | type (vigilance/vigilance_high/inactivity/evasive/duration_drop), severity, message, details (JSON), is_read |
| `gazettes` | title, pdf_url, week_start, week_end, email_sent |

### Pipeline vocal (WebSocket)

```
Senior parle ──> Micro tablette ──> WebSocket ──> STT (Whisper) ──> Texte
                                                                      |
                                                                      v
Audio <── Haut-parleur <── WebSocket <── TTS (ElevenLabs) <── LLM (Claude)
```

- **Streaming bout-en-bout** : le TTS commence des la premiere phrase du LLM
- **Latence cible < 1,5 seconde** entre fin de parole du senior et debut de reponse audio
- **Detection de silence** (30s) : relance automatique avec une nouvelle question
- **Interruption** : le senior peut couper l'IA en parlant

### Securite et RGPD

- **AES-256-GCM** : toutes les transcriptions et resumes sont chiffres en base avec nonce unique
- **JWT** : access token 15min + refresh token 7 jours, bcrypt pour les mots de passe
- **RGPD** : export complet (`GET /gdpr/export`), suppression totale (`DELETE /gdpr/delete-account`), consentement explicite a l'inscription
- **CORS** : origines restreintes, rate limiting prevu (slowapi)
- **Hebergement HDS** prevu pour la production

### Tests

```
tests/
  conftest.py          Fixtures : SQLite in-memory, TestClient, auth headers, senior fixture
  test_auth.py         8 tests : register, login, refresh, me, GDPR consent, duplicates
  test_seniors.py      6 tests : CRUD, authorization, access control
  test_sessions.py     5 tests : start, message (fallback IA), end, get, ended session
  test_encryption.py   4 tests : encrypt/decrypt, nonce unicite, vide, unicode
  test_question_bank.py 6 tests : 100+ questions, themes, selection, followup, preferred theme
  test_health.py       1 test  : health check
```

---

## Frontend — App tablette senior (React Native / Expo)

```
frontend/src/
  screens/HomeScreen.tsx    Ecran unique : bouton central, horloge, salutations contextuelles
  components/MainButton.tsx Bouton 160x160, 4 etats (idle/listening/thinking/speaking), haptic
  components/WaveAnimation.tsx  Onde sonore reactive, points pulsants, 60fps (Reanimated)
  services/api.ts           REST + WebSocket VoicePipeline client
  services/audio.ts         Capture micro (expo-av), lecture TTS, permissions
  constants/theme.ts        Palette WCAG AAA, polices 24-64pt, espacements
```

**Pipeline vocal (WebSocket) :**
- Appui sur le bouton → enregistrement audio (expo-av)
- Relachement → lecture du fichier audio (expo-file-system) → envoi en ArrayBuffer via WebSocket `VoicePipeline`
- Reception des events : `status` (listening/thinking/speaking), `response_text`, `silence_detected`
- Reception audio binaire TTS → ecriture fichier temp → lecture via expo-av
- Interruption : appuyer pendant que l'IA parle coupe la reponse
- Appui long : fin de session
- Reconnexion automatique en cas de perte WebSocket

**Principes UX :**
- **Zero friction** : un seul bouton, pas de menu, pas de navigation
- **Accessibilite 80+** : police 28pt minimum, contraste 7:1 (WCAG AAA), zone tactile 64x64dp
- **Mode kiosque** : app toujours au premier plan, demarrage automatique au boot
- **Feedback visuel** : animation d'onde quand l'IA ecoute, points quand elle reflechit, onde differente quand elle parle
- **Retour haptique** : vibration douce a chaque interaction
- **Salutations contextuelles** : "Bonjour" / "Bon apres-midi" / "Bonsoir" selon l'heure

---

## Dashboard — Interface famille (React + Vite)

```
dashboard/src/
  pages/LoginPage.tsx        Connexion email/mot de passe, stockage JWT
  pages/DashboardPage.tsx    Vue d'ensemble : derniere session, souvenirs, alertes, vitalite
  pages/MemoriesPage.tsx     Liste souvenirs avec filtres theme/recherche/pagination
  pages/AlertsPage.tsx       Alertes couleur par severite, marquer comme lue
  pages/GazettesPage.tsx     Archive des Gazettes PDF, telechargement
  pages/MetricsPage.tsx      Graphiques Recharts : vocabulaire, latence, score vitalite (SVG)
  pages/SettingsPage.tsx     Profil senior, horaires sessions, notifications, famille
  components/Layout.tsx      Sidebar responsive, menu mobile hamburger
  components/ProtectedRoute.tsx  Guard JWT avec redirect
  services/api.ts            Axios + intercepteur JWT auto-refresh sur 401 + 10 services API complets
```

**Services API implementes :** authService, seniorsService, sessionsService, memoriesService, alertsService (avec unreadCount), metricsService, gazettesService, gdprService, questionsService, settingsService + helper `resolveSeniorId()`

**Pages detaillees :**

| Page | Fonctionnalites |
|------|-----------------|
| **DashboardPage** | Recharts LineChart richesse semantique 7j, score vitalite colore (vert >70, orange 40-70, rouge <40), tendances, compteur alertes non lues, derniere session, derniere gazette, auto-refresh 60s |
| **MemoriesPage** | Filtres theme (pills dynamiques depuis l'API), recherche texte client-side, pagination skip/limit, expand/collapse detail, tags themes colores, bouton "Reecouter" si audio dispo |
| **AlertsPage** | Code couleur severite (vert/orange/rouge), "Marquer comme lu", filtre "Non lues uniquement", WebSocket temps reel (`ws://dashboard/{userId}`), toast notification "Nouvelle alerte recue" |
| **GazettesPage** | Archive des Gazettes PDF, telechargement |
| **MetricsPage** | Graphiques Recharts vocabulaire + latence 30j, jauge SVG vitalite |
| **SettingsPage** | Profil senior CRUD, horaires sessions (jours + heure + duree), preferences notification (email alertes, email gazette, push), liste famille (lecture), export RGPD (JSON), suppression compte (confirmation 2 etapes) |

**Notifications temps reel :** connexion WebSocket au backend, reception d'evenements `new_alert`, banniere de notification avec bouton refresh.

**CORS :** origines configurables via variable d'environnement `CORS_ORIGINS` (separes par virgules).

---

## Base de donnees

La base est hebergee sur **Prisma Postgres** (cloud). Schema complet avec 11 tables et 10 themes biographiques pre-configures.

**Themes seeds :** Enfance, Adolescence, Famille, Travail, Voyages, Passions, Cuisine, Fetes, Histoire, Vie quotidienne

**Compte demo :**
- Email : `demo@memoria.fr`
- Mot de passe : `Memoria2026!`
- Senior associe : Jeanne Martin (nee le 15/03/1940 a Nice)

---

## Demarrage rapide

### Mode local (recommande pour le dev)

```bash
# 1. Cloner
git clone https://github.com/StudioCavalli/Memoria.git
cd Memoria

# 2. Configurer
cp .env.example .env
# Editer .env avec vos cles API (Anthropic, ElevenLabs, etc.)

# 3. Lancer tout
chmod +x start.sh
./start.sh
```

Le script `start.sh` :
- Cree le virtualenv Python et installe les dependances
- Lance le backend FastAPI sur le port 8000
- Installe et lance le dashboard React sur le port 3000
- Attend que le backend soit pret avant d'afficher les URLs

### Mode Docker

```bash
./start.sh docker
```

Lance PostgreSQL, Redis, le backend et le dashboard via Docker Compose.

### URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| Documentation Swagger | http://localhost:8000/docs |
| Dashboard Famille | http://localhost:3000 |

### Commandes Makefile

```bash
make dev          # Lancer l'environnement Docker
make stop         # Arreter
make logs         # Voir les logs
make db-migrate   # Lancer les migrations Alembic
make db-seed      # Seed des themes
make test         # Lancer les tests
make db-reset     # Reset complet de la BDD
```

---

## Variables d'environnement

Voir `.env.example` pour la liste complete. Les principales :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_SECRET_KEY` | Cle secrete pour les tokens JWT |
| `ANTHROPIC_API_KEY` | Cle API Anthropic (Claude) |
| `OPENAI_API_KEY` | Cle API OpenAI (Whisper STT, GPT-4o fallback) |
| `ELEVENLABS_API_KEY` | Cle API ElevenLabs (TTS) |
| `AZURE_SPEECH_KEY` | Cle Azure Speech (STT/TTS alternatif) |
| `SENDGRID_API_KEY` | Cle SendGrid (envoi emails Gazette + alertes) |
| `AES_ENCRYPTION_KEY` | Cle de chiffrement AES-256 (32 bytes) |
| `S3_ENDPOINT` `S3_ACCESS_KEY` `S3_SECRET_KEY` | Stockage S3-compatible |

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — Schema d'architecture du systeme
- [`docs/setup.md`](docs/setup.md) — Guide d'installation complet
- [`docs/api.md`](docs/api.md) — Documentation de l'API REST
- Swagger interactif : http://localhost:8000/docs

---

## Tests

### Suite de tests (pytest)

```
tests/
  conftest.py                 Fixtures : SQLite in-memory, TestClient, auth, senior_with_sessions,
                              senior_with_metrics, mock_anthropic
  test_auth.py                8 tests  : register, login, refresh, me, GDPR consent, duplicates
  test_seniors.py             6 tests  : CRUD, authorization, access control
  test_sessions.py            5 tests  : start, message (fallback IA), end, get, ended session
  test_encryption.py          4 tests  : encrypt/decrypt, nonce unicite, vide, unicode
  test_question_bank.py       6 tests  : 100+ questions, themes, selection, followup
  test_health.py              1 test   : health check
  test_memories.py           12 tests  : CRUD, filtres theme/periode, pagination, themes list
  test_alerts.py             15 tests  : declin cognitif, inactivite, dedup, evasive, endpoints
  test_metrics.py            14 tests  : historique, resume, tendances, score vitalite
  test_gazette.py            12 tests  : generation PDF, narrative LLM mocke, stockage
  test_gdpr.py               14 tests  : export avec dechiffrement, suppression cascade
  test_semantic_analysis.py  12 tests  : NLP metrics, detection evasive, regex fallback
  test_ai_conversation.py    11 tests  : fallback, mock Anthropic, contexte memoire
```

**Total : 15 fichiers, 120+ tests, 2035 lignes**

Tous les services externes (Anthropic, OpenAI, ElevenLabs) sont mockes dans les tests — les tests tournent sans cle API.

### Scripts de validation

```bash
# Valider toutes les APIs externes d'un coup
python3 scripts/validate_apis.py

# Tester le pipeline complet bout-en-bout (necessite les cles API)
python3 scripts/test_pipeline.py
```

`validate_apis.py` teste : Anthropic Claude, OpenAI Whisper, ElevenLabs TTS, Azure Speech, SendGrid, PostgreSQL.

---

## Statistiques du projet

| Metrique | Valeur |
|----------|--------|
| Fichiers source backend | 64 fichiers Python |
| Fichiers source frontend | 6 fichiers TypeScript |
| Fichiers source dashboard | 13 fichiers TypeScript |
| Tests | 15 fichiers, 120+ tests, 2035 lignes |
| Modeles BDD | 9 tables + 1 table de liaison + migration Alembic |
| Routes API | 14 groupes, ~30 endpoints |
| Services metier | 13 services |
| Questions biographiques | 145 questions en 8 themes |
| Cron jobs | APScheduler (alertes 8h UTC, gazette dim 20h UTC) |
| Stockage | S3-compatible + fallback local (uploads/) |
| Issues GitHub | 61 fermees sur 67 |
| Milestones | 11 (P1 + P2 + P3 termines) |

---

## Licence

Projet prive — Foxcase / Christopher Cavalli — 2026

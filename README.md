# MEMORIA

**Système d'IA Biographique et Préventive** pour les seniors de 80 ans et plus, à domicile ou en établissement, et leurs familles.

Memoria est un compagnon vocal bienveillant qui recueille les souvenirs de vie des aînés, les transmet aux proches sous forme de Gazette hebdomadaire, et surveille les premiers signes de déclin cognitif grâce à l'analyse du langage naturel.

> 📩 **Candidature soumise à l'AMI de la CCI Nice Côte d'Azur** dans le cadre du Salon Silver Économie (démo prévue le 2 juin 2026). Le pitch complet est disponible dans `pitch/MEMORIA_Pitch.pdf`.

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
app/           App tablette senior — React Native (Expo) + NativeWind (Tailwind)
website/       Site vitrine + Dashboard famille — Next.js 16.3 + Tailwind v4
database/      Scripts SQL, seed des thèmes
docs/          Documentation technique (architecture, setup, API, scénario démo)
```

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Backend API** | Python 3.11+ / FastAPI / Uvicorn (packaging & lockfile via uv) |
| **ORM & Migrations** | SQLAlchemy 2.0 / Alembic |
| **Jobs durables** | Celery + Redis (pipeline post-session, gazette hebdomadaire) |
| **Base de données** | PostgreSQL 15+ (Prisma Postgres hébergé) |
| **Chiffrement** | AES-256-GCM sur toutes les transcriptions |
| **Auth** | JWT (access + refresh tokens) / bcrypt |
| **IA conversationnelle** | Anthropic Claude API / OpenAI GPT-4o |
| **Speech-to-Text** | OpenAI Whisper / Azure Speech Services |
| **Text-to-Speech** | ElevenLabs / Azure Neural TTS |
| **Analyse NLP** | spaCy (fr_core_news_sm) + regex fallback |
| **App Senior** | React Native (Expo) / TypeScript |
| **Dashboard Famille** | Next.js 16.3 + React 19 + Tailwind v4 + Recharts (dans website/) |
| **Stockage fichiers** | S3-compatible (MinIO / AWS S3) |
| **Notifications** | WebSocket temps réel + SendGrid email |
| **Type-safety** | Types front générés depuis l'OpenAPI FastAPI (`npm run gen:api-types`) |
| **CI** | GitHub Actions : ruff + pytest (back), tsc + vitest + build (web), tsc + expo-doctor (mobile), fraîcheur du contrat OpenAPI |
| **Infra** | Dockerfiles prod multi-stage (non-root) / Docker Compose / Makefile |

---

## Backend — Structure détaillée

### 14 groupes de routes API

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` `login` `refresh` `GET me` | Inscription, connexion JWT, refresh token, profil |
| `POST /api/seniors/` `GET` `PUT` | CRUD profil senior (lié aux membres famille) |
| `POST /api/sessions/start` `/{id}/message` `/{id}/end` | Démarrer, converser, terminer une session |
| `GET /api/memories/` `/{id}` | Souvenirs extraits avec filtres (thème, période, pagination) |
| `GET /api/memories/themes/` | Liste des thèmes disponibles |
| `GET /api/alerts/` `PUT /{id}/read` | Alertes Sentinelle (filtrage, marquer comme lue) |
| `GET /api/seniors/{id}/metrics/history` `summary` | Métriques cognitives (historique, résumé, tendances) |
| `GET /api/gazettes/` `/{id}` `/{id}/pdf` | Gazettes hebdomadaires (liste, détail, téléchargement PDF) |
| `POST /api/stt/transcribe` | Transcription audio vers texte |
| `POST /api/tts/synthesize` `stream` | Synthèse vocale (complète ou streaming) |
| `GET /api/questions/next` `POST followup` | Questions biographiques intelligentes |
| `POST /api/sessions/{id}/audio` `GET` | Upload et lecture des enregistrements audio |
| `GET /api/gdpr/export` `DELETE delete-account` | Export RGPD et suppression complète du compte |
| `WS /ws/voice/{session_id}` | Pipeline vocal bidirectionnel temps réel |
| `WS /ws/tablet/{senior_id}` `WS /ws/dashboard/{user_id}` | Notifications push temps réel |

### 13 services métier

| Service | Rôle |
|---------|------|
| `AIConversationService` | Dialogue LLM avec system prompt biographe, streaming async, mémoire long-terme |
| `STTService` | Transcription vocale (Whisper API + Azure Speech), support français |
| `TTSService` | Synthèse vocale naturelle (ElevenLabs + Azure Neural), cache phrases fréquentes, warm-up |
| `SemanticAnalysisService` | Analyse richesse sémantique par session : mots uniques, type/token ratio, longueur phrases, entités nommées (spaCy), réponses évasives |
| `CognitiveAnalysisService` | Résumé des tendances cognitives sur 7/14/30 jours, score de vitalité 0-100 |
| `AlertService` | Détection déclin cognitif (chute vocabulaire >20%, latence +30%, inactivité 3j+, réponses évasives, durée sessions), notifications email + WebSocket |
| `MemoryExtractionService` | Pipeline post-session : extraction souvenirs par LLM, classification thématique, déduplication, résumé de session |
| `QuestionBankService` | 145 questions biographiques en 8 thèmes, sélection intelligente (évite répétitions, varie les thèmes), relances contextuelles |
| `GazetteGeneratorService` | Génération PDF hebdomadaire (ReportLab) : compilation narrative des souvenirs, mise en page, envoi email aux proches |
| `StorageService` | Stockage S3-compatible pour audio et PDFs, presigned URLs. Fallback local (backend/uploads/) quand S3 non configuré, servi via FastAPI StaticFiles |
| `SessionScheduler` | Déclenchement automatique de sessions à horaires configurés |
| `NotificationManager` | Notifications temps réel WebSocket (tablettes + dashboards) + email SendGrid |
| `CronJobs` | APScheduler AsyncIO : alertes quotidiennes (8h UTC), gazette hebdomadaire (dimanche 20h UTC). La gazette **enqueue une tâche Celery durable par senior** (retries) au lieu d'un traitement inline |
| `tasks.py` (Celery) | Tâches durables avec retries/backoff : pipeline post-session (extraction souvenirs) + génération de gazette. Remplace l'ancien fire-and-forget |

### 9 modèles de données (PostgreSQL)

| Table | Colonnes clés |
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

- **Streaming bout-en-bout** : le TTS commence dès la première phrase du LLM
- **Latence cible < 1,5 seconde** entre fin de parole du senior et début de réponse audio
- **Détection de silence** (30s) : relance automatique avec une nouvelle question
- **Interruption** : le senior peut couper l'IA en parlant

### Sécurité et RGPD

- **AES-256-GCM** : toutes les transcriptions et résumés sont chiffrés en base avec nonce unique
- **JWT** : access token 15min + refresh token 7 jours, bcrypt pour les mots de passe
- **RGPD** : export complet (`GET /gdpr/export`), suppression totale (`DELETE /gdpr/delete-account`), consentement explicite à l'inscription
- **CORS** : origines configurables via `CORS_ORIGINS`, rate limiting prévu (slowapi)
- **Hébergement HDS** prévu pour la production

---

## App tablette senior (React Native / Expo / NativeWind)

```
app/src/
  screens/SetupScreen.tsx     Configuration initiale : PIN → login → sélection senior
  screens/HomeScreen.tsx      Écran principal : bouton, horloge, salutation personnalisée
  components/MainButton.tsx   Bouton 160x160, 4 états visuels, retour haptique
  components/WaveAnimation.tsx  Onde sonore réactive 60fps (Reanimated)
  services/api.ts             REST + WebSocket VoicePipeline client
  services/audio.ts           Capture micro (expo-av), lecture TTS, permissions
  services/storage.ts         AsyncStorage : pairing tablette ↔ senior
  i18n/translations.ts        Traductions FR/EN/ES/IT (40+ clés par langue)
  i18n/context.tsx             I18nProvider + useI18n hook (AsyncStorage)
  constants/theme.ts           Palette Memoria (même que le site via NativeWind)
```

**Pairing tablette ↔ senior (premier lancement) :**
1. L'app demande un **code PIN** (1234) — seul le proche/aidant le connaît
2. Le proche entre ses **identifiants Memoria** (email + mot de passe)
3. L'app se connecte au backend (`POST /api/auth/login`) et récupère la liste des seniors
4. Sélection du senior → `senior_id`, `senior_name`, `api_token`, `api_url` sauvés dans **AsyncStorage**
5. Les lancements suivants vont directement au HomeScreen avec "Bonjour Jeanne"

**Paramètres cachés :** appui long (3s) sur l'horloge → PIN → panneau settings (changer senior, URL serveur, réinitialiser)

**Lien tablette ↔ dashboard :**
```
Même compte famille (demo@memoria.fr)
        │
   ┌────┴────┐
   ▼         ▼
TABLETTE   DASHBOARD
(senior_id=1)
   │         │
   └────┬────┘
        ▼
  JEANNE MARTIN
  (sessions, souvenirs, métriques, alertes)
```

**Pipeline vocal (WebSocket) :**
- Appui sur le bouton → enregistrement audio (expo-av)
- Relâchement → lecture fichier audio (expo-file-system) → envoi ArrayBuffer via WebSocket
- Réception events : `status` (listening/thinking/speaking), `response_text`, `silence_detected`
- Réception audio TTS binaire → écriture fichier temp → lecture via expo-av
- Interruption : appuyer pendant que l'IA parle coupe la réponse
- Appui long : fin de session
- Reconnexion automatique + mode dégradé si API injoignable

**Design (NativeWind — même palette Tailwind que le site) :**
- Fond cream `#FFF8F0`, bouton brown `#7D6340`, écoute orange `#E8A87C`, parole green `#4A7A35`
- Classes partagées : `bg-cream`, `text-brown`, `rounded-2xl` — identiques au site web

**Principes UX :**
- **Zéro friction** : un seul bouton, pas de menu, pas de navigation
- **Accessibilité 80+** : police 28pt minimum, contraste WCAG AAA, zone tactile 64dp
- **Mode kiosque** : app toujours au premier plan, keep-awake activé
- **Feedback visuel** : onde quand l'IA écoute, points quand elle réfléchit
- **Retour haptique** : vibration douce à chaque interaction
- **Salutations contextuelles** : "Bonjour Jeanne" / "Bon après-midi Jeanne" selon l'heure

---

## Dashboard — Interface famille (intégré dans website/ — Next.js 16.3)

```
website/app/
  login/page.tsx              Connexion email/mot de passe, stockage JWT
  dashboard/page.tsx          Vue d'ensemble : dernière session, souvenirs, alertes, vitalité
  dashboard/memories/page.tsx Liste souvenirs avec filtres thème/recherche/pagination
  dashboard/alerts/page.tsx   Alertes couleur par sévérité, WebSocket temps réel
  dashboard/gazettes/page.tsx Archive des Gazettes PDF, téléchargement
  dashboard/metrics/page.tsx  Graphiques Recharts : vocabulaire, latence, score vitalité
  dashboard/settings/page.tsx Profil senior, horaires sessions, notifications, RGPD
  dashboard/layout.tsx        AuthGuard + DashboardLayout (sidebar, navigation)

website/components/dashboard/
  AuthGuard.tsx               Vérification JWT, redirect vers /login si absent
  DashboardLayout.tsx         Sidebar responsive, menu mobile, navigation Next.js

website/lib/
  dashboard-api.ts            Fetch natif + auto-refresh JWT + 10 services API complets
  i18n/translations.ts        Traductions FR/EN/ES/IT (200+ clés par langue)
  i18n/context.tsx             I18nProvider + useI18n hook (localStorage)
```

**Services API implémentés :** authService, seniorsService, sessionsService, memoriesService, alertsService (avec unreadCount), metricsService, gazettesService, gdprService, questionsService, settingsService + helper `resolveSeniorId()`

**Pages détaillées :**

| Page | Fonctionnalités |
|------|-----------------|
| **DashboardPage** | Recharts LineChart richesse sémantique 7j, score vitalité coloré (vert >70, orange 40-70, rouge <40), tendances, compteur alertes non lues, dernière session, dernière gazette, auto-refresh 60s |
| **MemoriesPage** | Filtres thème (pills dynamiques depuis l'API), recherche texte client-side, pagination skip/limit, expand/collapse détail, tags thèmes colorés, bouton "Réécouter" si audio dispo |
| **AlertsPage** | Code couleur sévérité (vert/orange/rouge), "Marquer comme lu", filtre "Non lues uniquement", WebSocket temps réel (`ws://dashboard/{userId}`), toast notification "Nouvelle alerte reçue" |
| **GazettesPage** | Archive des Gazettes PDF, téléchargement |
| **MetricsPage** | Graphiques Recharts vocabulaire + latence 30j, jauge SVG vitalité |
| **SettingsPage** | Profil senior CRUD, horaires sessions (jours + heure + durée), préférences notification (email alertes, email gazette, push), liste famille (lecture), export RGPD (JSON), suppression compte (confirmation 2 étapes) |

**Notifications temps réel :** connexion WebSocket au backend, réception d'événements `new_alert`, bannière de notification avec bouton refresh.

**Design system :** même palette Tailwind v4 que le site vitrine — cream/brown/orange, Merriweather (titres) + Nunito (corps), cards `rounded-2xl shadow-sm`, aucun style inline.

**CORS :** origines configurables via variable d'environnement `CORS_ORIGINS` (séparés par virgules).

---

## Internationalisation (i18n)

L'ensemble du projet supporte **4 langues** : Français, English, Español, Italiano.

| Composant | Approche | Clés | Persistance |
|-----------|----------|------|-------------|
| **Website + Dashboard** | React context + `useI18n()` | 200+ clés | `localStorage` |
| **App tablette** | React context + `useI18n()` | 40+ clés | `AsyncStorage` |

- **Aucune bibliothèque externe** — contexte React natif avec fallback vers le français
- **Dropdown langue** dans la navbar du site (Français / English / Español / Italiano)
- **Sélecteur compact** FR/EN/ES/IT sur l'écran de setup de l'app tablette + dans les paramètres cachés
- Les données métier (souvenirs, alertes) restent dans la langue source — seule l'interface est traduite
- Les pages légales restent en français (obligation légale)

---

## Base de données

La base est hébergée sur **Prisma Postgres** (cloud). Schéma complet avec 11 tables et 10 thèmes biographiques pré-configurés.

**Thèmes seeds :** Enfance, Adolescence, Famille, Travail, Voyages, Passions, Cuisine, Fêtes, Histoire, Vie quotidienne

**Compte démo :**
- Email : `demo@memoria.fr`
- Mot de passe : `Memoria2026!`
- Senior associé : Jeanne Martin (née le 15/03/1940 à Nice)

**Données de démo** (via `scripts/seed_demo.py`) :
- 18 sessions sur 30 jours avec conversations biographiques françaises
- 30 souvenirs classés dans les 10 thèmes (enfance à Nice, mariage, enseignement, Italie 1965, cuisine, Mai 68...)
- Métriques cognitives par session (baseline saine → légère amélioration)
- 3 alertes (inactivité, vigilance, évasive)
- 3 gazettes hebdomadaires

---

## Démarrage rapide

### Mode local (recommandé pour le dev)

```bash
# 1. Cloner
git clone https://github.com/StudioCavalli/Memoria.git
cd Memoria

# 2. Configurer
cp .env.example .env
# Éditer .env avec vos clés API (Anthropic, ElevenLabs, etc.)

# 3. Lancer tout
chmod +x start.sh
./start.sh
```

Le script `start.sh` :
- Crée le virtualenv Python et installe les dépendances
- Lance le backend FastAPI sur le port 8000
- Installe et lance le dashboard React sur le port 3000
- Attend que le backend soit prêt avant d'afficher les URLs

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
make stop         # Arrêter
make logs         # Voir les logs
make db-migrate   # Lancer les migrations Alembic
make db-seed      # Seed des thèmes
make test         # Lancer les tests
make db-reset     # Reset complet de la BDD
```

---

## Variables d'environnement

Voir `.env.example` pour la liste complète. Les principales :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_SECRET_KEY` | Clé secrète pour les tokens JWT |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (Claude) |
| `OPENAI_API_KEY` | Clé API OpenAI (Whisper STT, GPT-4o fallback) |
| `ELEVENLABS_API_KEY` | Clé API ElevenLabs (TTS) |
| `AZURE_SPEECH_KEY` | Clé Azure Speech (STT/TTS alternatif) |
| `SENDGRID_API_KEY` | Clé SendGrid (envoi emails Gazette + alertes) |
| `AES_ENCRYPTION_KEY` | Secret de chiffrement, dérivé en clé AES-256 via HKDF (≥ 32 caractères ; ex. `openssl rand -base64 48`) |
| `ANTHROPIC_MODEL` | Modèle Claude (défaut `claude-sonnet-5`) |
| `CORS_ORIGINS` | Origines autorisées (CSV) — défaut localhost, à définir en prod |
| `CORS_ORIGINS` | Origines CORS autorisées (séparées par virgules) |
| `S3_ENDPOINT` `S3_ACCESS_KEY` `S3_SECRET_KEY` | Stockage S3-compatible |

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — Schéma d'architecture du système
- [`docs/setup.md`](docs/setup.md) — Guide d'installation complet
- [`docs/api.md`](docs/api.md) — Documentation de l'API REST
- [`docs/scenario-demo.md`](docs/scenario-demo.md) — Scénario de démonstration 5 minutes (salon Silver Éco)
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
  test_encryption.py          4 tests  : encrypt/decrypt, nonce unicité, vide, unicode
  test_question_bank.py       6 tests  : 145 questions, thèmes, sélection, followup
  test_health.py              1 test   : health check
  test_memories.py           12 tests  : CRUD, filtres thème/période, pagination, themes list
  test_alerts.py             15 tests  : déclin cognitif, inactivité, dédup, évasive, endpoints
  test_metrics.py            14 tests  : historique, résumé, tendances, score vitalité
  test_gazette.py            12 tests  : génération PDF, narrative LLM mocké, stockage
  test_gdpr.py               14 tests  : export avec déchiffrement, suppression cascade
  test_semantic_analysis.py  12 tests  : NLP metrics, détection évasive, regex fallback
  test_ai_conversation.py    11 tests  : fallback, mock Anthropic, contexte mémoire
```

**Total backend : 126 tests (pytest).** Front : 10 tests (Vitest). Tout tourne en CI (GitHub Actions).

Tous les services externes (Anthropic, OpenAI, ElevenLabs) sont mockés dans les tests — les tests tournent sans clé API.

### Scripts de validation

```bash
# Valider toutes les APIs externes d'un coup
python3 scripts/validate_apis.py

# Tester le pipeline complet bout-en-bout (nécessite les clés API)
python3 scripts/test_pipeline.py
```

`validate_apis.py` teste : Anthropic Claude, OpenAI Whisper, ElevenLabs TTS, Azure Speech, SendGrid, PostgreSQL.

---

## Statistiques du projet

| Métrique | Valeur |
|----------|--------|
| Fichiers source backend | 64 fichiers Python |
| Fichiers source app tablette | 10 fichiers TypeScript (NativeWind) |
| Fichiers source website + dashboard | 30+ fichiers TypeScript (Next.js) |
| Tests | Backend : 126 tests (pytest) · Front : 10 tests (Vitest + Testing Library) |
| Modèles BDD | 9 tables + 1 table de liaison + migration Alembic |
| Routes API | 14 groupes, ~30 endpoints |
| Services métier | 13 services |
| Questions biographiques | 145 questions en 8 thèmes |
| Cron jobs | APScheduler (alertes 8h UTC, gazette dim 20h UTC) → tâches Celery durables |
| Stockage | S3-compatible + fallback local (uploads/) |
| Données de démo | 18 sessions, 30 souvenirs, 3 alertes, 3 gazettes (30 jours) |
| Langues supportées | 4 (FR, EN, ES, IT) — 240+ clés de traduction |
| Issues GitHub | 67/67 fermées |
| Milestones | 12 terminés |

---

## Licence

Projet privé — Foxcase / Christopher Cavalli — 2026

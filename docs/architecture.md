# Architecture MEMORIA

## Vue d'ensemble

```
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|   Tablette Senior | <---> |   Backend API     | <---> |   Dashboard       |
|   (React Native)  |  WS   |   (FastAPI)       |  REST |   Famille (React) |
|                   |       |                   |       |                   |
+-------------------+       +--------+----------+       +-------------------+
                                     |
                            +--------+----------+
                            |                   |
                            |   PostgreSQL      |
                            |   + Redis         |
                            |                   |
                            +-------------------+
```

## Composants

### 1. Interface Senior (Tablette)
- **Stack** : React Native (Expo) + TypeScript
- **Mode** : Kiosque (app toujours ouverte)
- **Communication** : WebSocket pour le flux audio, REST pour les sessions

### 2. Backend API
- **Stack** : Python 3.11 / FastAPI / SQLAlchemy / Alembic
- **Services** :
  - `AIConversationService` — Gestion des dialogues via LLM
  - `SemanticAnalysisService` — Analyse de la richesse semantique
  - `AlertService` — Detection de declin cognitif et alertes
  - `MemoryExtractionService` — Extraction des souvenirs depuis les transcriptions
  - `GazetteGeneratorService` — Generation PDF hebdomadaire

### 3. Dashboard Famille
- **Stack** : React + Vite + TypeScript + Recharts
- **Pages** : Dashboard, Souvenirs, Alertes, Gazettes, Metriques, Parametres

### 4. Base de donnees
- **PostgreSQL 15** avec chiffrement AES-256 sur les colonnes sensibles
- **Redis** pour le cache et les files d'attente

## Flux de donnees

### Session de conversation
1. Senior appuie sur "Parler a Memoria"
2. Audio capture -> STT -> Texte
3. Texte -> LLM (avec historique) -> Reponse
4. Reponse -> TTS -> Audio joue
5. Transcription chiffree stockee en BDD

### Post-session
1. Extraction des souvenirs par LLM
2. Classification thematique automatique
3. Analyse cognitive (richesse semantique + latence)
4. Evaluation des alertes Sentinelle

### Gazette hebdomadaire
1. Job cron dimanche soir
2. Compilation des souvenirs de la semaine
3. Generation PDF
4. Envoi par email aux proches

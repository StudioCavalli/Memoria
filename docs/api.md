# API MEMORIA

Base URL : `http://localhost:8000/api`

Documentation interactive : `http://localhost:8000/docs`

## Authentification

Toutes les routes (sauf `/auth/*` et `/health`) requierent un header :
```
Authorization: Bearer <access_token>
```

### POST /auth/register
Inscription d'un membre de famille.
```json
{
  "email": "famille@example.com",
  "password": "motdepasse",
  "first_name": "Marie",
  "last_name": "Dupont",
  "gdpr_consent": true
}
```

### POST /auth/login
```json
{
  "email": "famille@example.com",
  "password": "motdepasse"
}
```
Retourne : `{ access_token, refresh_token, token_type }`

### POST /auth/refresh
### GET /auth/me

## Seniors

### POST /seniors — Creer un profil senior
### GET /seniors — Lister mes seniors
### GET /seniors/:id — Detail d'un senior
### PUT /seniors/:id — Modifier un senior

## Sessions

### POST /sessions/start — Demarrer une session
### POST /sessions/:id/message — Envoyer un message (retourne reponse IA)
### POST /sessions/:id/end — Terminer une session
### GET /sessions/:id — Detail d'une session

## Souvenirs

### GET /memories?senior_id=1&theme_id=2&period=Enfance
### GET /memories/:id
### GET /memories/themes/ — Liste des themes

## Alertes

### GET /alerts?senior_id=1&unread_only=true
### PUT /alerts/:id/read

## Metriques cognitives

### GET /seniors/:id/metrics/history?days=30
### GET /seniors/:id/metrics/summary

## Gazettes

### GET /gazettes?senior_id=1
### GET /gazettes/:id
### GET /gazettes/:id/pdf — Telecharger le PDF

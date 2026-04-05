import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Documentation API',
  description: 'Documentation technique de l\'API REST Memoria — endpoints, authentification, WebSocket, modèles de données.',
}

const endpoints = [
  {
    group: 'Authentification',
    description: 'Inscription, connexion et gestion des tokens JWT.',
    routes: [
      { method: 'POST', path: '/api/auth/register', desc: 'Inscription d\'un membre de famille', body: '{ email, password, first_name, last_name, gdpr_consent }', response: '{ access_token, refresh_token, token_type }' },
      { method: 'POST', path: '/api/auth/login', desc: 'Connexion', body: '{ email, password }', response: '{ access_token, refresh_token, token_type }' },
      { method: 'POST', path: '/api/auth/refresh', desc: 'Rafraîchir le token', body: '{ refresh_token }', response: '{ access_token, refresh_token }' },
      { method: 'GET', path: '/api/auth/me', desc: 'Profil utilisateur courant', body: null, response: '{ id, email, first_name, last_name, is_active }' },
    ],
  },
  {
    group: 'Seniors',
    description: 'Gestion des profils seniors liés à l\'utilisateur.',
    routes: [
      { method: 'POST', path: '/api/seniors/', desc: 'Créer un profil senior', body: '{ first_name, last_name, birth_date?, birth_place? }', response: 'Senior object' },
      { method: 'GET', path: '/api/seniors/', desc: 'Lister mes seniors', body: null, response: 'Senior[]' },
      { method: 'GET', path: '/api/seniors/:id', desc: 'Détail d\'un senior', body: null, response: 'Senior object' },
      { method: 'PUT', path: '/api/seniors/:id', desc: 'Modifier un senior', body: '{ first_name?, last_name?, birth_date?, preferences?, session_schedule? }', response: 'Senior object' },
    ],
  },
  {
    group: 'Sessions de conversation',
    description: 'Démarrer et gérer les sessions de dialogue avec l\'IA biographe.',
    routes: [
      { method: 'POST', path: '/api/sessions/start', desc: 'Démarrer une session', body: '{ senior_id }', response: '{ id, senior_id, status, started_at }' },
      { method: 'POST', path: '/api/sessions/:id/message', desc: 'Envoyer un message texte', body: '{ text }', response: '{ session_id, user_text, ai_response, latency_ms }' },
      { method: 'POST', path: '/api/sessions/:id/end', desc: 'Terminer la session', body: null, response: 'Session object (status: completed)' },
      { method: 'GET', path: '/api/sessions/:id', desc: 'Détail d\'une session', body: null, response: 'Session object' },
      { method: 'POST', path: '/api/sessions/:id/audio', desc: 'Uploader l\'enregistrement audio', body: 'FormData (file)', response: '{ audio_url }' },
      { method: 'GET', path: '/api/sessions/:id/audio', desc: 'Récupérer l\'audio', body: null, response: 'Redirect vers le fichier audio' },
    ],
  },
  {
    group: 'Souvenirs',
    description: 'Souvenirs extraits automatiquement des conversations, classés par thème.',
    routes: [
      { method: 'GET', path: '/api/memories/', desc: 'Lister les souvenirs', body: null, response: 'Memory[] — params: senior_id, theme_id?, period?, skip, limit' },
      { method: 'GET', path: '/api/memories/:id', desc: 'Détail d\'un souvenir', body: null, response: '{ id, title, summary, period, people, places, themes, created_at }' },
      { method: 'GET', path: '/api/memories/themes/', desc: 'Liste des thèmes', body: null, response: 'Theme[] — { id, name, description, icon }' },
    ],
  },
  {
    group: 'Alertes Sentinelle',
    description: 'Alertes cognitives détectées automatiquement par le module Sentinelle.',
    routes: [
      { method: 'GET', path: '/api/alerts/', desc: 'Lister les alertes', body: null, response: 'Alert[] — params: senior_id, unread_only?, skip, limit' },
      { method: 'PUT', path: '/api/alerts/:id/read', desc: 'Marquer comme lue', body: null, response: 'Alert object (is_read: true)' },
    ],
  },
  {
    group: 'Métriques cognitives',
    description: 'Suivi de la richesse sémantique, latence de réponse et score de vitalité.',
    routes: [
      { method: 'GET', path: '/api/seniors/:id/metrics/history', desc: 'Historique des métriques', body: null, response: 'CognitiveMetric[] — param: days (défaut 30)' },
      { method: 'GET', path: '/api/seniors/:id/metrics/summary', desc: 'Résumé et tendances', body: null, response: '{ semantic_richness_trend, latency_trend, avg_unique_words_7d, avg_latency_7d, vitality_score, sessions_count_7d }' },
    ],
  },
  {
    group: 'Gazettes',
    description: 'Gazettes PDF hebdomadaires compilant les souvenirs de la semaine.',
    routes: [
      { method: 'GET', path: '/api/gazettes/', desc: 'Lister les gazettes', body: null, response: 'Gazette[] — params: senior_id, skip, limit' },
      { method: 'GET', path: '/api/gazettes/:id', desc: 'Détail d\'une gazette', body: null, response: '{ id, title, pdf_url, week_start, week_end, email_sent }' },
      { method: 'GET', path: '/api/gazettes/:id/pdf', desc: 'Télécharger le PDF', body: null, response: 'Redirect vers l\'URL du PDF' },
    ],
  },
  {
    group: 'Parole (STT / TTS)',
    description: 'Transcription vocale et synthèse vocale.',
    routes: [
      { method: 'POST', path: '/api/stt/transcribe', desc: 'Transcrire un fichier audio', body: 'FormData (file)', response: '{ text }' },
      { method: 'POST', path: '/api/tts/synthesize', desc: 'Synthèse vocale complète', body: '{ text }', response: 'audio/mpeg (bytes)' },
      { method: 'POST', path: '/api/tts/stream', desc: 'Synthèse vocale en streaming', body: '{ text }', response: 'audio/mpeg (stream)' },
    ],
  },
  {
    group: 'Questions biographiques',
    description: '145 questions intelligentes réparties en 8 thèmes.',
    routes: [
      { method: 'GET', path: '/api/questions/next', desc: 'Prochaine question adaptée', body: null, response: '{ text, theme, depth } — params: senior_id, theme?' },
      { method: 'POST', path: '/api/questions/followup', desc: 'Question de relance contextuelle', body: '{ text }', response: '{ text, theme, depth }' },
    ],
  },
  {
    group: 'RGPD',
    description: 'Conformité RGPD : export et suppression des données.',
    routes: [
      { method: 'GET', path: '/api/gdpr/export', desc: 'Exporter toutes les données', body: null, response: 'JSON complet (seniors, sessions, souvenirs, métriques)' },
      { method: 'DELETE', path: '/api/gdpr/delete-account', desc: 'Supprimer le compte et toutes les données', body: null, response: '{ message: "Compte supprimé" }' },
    ],
  },
]

const wsEndpoints = [
  {
    path: 'ws://host/ws/voice/{session_id}',
    desc: 'Pipeline vocal bidirectionnel',
    details: [
      'Client envoie : chunks audio binaires, JSON { action: "end_turn" | "interrupt" | "end_session" }',
      'Serveur envoie : JSON { type: "transcription", text }, JSON { type: "response_text", text }, JSON { type: "status", status: "listening|thinking|speaking|idle" }, JSON { type: "latency", stt_ms, llm_ms, tts_ms, total_ms }, chunks audio binaires (TTS)',
    ],
  },
  {
    path: 'ws://host/ws/tablet/{senior_id}',
    desc: 'Notifications tablette (déclenchement de session)',
    details: ['Serveur envoie : JSON { event: "session_start", session_id }'],
  },
  {
    path: 'ws://host/ws/dashboard/{user_id}',
    desc: 'Notifications dashboard famille',
    details: ['Serveur envoie : JSON { event: "new_alert", alert_id, type, severity, message }'],
  },
]

const methodColors: Record<string, string> = {
  GET: 'bg-green-forest/15 text-green-forest',
  POST: 'bg-blue-500/15 text-blue-600',
  PUT: 'bg-orange-soft/20 text-orange-text',
  DELETE: 'bg-red-500/15 text-red-600',
  WS: 'bg-purple-500/15 text-purple-600',
}

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link href="/" className="text-orange-text text-sm font-semibold hover:underline">
              ← Retour au site
            </Link>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brown mt-4 mb-3">
              Documentation API
            </h1>
            <p className="text-text-muted text-lg max-w-2xl">
              Référence complète de l'API REST Memoria. Tous les endpoints nécessitent un token JWT
              (sauf <code className="bg-white px-1.5 py-0.5 rounded text-sm">/auth/*</code> et <code className="bg-white px-1.5 py-0.5 rounded text-sm">/health</code>).
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="bg-white rounded-lg px-4 py-2 text-sm">
                <span className="text-text-muted">Base URL :</span>{' '}
                <code className="font-bold text-brown">http://localhost:8000/api</code>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 text-sm">
                <span className="text-text-muted">Swagger :</span>{' '}
                <code className="font-bold text-brown">http://localhost:8000/docs</code>
              </div>
            </div>
          </div>

          {/* Auth header */}
          <div className="bg-white rounded-xl p-5 mb-8 border-l-4 border-orange-soft">
            <h3 className="font-heading text-base font-bold text-text-dark mb-2">Authentification</h3>
            <p className="text-sm text-text-muted mb-2">
              Ajoutez le header suivant à chaque requête authentifiée :
            </p>
            <code className="block bg-cream rounded-lg px-4 py-2 text-sm text-brown font-mono">
              Authorization: Bearer {'<access_token>'}
            </code>
            <p className="text-xs text-text-muted mt-2">
              Access token : 15 min · Refresh token : 7 jours · Hash : bcrypt
            </p>
          </div>

          {/* REST Endpoints */}
          <div className="space-y-10">
            {endpoints.map((group) => (
              <section key={group.group} id={group.group.toLowerCase().replace(/\s/g, '-')}>
                <div className="mb-4">
                  <h2 className="font-heading text-xl font-bold text-text-dark">{group.group}</h2>
                  <p className="text-sm text-text-muted">{group.description}</p>
                </div>
                <div className="space-y-3">
                  {group.routes.map((route) => (
                    <div key={`${route.method}-${route.path}`} className="bg-white rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${methodColors[route.method] || ''}`}>
                          {route.method}
                        </span>
                        <div className="flex-1 min-w-0">
                          <code className="text-sm font-mono text-text-dark break-all">{route.path}</code>
                          <p className="text-sm text-text-muted mt-1">{route.desc}</p>
                          {route.body && (
                            <div className="mt-2">
                              <span className="text-[10px] font-bold text-text-muted uppercase">Body</span>
                              <code className="block bg-cream rounded px-3 py-1.5 text-xs text-brown mt-1 font-mono">{route.body}</code>
                            </div>
                          )}
                          <div className="mt-2">
                            <span className="text-[10px] font-bold text-text-muted uppercase">Réponse</span>
                            <code className="block bg-cream rounded px-3 py-1.5 text-xs text-green-forest mt-1 font-mono">{route.response}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* WebSocket */}
          <section className="mt-12">
            <h2 className="font-heading text-xl font-bold text-text-dark mb-4">WebSocket</h2>
            <p className="text-sm text-text-muted mb-4">
              Trois endpoints WebSocket pour la communication temps réel.
            </p>
            <div className="space-y-4">
              {wsEndpoints.map((ws) => (
                <div key={ws.path} className="bg-white rounded-xl p-5 border-l-4 border-purple-400">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/15 text-purple-600">WS</span>
                    <code className="text-sm font-mono text-text-dark">{ws.path}</code>
                  </div>
                  <p className="text-sm text-text-muted mb-3">{ws.desc}</p>
                  <ul className="space-y-1">
                    {ws.details.map((detail, i) => (
                      <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">→</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Data Models */}
          <section className="mt-12">
            <h2 className="font-heading text-xl font-bold text-text-dark mb-4">Modèles de données</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'User', fields: 'id, email, first_name, last_name, is_active, gdpr_consent' },
                { name: 'Senior', fields: 'id, first_name, last_name, birth_date, birth_place, preferences, session_schedule' },
                { name: 'Session', fields: 'id, senior_id, status, audio_url, duration_seconds, summary, started_at, ended_at' },
                { name: 'Transcription', fields: 'id, session_id, speaker, content_encrypted, sequence_order, latency_ms' },
                { name: 'Memory', fields: 'id, senior_id, title, summary_encrypted, period, people, places, themes[]' },
                { name: 'Theme', fields: 'id, name, description, icon' },
                { name: 'CognitiveMetric', fields: 'id, senior_id, session_id, unique_words, type_token_ratio, avg_latency_ms, evasive_responses' },
                { name: 'Alert', fields: 'id, senior_id, type, severity, message, details, is_read' },
                { name: 'Gazette', fields: 'id, senior_id, title, pdf_url, week_start, week_end, email_sent' },
              ].map((model) => (
                <div key={model.name} className="bg-white rounded-xl p-4">
                  <h4 className="font-heading text-sm font-bold text-brown mb-1">{model.name}</h4>
                  <p className="text-xs text-text-muted font-mono leading-relaxed">{model.fields}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Security */}
          <section className="mt-12 mb-8">
            <h2 className="font-heading text-xl font-bold text-text-dark mb-4">Sécurité</h2>
            <div className="bg-white rounded-xl p-5">
              <ul className="space-y-2 text-sm text-text-muted">
                <li className="flex items-center gap-2"><span className="text-green-forest">✓</span> Chiffrement AES-256-GCM sur toutes les transcriptions et résumés</li>
                <li className="flex items-center gap-2"><span className="text-green-forest">✓</span> JWT access token (15 min) + refresh token (7 jours)</li>
                <li className="flex items-center gap-2"><span className="text-green-forest">✓</span> Mots de passe hashés avec bcrypt</li>
                <li className="flex items-center gap-2"><span className="text-green-forest">✓</span> CORS configurable via CORS_ORIGINS</li>
                <li className="flex items-center gap-2"><span className="text-green-forest">✓</span> Conformité RGPD : export complet + suppression cascade</li>
                <li className="flex items-center gap-2"><span className="text-green-forest">✓</span> Hébergement HDS prévu pour la production</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

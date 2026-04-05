'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Cpu, AudioWaveform, Volume2, Code2, ShieldCheck, Server, Smartphone, LayoutDashboard } from 'lucide-react'

const aiStack = [
  {
    icon: Cpu,
    name: 'LLM Anthropic / GPT-4o',
    description:
      'Modèles de langage de pointe pour des conversations empathiques et une analyse sémantique fine.',
    why: 'Double provider pour la résilience : si un service tombe, l\'autre prend le relais automatiquement.',
  },
  {
    icon: AudioWaveform,
    name: 'Whisper STT',
    description:
      'Reconnaissance vocale d\'OpenAI optimisée pour les voix âgées, accents et débits lents.',
    why: 'Meilleure précision du marché sur le français parlé, y compris les voix tremblantes et les accents régionaux.',
  },
  {
    icon: Volume2,
    name: 'ElevenLabs TTS',
    description:
      'Synthèse vocale naturelle et chaleureuse, pour une réponse humaine et rassurante.',
    why: 'Voix les plus naturelles disponibles. Pour un senior, une voix robotique = méfiance. Le naturel est critique.',
  },
  {
    icon: Code2,
    name: 'spaCy NLP',
    description:
      'Analyse linguistique pour l\'extraction d\'entités, de marqueurs cognitifs et de richesse sémantique.',
    why: 'Léger, rapide, modèle français mature. Tourne en local sans appel API, idéal pour l\'analyse en temps réel.',
  },
]

const infraStack = [
  {
    icon: Server,
    name: 'Python / FastAPI',
    why: 'L\'écosystème IA est en Python (Anthropic SDK, OpenAI, spaCy, scikit-learn). FastAPI offre les performances async nécessaires au streaming WebSocket tout en restant dans le même langage que les modèles IA. Pas de surcoût de communication inter-services.',
  },
  {
    icon: Smartphone,
    name: 'React Native / Expo',
    why: 'Un seul code pour Android et iOS. Expo simplifie le déploiement sur tablettes sans passer par les app stores (mode kiosque). Accès natif au micro, haptique et gestion audio via expo-av.',
  },
  {
    icon: LayoutDashboard,
    name: 'React / Vite / TypeScript',
    why: 'Dashboard famille en React pour partager les compétences avec le frontend mobile (même paradigme). Vite pour un dev rapide. TypeScript pour la fiabilité sur une codebase qui grandit.',
  },
]

const security = [
  'Chiffrement AES-256-GCM — nonce unique par entrée',
  'Conformité RGPD native — export et suppression des données',
  'Compatible hébergement HDS (données de santé)',
  'JWT access token 15min + refresh 7 jours + bcrypt',
]

export default function Technology() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="technologie"
      ref={ref}
      className="py-16 sm:py-24 md:py-32 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream to-cream" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-text font-bold text-sm uppercase tracking-widest mb-3">
            Sous le capot
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark">
            Chaque choix technique est justifié
          </h2>
          <p className="text-text-muted mt-4 max-w-2xl mx-auto">
            Pas de stack à la mode pour le plaisir. Chaque brique est là pour une raison précise, dictée par les contraintes du projet.
          </p>
        </motion.div>

        {/* AI Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="font-heading text-lg font-bold text-brown mb-4">Pipeline IA &amp; Voix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brown/10 flex items-center justify-center mb-3">
                  <tech.icon size={20} className="text-brown" />
                </div>
                <h4 className="font-heading text-sm font-bold text-text-dark mb-1">
                  {tech.name}
                </h4>
                <p className="text-text-muted text-xs leading-relaxed mb-3">
                  {tech.description}
                </p>
                <div className="bg-cream rounded-lg px-3 py-2">
                  <p className="text-orange-text text-xs font-semibold leading-relaxed">
                    Pourquoi ? {tech.why}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Infra Stack — Why these choices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <h3 className="font-heading text-lg font-bold text-brown mb-4">Infrastructure &amp; Développement</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {infraStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-soft/15 flex items-center justify-center">
                    <tech.icon size={20} className="text-orange-text" />
                  </div>
                  <h4 className="font-heading text-sm font-bold text-text-dark">
                    {tech.name}
                  </h4>
                </div>
                <p className="text-text-muted text-xs leading-relaxed">
                  {tech.why}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck size={24} className="text-green-forest" />
            <h3 className="font-heading text-lg font-bold text-text-dark">
              Sécurité &amp; conformité
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {security.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-forest/15 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-green-forest"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-text-dark">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

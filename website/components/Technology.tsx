'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Cpu, AudioWaveform, Volume2, Code2, ShieldCheck } from 'lucide-react'

const techStack = [
  {
    icon: Cpu,
    name: 'LLM Claude / GPT-4o',
    description:
      'Modèles de langage de pointe pour des conversations empathiques et une analyse sémantique fine.',
  },
  {
    icon: AudioWaveform,
    name: 'Whisper STT',
    description:
      'Reconnaissance vocale d\'OpenAI optimisée pour les voix âgées, accents et débits lents.',
  },
  {
    icon: Volume2,
    name: 'ElevenLabs TTS',
    description:
      'Synthèse vocale naturelle et chaleureuse, pour une réponse humaine et rassurante.',
  },
  {
    icon: Code2,
    name: 'spaCy NLP',
    description:
      'Pipeline d\'analyse linguistique pour l\'extraction d\'entités, d\'émotions et de marqueurs cognitifs.',
  },
]

const security = [
  'Chiffrement AES-256 bout en bout',
  'Conformité RGPD native',
  'Compatible hébergement HDS',
  'Authentification JWT sécurisée',
]

export default function Technology() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="technologie"
      ref={ref}
      className="py-24 sm:py-32 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream to-cream" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-orange-soft font-bold text-sm uppercase tracking-widest mb-3">
            Sous le capot
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            Une architecture pensée pour la fiabilité
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {techStack.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-brown/10 flex items-center justify-center mb-4">
                <tech.icon size={22} className="text-brown" />
              </div>
              <h3 className="font-heading text-base font-bold text-text-dark mb-2">
                {tech.name}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {tech.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Security section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck size={28} className="text-green-forest" />
            <h3 className="font-heading text-xl font-bold text-text-dark">
              Sécurité &amp; conformité
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {security.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-forest/15 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-green-forest"
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

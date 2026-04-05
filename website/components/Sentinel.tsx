'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Activity, Clock, Bell } from 'lucide-react'


const features = [
  {
    icon: Activity,
    title: 'Richesse sémantique',
    description:
      'Analyse de la diversité lexicale, de la complexité syntaxique et de la cohérence narrative au fil du temps.',
  },
  {
    icon: Clock,
    title: 'Temps de réponse',
    description:
      'Mesure de la latence conversationnelle et des hésitations, indicateurs précoces de déclin.',
  },
  {
    icon: Bell,
    title: 'Alertes intelligentes',
    description:
      'Notifications graduelles aux familles et médecins dès qu\'un seuil critique est détecté.',
  },
]

function VitalityGauge() {
  const score = 87
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-heading text-base sm:text-lg font-bold text-text-dark">
          Score de vitalité
        </h4>
        <span className="px-3 py-1 bg-green-forest/15 text-green-forest text-xs font-bold rounded-full">
          Stable
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] flex-shrink-0">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#FFF8F0"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#7FB069"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-heading font-bold text-text-dark">
              {score}
            </span>
            <span className="text-xs text-text-muted">/100</span>
          </div>
        </div>

        <div className="space-y-3 flex-1 w-full">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Lexique</span>
              <span className="font-bold text-green-forest">92%</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full w-[92%] bg-green-forest rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Cohérence</span>
              <span className="font-bold text-orange-soft">84%</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full w-[84%] bg-orange-soft rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Réactivité</span>
              <span className="font-bold text-brown">88%</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full w-[88%] bg-brown rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-text-muted">
        <div className="w-2 h-2 rounded-full bg-green-forest" />
        Tendance stable sur les 30 derniers jours
      </div>
    </div>
  )
}

export default function Sentinel() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="sentinelle"
      ref={ref}
      className="py-16 sm:py-24 md:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-soft font-bold text-sm uppercase tracking-widest mb-3">
            Détection précoce
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark max-w-4xl mx-auto leading-tight">
            Le Module Sentinelle : détecter avant qu'il ne soit
            trop tard
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          {/* Left: features */}
          <div className="space-y-6 sm:space-y-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                className="flex gap-4 sm:gap-5"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                  <feature.icon size={22} className="text-brown" />
                </div>
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-bold text-text-dark mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Subtle caring-hand image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="relative rounded-2xl overflow-hidden h-[140px] sm:h-[180px] mt-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/caring-hands.jpg"
                alt="Mains se tenant avec tendresse — accompagnement bienveillant des aînés"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-brown-dark/20 rounded-2xl" />
            </motion.div>
          </div>

          {/* Right: dashboard mock */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <VitalityGauge />
          </motion.div>
        </div>

        {/* Bottom accent card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-12 sm:mt-16"
        >
          <div className="bg-gradient-to-r from-brown-dark to-brown rounded-2xl p-6 sm:p-8 md:p-10 text-center">
            <p className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed">
              Jusqu'à{' '}
              <span className="text-orange-soft">6 mois d'avance</span>{' '}
              sur un diagnostic clinique
            </p>
            <p className="text-white/70 mt-3 text-xs sm:text-sm max-w-2xl mx-auto">
              Grâce à l'analyse linguistique continue, Memoria
              repère des marqueurs subtils invisibles à
              l'œil nu.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

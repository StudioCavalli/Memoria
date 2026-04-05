'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Activity, Clock, Bell } from 'lucide-react'

const features = [
  {
    icon: Activity,
    title: 'Richesse s\u00e9mantique',
    description:
      'Analyse de la diversit\u00e9 lexicale, de la complexit\u00e9 syntaxique et de la coh\u00e9rence narrative au fil du temps.',
  },
  {
    icon: Clock,
    title: 'Temps de r\u00e9ponse',
    description:
      'Mesure de la latence conversationnelle et des h\u00e9sitations, indicateurs pr\u00e9coces de d\u00e9clin.',
  },
  {
    icon: Bell,
    title: 'Alertes intelligentes',
    description:
      'Notifications graduelles aux familles et m\u00e9decins d\u00e8s qu\u2019un seuil critique est d\u00e9tect\u00e9.',
  },
]

function VitalityGauge() {
  const score = 87
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-heading text-lg font-bold text-text-dark">
          Score de vitalit&eacute;
        </h4>
        <span className="px-3 py-1 bg-green-forest/15 text-green-forest text-xs font-bold rounded-full">
          Stable
        </span>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative w-[140px] h-[140px] flex-shrink-0">
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
            <span className="text-3xl font-heading font-bold text-text-dark">
              {score}
            </span>
            <span className="text-xs text-text-muted">/100</span>
          </div>
        </div>

        <div className="space-y-3 flex-1">
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
              <span className="text-text-muted">Coh&eacute;rence</span>
              <span className="font-bold text-orange-soft">84%</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full w-[84%] bg-orange-soft rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">R&eacute;activit&eacute;</span>
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
      className="py-24 sm:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-orange-soft font-bold text-sm uppercase tracking-widest mb-3">
            D&eacute;tection pr&eacute;coce
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark max-w-4xl mx-auto leading-tight">
            Le Module Sentinelle : d&eacute;tecter avant qu&rsquo;il ne soit
            trop tard
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: features */}
          <div className="space-y-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                className="flex gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                  <feature.icon size={22} className="text-brown" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-dark mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
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
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-brown-dark to-brown rounded-2xl p-8 sm:p-10 text-center">
            <p className="font-heading text-xl sm:text-2xl font-bold text-white leading-relaxed">
              Jusqu&rsquo;&agrave;{' '}
              <span className="text-orange-soft">6 mois d&rsquo;avance</span>{' '}
              sur un diagnostic clinique
            </p>
            <p className="text-white/70 mt-3 text-sm max-w-2xl mx-auto">
              Gr&acirc;ce &agrave; l&rsquo;analyse linguistique continue, Memoria
              rep&egrave;re des marqueurs subtils invisibles &agrave;
              l&rsquo;\u0153il nu.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

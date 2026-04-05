'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Mic, BookOpen, Shield } from 'lucide-react'

const features = [
  {
    icon: Mic,
    title: 'Un compagnon vocal bienveillant',
    description:
      'Memoria engage la conversation naturellement, comme un ami attentif. Le senior parle, l\u2019IA \u00e9coute avec empathie et relance avec douceur.',
    color: 'bg-orange-soft/15 text-orange-soft',
  },
  {
    icon: BookOpen,
    title: 'Un journal de vie automatique',
    description:
      'Chaque souvenir est transcrit, dat\u00e9, class\u00e9 et enrichi. Les familles re\u00e7oivent une \u00ab\u00a0Gazette\u00a0\u00bb mensuelle illustr\u00e9e, un v\u00e9ritable tr\u00e9sor familial.',
    color: 'bg-green-forest/15 text-green-forest',
  },
  {
    icon: Shield,
    title: 'Une sentinelle cognitive',
    description:
      'Gr\u00e2ce \u00e0 l\u2019analyse du langage en temps r\u00e9el, Memoria d\u00e9tecte les premiers signes de d\u00e9clin cognitif \u2014 jusqu\u2019\u00e0 6 mois avant un diagnostic clinique.',
    color: 'bg-rose-dusty/20 text-rose-dusty',
  },
]

export default function Solution() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="solution"
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
            Notre r&eacute;ponse
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark max-w-4xl mx-auto leading-tight">
            Memoria, le biographe IA qui prend soin de nos a&icirc;n&eacute;s
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="bg-cream rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div
                className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <feature.icon size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-text-dark mb-3">
                {feature.title}
              </h3>
              <p className="text-text-muted leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="text-center"
        >
          <div className="inline-block bg-gradient-to-r from-brown/10 via-orange-soft/15 to-brown/10 rounded-2xl px-8 py-5">
            <p className="font-heading text-lg sm:text-xl font-bold text-brown">
              2 missions en 1 :{' '}
              <span className="text-orange-soft">
                Pr&eacute;server la m&eacute;moire
              </span>{' '}
              ET{' '}
              <span className="text-green-forest">
                pr&eacute;venir les troubles cognitifs
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

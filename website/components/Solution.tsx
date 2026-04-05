'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Mic, BookOpen, Shield } from 'lucide-react'
import Image from 'next/image'

const features = [
  {
    icon: Mic,
    title: 'Un compagnon vocal bienveillant',
    description:
      'Memoria engage la conversation naturellement, comme un ami attentif. Le senior parle, l\'IA écoute avec empathie et relance avec douceur.',
    color: 'bg-orange-soft/15 text-orange-soft',
  },
  {
    icon: BookOpen,
    title: 'Un journal de vie automatique',
    description:
      'Chaque souvenir est transcrit, daté, classé et enrichi. Les familles reçoivent une « Gazette » mensuelle illustrée, un véritable trésor familial.',
    color: 'bg-green-forest/15 text-green-forest',
  },
  {
    icon: Shield,
    title: 'Une sentinelle cognitive',
    description:
      'Grâce à l\'analyse du langage en temps réel, Memoria détecte les premiers signes de déclin cognitif — jusqu\'à 6 mois avant un diagnostic clinique.',
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
            Notre réponse
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark max-w-4xl mx-auto leading-tight">
            Memoria, le biographe IA qui prend soin de nos aînés
          </h2>
        </motion.div>

        {/* Feature cards + family image */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="bg-cream rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div
                className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform`}
              >
                <feature.icon size={28} />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-text-dark mb-3">
                {feature.title}
              </h3>
              <p className="text-text-muted leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Family image banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative rounded-2xl overflow-hidden h-[200px] sm:h-[260px] mb-12 sm:mb-16"
        >
          <Image
            src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80"
            alt="Famille réunie — les souvenirs qui nous lient"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brown-dark/50 via-brown-dark/20 to-transparent" />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-8">
            <p className="font-heading text-base sm:text-lg font-bold text-white drop-shadow-md">
              Les souvenirs qui nous lient
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="text-center"
        >
          <div className="inline-block bg-gradient-to-r from-brown/10 via-orange-soft/15 to-brown/10 rounded-2xl px-6 sm:px-8 py-4 sm:py-5">
            <p className="font-heading text-base sm:text-lg md:text-xl font-bold text-brown">
              2 missions en 1 :{' '}
              <span className="text-orange-soft">
                Préserver la mémoire
              </span>{' '}
              ET{' '}
              <span className="text-green-forest">
                prévenir les troubles cognitifs
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

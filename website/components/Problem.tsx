'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

const stats = [
  {
    number: '2,2M',
    label: 'de seniors isolés',
    description:
      'En France, 2,2 millions de personnes âgées souffrent d\'isolement social sévère.',
  },
  {
    number: '1,2M',
    label: 'de troubles cognitifs',
    description:
      '1,2 million de Français sont touchés par la maladie d\'Alzheimer ou un trouble apparenté.',
  },
  {
    number: '300K',
    label: 'nouveaux cas par an',
    description:
      'Chaque année, 300 000 nouveaux cas de troubles neurodégénératifs sont diagnostiqués.',
  },
]

export default function Problem() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="probleme"
      ref={ref}
      className="py-16 sm:py-24 md:py-32 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-soft/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-orange-soft font-bold text-sm uppercase tracking-widest mb-3">
            Un enjeu de société
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            Le constat
          </h2>
        </motion.div>

        {/* Stats + Image layout */}
        <div className="grid lg:grid-cols-5 gap-8 mb-16 items-start">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.number}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-brown mb-3">
                  {stat.number}
                </div>
                <div className="text-base sm:text-lg font-bold text-text-dark mb-2">
                  {stat.label}
                </div>
                <p className="text-text-muted text-sm leading-relaxed">
                  {stat.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Unsplash image — elderly hands */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden lg:block lg:col-span-2 relative h-full min-h-[320px] rounded-2xl overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=1200&q=90&fit=crop"
              alt="Personne âgée souriante et heureuse"
              fill
              className="object-cover rounded-2xl"
              sizes="(max-width: 1024px) 0vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown-dark/30 to-transparent rounded-2xl" />
          </motion.div>
        </div>

        <motion.blockquote
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative">
            <span className="absolute -top-8 -left-4 text-6xl sm:text-8xl text-orange-soft/20 font-heading">
              &ldquo;
            </span>
            <p className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl text-text-dark italic leading-relaxed px-4 sm:px-8">
              Quand ils disparaissent, c'est une bibliothèque qui
              brûle.
            </p>
            <span className="absolute -bottom-12 -right-4 text-6xl sm:text-8xl text-orange-soft/20 font-heading">
              &rdquo;
            </span>
          </div>
          <footer className="mt-8 text-text-muted text-sm font-semibold">
            — Proverbe africain, popularisé par Amadou Hampâté Bâ
          </footer>
        </motion.blockquote>
      </div>
    </section>
  )
}

'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const stats = [
  {
    number: '2,2M',
    label: 'de seniors isol\u00e9s',
    description:
      'En France, 2,2 millions de personnes \u00e2g\u00e9es souffrent d\u2019isolement social s\u00e9v\u00e8re.',
  },
  {
    number: '1,2M',
    label: 'de troubles cognitifs',
    description:
      '1,2 million de Fran\u00e7ais sont touch\u00e9s par la maladie d\u2019Alzheimer ou un trouble apparent\u00e9.',
  },
  {
    number: '300K',
    label: 'nouveaux cas par an',
    description:
      'Chaque ann\u00e9e, 300 000 nouveaux cas de troubles neurod\u00e9g\u00e9n\u00e9ratifs sont diagnostiqu\u00e9s.',
  },
]

export default function Problem() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="probleme"
      ref={ref}
      className="py-24 sm:py-32 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-soft/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-orange-soft font-bold text-sm uppercase tracking-widest mb-3">
            Un enjeu de soci&eacute;t&eacute;
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            Le constat
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.number}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-5xl sm:text-6xl font-heading font-bold text-brown mb-3">
                {stat.number}
              </div>
              <div className="text-lg font-bold text-text-dark mb-2">
                {stat.label}
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.blockquote
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative">
            <span className="absolute -top-8 -left-4 text-8xl text-orange-soft/20 font-heading">
              &ldquo;
            </span>
            <p className="font-heading text-xl sm:text-2xl lg:text-3xl text-text-dark italic leading-relaxed px-8">
              Quand ils disparaissent, c&rsquo;est une biblioth&egrave;que qui
              br&ucirc;le.
            </p>
            <span className="absolute -bottom-12 -right-4 text-8xl text-orange-soft/20 font-heading">
              &rdquo;
            </span>
          </div>
          <footer className="mt-8 text-text-muted text-sm font-semibold">
            &mdash; Proverbe africain, popularis&eacute; par Amadou Hamp&acirc;t&eacute; B&acirc;
          </footer>
        </motion.blockquote>
      </div>
    </section>
  )
}

'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Mail } from 'lucide-react'

export default function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="contact"
      ref={ref}
      className="py-24 sm:py-32 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brown-dark via-brown to-brown-dark" />
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-orange-soft/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-dusty/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Donnons une voix à ceux qui ont tant à raconter.{' '}
            <span className="text-orange-soft">
              Avant qu'il ne soit trop tard.
            </span>
          </h2>

          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
            Rejoignez les familles et établissements qui font confiance
            à Memoria pour préserver la mémoire et protéger
            la santé cognitive de leurs proches.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="mailto:christopher.cavalli@hotmail.com"
              className="px-8 py-4 bg-orange-soft text-white font-bold rounded-full hover:bg-orange-soft/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
            >
              Demander une démo
            </a>
            <a
              href="mailto:christopher.cavalli@hotmail.com"
              className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Mail size={18} />
              christopher.cavalli@hotmail.com
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

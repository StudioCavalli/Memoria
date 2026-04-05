'use client'

import { motion } from 'framer-motion'
import Scene3D from './Scene3D'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.15, duration: 0.7, ease: 'easeOut' },
  }),
}

const stats = [
  { value: '2,2M', label: 'seniors isolés en France' },
  { value: '1,2M', label: 'personnes avec troubles cognitifs' },
  { value: '<1,5s', label: 'de latence IA' },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen lg:min-h-[110vh] flex items-center pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden">
      {/* Subtle background decorations */}
      <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-orange-soft/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-rose-dusty/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text */}
          <div className="order-2 lg:order-1 bg-cream/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none rounded-2xl sm:rounded-none p-5 sm:p-0">
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-orange-text font-bold text-xs sm:text-sm uppercase tracking-widest mb-3 sm:mb-4"
            >
              L'IA biographique pour nos aînés
            </motion.p>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-text-dark mb-4 sm:mb-6"
            >
              Chaque souvenir{' '}
              <br className="hidden sm:block" />
              mérite d'être{' '}
              <span className="text-brown">préservé</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-base sm:text-lg md:text-xl text-text-muted leading-relaxed mb-6 sm:mb-8 max-w-xl"
            >
              Memoria, l'IA biographique qui recueille les souvenirs de
              nos aînés et veille sur leur santé cognitive.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-12"
            >
              <a
                href="#solution"
                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-brown text-white font-bold rounded-full hover:bg-brown-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
              >
                Découvrir Memoria
              </a>
              <a
                href="#fonctionnement"
                className="px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-brown text-brown font-bold rounded-full hover:bg-brown hover:text-white transition-all text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
              >
                Voir la démo
              </a>
              <a
                href="/MEMORIA_Pitch.pdf"
                download
                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-orange-soft text-brown-dark font-bold rounded-full hover:bg-orange-soft/80 transition-all flex items-center justify-center gap-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Pitch Deck PDF
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-4 sm:gap-8"
            >
              {stats.map((stat) => (
                <div key={stat.value} className="text-center sm:text-left">
                  <div className="text-xl sm:text-2xl font-bold text-brown font-heading">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-muted mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: 3D Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
            className="order-1 lg:order-2 h-[220px] sm:h-[300px] md:h-[400px] lg:h-[550px]"
          >
            <Scene3D />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

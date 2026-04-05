'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useI18n } from '@/lib/i18n'


export default function Problem() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useI18n()

  const stats = [
    {
      number: '2M',
      labelKey: 'problem.stat1.label',
      descKey: 'problem.stat1.desc',
      sourceKey: 'problem.stat1.source',
    },
    {
      number: '1,4M',
      labelKey: 'problem.stat2.label',
      descKey: 'problem.stat2.desc',
      sourceKey: 'problem.stat2.source',
    },
    {
      number: '225K',
      labelKey: 'problem.stat3.label',
      descKey: 'problem.stat3.desc',
      sourceKey: 'problem.stat3.source',
    },
  ]

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
          <p className="text-orange-text font-bold text-sm uppercase tracking-widest mb-3">
            {t('problem.tag')}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            {t('problem.title')}
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
                  {t(stat.labelKey)}
                </div>
                <p className="text-text-muted text-sm leading-relaxed">
                  {t(stat.descKey)}
                </p>
                <p className="text-text-muted/60 text-[10px] mt-2 italic">
                  {t('problem.source.label')} {t(stat.sourceKey)}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/senior-happy.jpg"
              alt="Personne âgée souriante et heureuse"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
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
              {t('problem.quote')}
            </p>
            <span className="absolute -bottom-12 -right-4 text-6xl sm:text-8xl text-orange-soft/20 font-heading">
              &rdquo;
            </span>
          </div>
          <footer className="mt-8 text-text-muted text-sm font-semibold">
            {t('problem.quote.author')}
          </footer>
        </motion.blockquote>
      </div>
    </section>
  )
}

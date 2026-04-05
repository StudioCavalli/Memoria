'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Phone, Brain, Heart } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useI18n()

  const steps = [
    {
      number: '1',
      icon: Phone,
      titleKey: 'how.step1.title',
      description:
        'Un simple bouton pour démarrer la conversation. Pas de clavier, pas d\'écran complexe. Juste la voix, naturellement.',
      details: ['Un seul bouton', 'Conversation vocale', 'Interface simplifiée'],
    },
    {
      number: '2',
      icon: Brain,
      titleKey: 'how.step2.title',
      description:
        'Transcription en temps réel, classification sémantique, extraction d\'émotions et d\'événements. Chaque mot compte.',
      details: ['Transcription STT', 'Classification IA', 'Analyse sémantique'],
    },
    {
      number: '3',
      icon: Heart,
      titleKey: 'how.step3.title',
      description:
        'La Gazette mensuelle, les alertes cognitives, un tableau de bord familial. Les souvenirs prennent vie et la santé est surveillée.',
      details: ['Gazette mensuelle', 'Alertes santé', 'Dashboard famille'],
    },
  ]

  return (
    <section
      id="fonctionnement"
      ref={ref}
      className="py-24 sm:py-32 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream to-cream" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="text-orange-text font-bold text-sm uppercase tracking-widest mb-3">
            {t('how.tag')}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            {t('how.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop) — centered on the circles */}
          <div className="hidden md:block absolute top-[44px] left-[16.67%] right-[16.67%] flex items-center" style={{ height: 0 }}>
            <div className="w-full h-[3px] rounded-full bg-brown/20" />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.2 }}
              className="relative text-center"
            >
              {/* Number circle */}
              <div className="relative z-10 mx-auto mb-8">
                <div className="w-[88px] h-[88px] rounded-full bg-brown text-white flex items-center justify-center mx-auto shadow-lg">
                  <div>
                    <div className="text-2xl font-heading font-bold">
                      {step.number}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 w-[88px] h-[88px] mx-auto rounded-full bg-brown/20 animate-ping" style={{ animationDuration: '3s' }} />
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center mx-auto mb-4">
                  <step.icon size={24} className="text-brown" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-dark mb-3">
                  {t(step.titleKey)}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed mb-6">
                  {step.description}
                </p>
                <div className="space-y-2">
                  {step.details.map((detail) => (
                    <div
                      key={detail}
                      className="inline-block mx-1 px-3 py-1 bg-cream rounded-full text-xs font-semibold text-brown"
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

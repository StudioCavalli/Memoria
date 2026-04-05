'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useI18n()

  const plans = [
    {
      nameKey: 'pricing.family',
      price: '29,90',
      periodKey: 'pricing.month',
      descKey: 'pricing.family.desc',
      featureKeys: [
        'pricing.family.f1',
        'pricing.family.f2',
        'pricing.family.f3',
        'pricing.family.f4',
        'pricing.family.f5',
        'pricing.family.f6',
        'pricing.family.f7',
        'pricing.family.f8',
      ],
      highlighted: true,
      ctaKey: 'pricing.cta.family',
    },
    {
      nameKey: 'pricing.ehpad',
      price: '19,90',
      periodKey: 'pricing.per.resident',
      descKey: 'pricing.ehpad.desc',
      featureKeys: [
        'pricing.ehpad.f1',
        'pricing.ehpad.f2',
        'pricing.ehpad.f3',
        'pricing.ehpad.f4',
        'pricing.ehpad.f5',
        'pricing.ehpad.f6',
        'pricing.ehpad.f7',
        'pricing.ehpad.f8',
      ],
      highlighted: false,
      ctaKey: 'pricing.cta.ehpad',
    },
  ]

  return (
    <section
      id="tarifs"
      ref={ref}
      className="py-24 sm:py-32 bg-white"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-orange-text font-bold text-sm uppercase tracking-widest mb-3">
            {t('pricing.tag')}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            {t('pricing.title')}
          </h2>
          <p className="text-text-muted mt-4 max-w-xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.nameKey}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.highlighted
                  ? 'bg-cream border-2 border-brown shadow-lg scale-[1.02]'
                  : 'bg-cream border border-brown/10 shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brown text-white text-xs font-bold rounded-full">
                  {t('pricing.popular')}
                </div>
              )}

              <h3 className="font-heading text-2xl font-bold text-text-dark mb-2">
                {t(plan.nameKey)}
              </h3>
              <p className="text-text-muted text-sm mb-6">
                {t(plan.descKey)}
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-heading font-bold text-brown">
                  {plan.price}€
                </span>
                <span className="text-text-muted text-sm">{t(plan.periodKey)}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.featureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-forest/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-green-forest" />
                    </div>
                    <span className="text-sm text-text-dark">{t(key)}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`block w-full text-center py-3.5 rounded-full font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 ${
                  plan.highlighted
                    ? 'bg-brown text-white hover:bg-brown-dark shadow-md hover:shadow-lg'
                    : 'border-2 border-brown text-brown hover:bg-brown hover:text-white'
                }`}
              >
                {t(plan.ctaKey)}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

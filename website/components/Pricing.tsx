'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Famille',
    price: '29,90',
    period: '/mois',
    description: 'Pour les familles souhaitant pr\u00e9server les souvenirs de leurs proches.',
    features: [
      'Conversations vocales illimit\u00e9es',
      'Journal de vie automatique',
      'Gazette mensuelle illustr\u00e9e',
      'Module Sentinelle inclus',
      'Tableau de bord familial',
      'Alertes cognitives en temps r\u00e9el',
      'Export PDF du journal de vie',
      'Support prioritaire',
    ],
    highlighted: true,
    cta: 'Commencer l\u2019essai gratuit',
  },
  {
    name: 'EHPAD',
    price: '19,90',
    period: '/r\u00e9sident/mois',
    description: 'Tarif \u00e9tablissement, \u00e0 partir de 20 r\u00e9sidents.',
    features: [
      'Tout le plan Famille',
      'Dashboard \u00e9tablissement',
      'Int\u00e9gration DUI',
      'Rapports m\u00e9dicaux automatis\u00e9s',
      'API & interop\u00e9rabilit\u00e9',
      'Formation \u00e9quipes incluse',
      'Account manager d\u00e9di\u00e9',
      'SLA 99,9%',
    ],
    highlighted: false,
    cta: 'Contacter l\u2019\u00e9quipe commerciale',
  },
]

export default function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

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
          <p className="text-orange-soft font-bold text-sm uppercase tracking-widest mb-3">
            Tarification
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            Un abonnement accessible
          </h2>
          <p className="text-text-muted mt-4 max-w-xl mx-auto">
            Pas de frais cach&eacute;s. 30 jours d&rsquo;essai gratuit. Annulation &agrave; tout moment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
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
                  Le plus populaire
                </div>
              )}

              <h3 className="font-heading text-2xl font-bold text-text-dark mb-2">
                {plan.name}
              </h3>
              <p className="text-text-muted text-sm mb-6">
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-heading font-bold text-brown">
                  {plan.price}&euro;
                </span>
                <span className="text-text-muted text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-forest/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} className="text-green-forest" />
                    </div>
                    <span className="text-sm text-text-dark">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`block w-full text-center py-3.5 rounded-full font-bold text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-brown text-white hover:bg-brown-dark shadow-md hover:shadow-lg'
                    : 'border-2 border-brown text-brown hover:bg-brown hover:text-white'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

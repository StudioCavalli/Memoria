'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Rocket, Users, Globe, FlaskConical, BookHeart, Radio, Code2, ArrowRight } from 'lucide-react'

const phases = [
  {
    period: 'Juin — Déc. 2026',
    label: 'Court terme',
    color: 'bg-orange-soft',
    textColor: 'text-orange-text',
    borderColor: 'border-orange-soft',
    icon: FlaskConical,
    title: 'Valider sur le terrain niçois',
    items: [
      'Pilote avec 20 seniors (10 à domicile, 10 en établissement)',
      'Partenariat clinique CHU de Nice (validation MMS / test de l\'horloge)',
      'Recrutement développeur full-stack + chargé de déploiement',
      'Itérations produit : accents régionaux, voix très âgées, photos dans la Gazette',
    ],
  },
  {
    period: '2027',
    label: 'Moyen terme',
    color: 'bg-brown',
    textColor: 'text-brown',
    borderColor: 'border-brown',
    icon: Users,
    title: 'Passer à l\'échelle en région Sud',
    items: [
      '500 abonnés actifs (B2C + B2B) — Alpes-Maritimes, Var, Bouches-du-Rhône',
      'Partenariats CCAS, CARSAT Sud-Est, AG2R pour la prise en charge financière',
      'Équipe de 6-8 personnes basée à Nice',
      'Lancement de Memoria Pro pour les professionnels de santé (rapports cognitifs, DMP)',
      'Publication scientifique avec notre partenaire clinique',
    ],
  },
  {
    period: '2028 — 2029',
    label: 'Long terme',
    color: 'bg-green-forest',
    textColor: 'text-green-forest',
    borderColor: 'border-green-forest',
    icon: Globe,
    title: 'Devenir la référence française',
    items: [
      'Expansion nationale — 5 000 seniors équipés',
      'Internationalisation Italie & Espagne',
      'Memoria Héritage — livre biographique imprimé, illustré par IA',
      'Memoria Lien — podcast familial privé avec la voix du senior',
      'API Sentinelle — brique technologique pour éditeurs santé',
      'Équipe de 15-20 personnes avec pôle R&D IA',
    ],
  },
]

const futureProducts = [
  {
    icon: BookHeart,
    name: 'Memoria Héritage',
    description: 'Un livre biographique imprimé compilant des années de souvenirs, illustré par IA. Un objet physique transmis de génération en génération.',
    color: 'bg-orange-soft/15 text-orange-text',
  },
  {
    icon: Radio,
    name: 'Memoria Lien',
    description: 'Les petits-enfants écoutent les récits de leurs grands-parents sous forme de podcast privé, avec la voix originale du senior.',
    color: 'bg-green-forest/15 text-green-forest',
  },
  {
    icon: Code2,
    name: 'API Sentinelle',
    description: 'Le module d\'analyse cognitive ouvert en API pour les éditeurs de logiciels de santé, les plateformes de téléassistance et les assureurs.',
    color: 'bg-brown/10 text-brown',
  },
]

export default function Roadmap() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="roadmap" ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-white to-cream" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-orange-text font-bold text-sm uppercase tracking-widest mb-3">
            Vision & Feuille de route
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark">
            Ce qui arrive
          </h2>
          <p className="text-text-muted mt-4 max-w-2xl mx-auto text-lg">
            Memoria existe déjà. Voici comment nous allons le déployer et le faire grandir.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line (desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[3px] bg-brown/15 rounded-full -translate-x-1/2" />

          <div className="space-y-12 lg:space-y-16">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.period}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.2 }}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-12 items-start ${
                  i % 2 === 0 ? '' : 'lg:direction-rtl'
                }`}
              >
                {/* Timeline dot (desktop) */}
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-0 z-10">
                  <div className={`w-12 h-12 rounded-full ${phase.color} flex items-center justify-center shadow-lg`}>
                    <phase.icon size={20} className="text-white" />
                  </div>
                </div>

                {/* Content card */}
                <div className={`${i % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:col-start-2 lg:pl-16'}`}>
                  <div className={`bg-white rounded-2xl p-6 sm:p-8 shadow-sm border-l-4 ${phase.borderColor}`}>
                    {/* Mobile icon */}
                    <div className={`lg:hidden w-10 h-10 rounded-full ${phase.color} flex items-center justify-center mb-4`}>
                      <phase.icon size={18} className="text-white" />
                    </div>

                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${phase.color}/15 ${phase.textColor} mb-3`}>
                      {phase.label}
                    </div>
                    <p className="text-text-muted text-sm font-semibold mb-1">{phase.period}</p>
                    <h3 className="font-heading text-xl font-bold text-text-dark mb-4">{phase.title}</h3>

                    <ul className={`space-y-2 ${i % 2 === 0 ? 'lg:text-left' : ''}`}>
                      {phase.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-text-muted">
                          <ArrowRight size={14} className={`${phase.textColor} mt-0.5 flex-shrink-0`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Empty space for alternating layout */}
                {i % 2 === 0 ? <div className="hidden lg:block" /> : null}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Future products */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-20"
        >
          <h3 className="font-heading text-2xl font-bold text-text-dark text-center mb-10">
            Les produits à venir
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {futureProducts.map((product) => (
              <div
                key={product.name}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${product.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <product.icon size={22} />
                </div>
                <h4 className="font-heading text-lg font-bold text-text-dark mb-2">{product.name}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-brown/10 via-orange-soft/15 to-brown/10 rounded-2xl px-8 py-5">
            <p className="font-heading text-lg font-bold text-brown">
              Le produit <span className="text-orange-text">existe déjà</span> — 109 fichiers, 43 issues livrées, démo fonctionnelle.
            </p>
            <p className="text-text-muted text-sm mt-2">
              Nous cherchons des partenaires pour le déployer à grande échelle sur la Côte d'Azur.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import Logo from './Logo'
import { useI18n } from '@/lib/i18n'

const footerLinks = [
  { href: '#probleme', labelKey: 'problem.title' },
  { href: '#solution', labelKey: 'nav.solution' },
  { href: '#fonctionnement', labelKey: 'how.tag' },
  { href: '#sentinelle', labelKey: 'nav.sentinel' },
  { href: '#technologie', labelKey: 'footer.technology' },
  { href: '#tarifs', labelKey: 'nav.pricing' },
  { href: '#roadmap', labelKey: 'nav.roadmap' },
  { href: '/docs', label: 'API Docs' },
]

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer role="contentinfo" aria-label="Pied de page" className="bg-cream border-t border-brown/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="#" aria-label="Memoria — Accueil" className="inline-block focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-lg">
              <Logo size="md" />
            </a>
            <p className="text-text-muted text-sm mt-3 max-w-xs leading-relaxed">
              {t('footer.desc')}
            </p>
            <a
              href="/MEMORIA_Pitch.pdf"
              download
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-soft/20 text-brown-dark font-bold text-sm rounded-full hover:bg-orange-soft/40 transition-all focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              {t('footer.download')}
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-sm font-bold text-text-dark mb-4">
              {t('footer.nav')}
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-text-muted hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md"
                  >
                    {'labelKey' in link && link.labelKey ? t(link.labelKey) : link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-text-muted hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md"
                >
                  {t('footer.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-sm font-bold text-text-dark mb-4">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <a
                  href="mailto:christopher.cavalli@hotmail.com"
                  className="hover:text-brown transition-colors break-all focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md"
                >
                  christopher.cavalli@hotmail.com
                </a>
              </li>
              <li>
                <a href="tel:+33610449818" className="hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md">
                  +33 6 10 44 98 18
                </a>
              </li>
              <li>45 Boulevard de la Croisette</li>
              <li>06400 Cannes, France</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading text-sm font-bold text-text-dark mb-4">
              {t('footer.follow')}
            </h4>
            <div className="flex gap-3">
              {['LinkedIn', 'Twitter', 'Instagram'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center text-brown hover:bg-brown hover:text-white transition-all text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
                  aria-label={`Suivez Memoria sur ${social}`}
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal info */}
        <div className="mt-10 pt-6 border-t border-brown/10">
          <div className="bg-white/60 rounded-xl px-4 sm:px-6 py-4 text-xs text-text-muted leading-relaxed">
            <p className="font-bold text-text-dark mb-1">{t('footer.legal.title')}</p>
            <p>
              Foxcase — Entrepreneur individuel — Christopher Cavalli<br />
              SIREN 834 802 407 — SIRET 834 802 407 00033<br />
              45 Boulevard de la Croisette, 06400 Cannes, France<br />
              Activité : Programmation informatique (NAF 6201Z)
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted text-center sm:text-left">
            © 2026 Memoria — Foxcase / Christopher Cavalli — Cannes, Côte d'Azur
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-text-muted">
            <Link href="/mentions-legales" className="hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md">
              {t('footer.legal.mentions')}
            </Link>
            <Link href="/politique-de-confidentialite" className="hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md">
              {t('footer.legal.privacy')}
            </Link>
            <Link href="/rgpd" className="hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md">
              {t('footer.legal.gdpr')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

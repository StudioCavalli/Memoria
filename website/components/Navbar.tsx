'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

const navLinks = [
  { href: '#probleme', label: 'Le Problème' },
  { href: '#solution', label: 'La Solution' },
  { href: '#fonctionnement', label: 'Comment ça marche' },
  { href: '#sentinelle', label: 'Sentinelle' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '/docs', label: 'API Docs' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      aria-label="Navigation principale"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-cream/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brown focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
      >
        Aller au contenu principal
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <a href="#" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-lg" aria-label="Memoria — Accueil">
            <Logo size="sm" />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-text-muted hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              className="ml-2 px-5 py-2.5 bg-brown text-white text-sm font-bold rounded-full hover:bg-brown-dark transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
            >
              Demander une démo
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-brown-dark focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu de navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cream/98 backdrop-blur-md border-t border-brown/10"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-semibold text-text-dark hover:text-brown transition-colors focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2 rounded-md"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-5 py-3 bg-brown text-white font-bold rounded-full focus:outline-none focus:ring-2 focus:ring-orange-soft focus:ring-offset-2"
              >
                Demander une démo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

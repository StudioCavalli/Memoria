'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

interface Props {
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'Accueil', icon: '⌂' },
  { href: '/dashboard/memories', label: 'Souvenirs', icon: '♡' },
  { href: '/dashboard/alerts', label: 'Alertes', icon: '⚠' },
  { href: '/dashboard/gazettes', label: 'Gazettes', icon: '✉' },
  { href: '/dashboard/metrics', label: 'Suivi cognitif', icon: '↗' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: '⚙' },
]

export default function DashboardLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('memoria_token')
    localStorage.removeItem('memoria_refresh')
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-cream font-body text-text-dark">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-100 flex h-14 items-center gap-3 border-b border-beige bg-white px-4 md:hidden">
        <button
          className="border-none bg-transparent p-1 text-2xl text-brown-light cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <Logo size="sm" />
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[199] bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-[200] flex w-[260px] min-w-[260px] flex-col
          overflow-y-auto border-r border-beige bg-cream-dark p-6 transition-transform duration-300
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="mb-8 flex flex-col items-center gap-1">
          <Logo size="md" />
          <p className="mt-1 text-[13px] text-text-muted">Préserver les souvenirs</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-[10px] px-4 py-3 text-[15px] font-semibold no-underline transition-colors duration-200 ${
                  isActive
                    ? 'bg-orange-soft/20 text-brown-dark'
                    : 'text-text-dark hover:bg-orange-soft/10'
                }`}
              >
                <span className="w-6 text-center text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          className="mt-4 rounded-lg border border-beige bg-transparent px-4 py-2.5 font-body text-sm font-semibold text-text-muted transition-colors duration-200 cursor-pointer hover:bg-beige/50"
          onClick={handleLogout}
        >
          Déconnexion
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 w-full max-w-[1200px] p-8 pt-[72px] px-4 md:pt-8 md:px-10">
        {children}
      </main>
    </div>
  )
}

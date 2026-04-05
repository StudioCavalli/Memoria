'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/dashboard-api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authService.login(email, password) as { data: Record<string, string> }
      localStorage.setItem('memoria_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('memoria_refresh', data.refresh_token)
      }
      if (data.senior_id) {
        localStorage.setItem('memoria_senior_id', data.senior_id)
      }
      router.push('/dashboard')
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream font-body p-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-10 shadow-[0_4px_24px_rgba(139,111,71,0.10)]">
        <h1 className="mb-1 text-center font-heading text-4xl font-bold text-brown-light">
          Memoria
        </h1>
        <p className="mb-7 text-center text-[15px] text-text-muted">
          Tableau de bord familial
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-error-bg px-3.5 py-2.5 text-sm text-error-text">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-3 font-body text-[15px] outline-none transition-colors duration-200 focus:border-orange-soft"
              placeholder="vous@exemple.fr"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-3 font-body text-[15px] outline-none transition-colors duration-200 focus:border-orange-soft"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-[10px] border-none bg-brown-light px-4 py-3.5 font-body text-base font-bold text-white transition-colors duration-200 cursor-pointer hover:bg-brown-dark disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-muted">
          Pas encore de compte ?{' '}
          <a href="#" className="font-bold text-brown-light underline">
            Contactez l{"'"}équipe Memoria
          </a>
        </p>
      </div>
    </div>
  )
}

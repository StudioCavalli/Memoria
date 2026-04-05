'use client'

import { useEffect, useState } from 'react'
import { gazettesService } from '@/lib/dashboard-api'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Gazette {
  id: string
  title: string
  date: string
  description?: string
}

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default'

export default function GazettesPage() {
  const [gazettes, setGazettes] = useState<Gazette[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await gazettesService.list(SENIOR_ID())
        const d = data as any
        setGazettes(d.items || d || [])
      } catch {
        setGazettes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDownload = async (gazette: Gazette) => {
    try {
      const { data } = await gazettesService.download(SENIOR_ID(), gazette.id)
      const url = window.URL.createObjectURL(data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${gazette.title || 'gazette'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Impossible de télécharger la gazette.')
    }
  }

  return (
    <div>
      <h2 className="mb-1 font-heading text-[28px] text-text-dark">Gazettes</h2>
      <p className="mb-6 text-[15px] text-text-muted">
        Les gazettes résument les souvenirs et moments clés de votre proche.
      </p>

      {loading ? (
        <p className="p-5 text-text-muted">Chargement...</p>
      ) : gazettes.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-[15px] text-text-muted shadow-sm">
          <p>Aucune gazette disponible pour le moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {gazettes.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-[18px] rounded-2xl bg-white px-[22px] py-[18px] shadow-sm">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-cream">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="2" width="16" height="20" rx="2" stroke="#8B6F47" strokeWidth="1.5" />
                  <line x1="8" y1="7" x2="16" y2="7" stroke="#E8A87C" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="8" y1="11" x2="16" y2="11" stroke="#E8A87C" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="8" y1="15" x2="13" y2="15" stroke="#E8A87C" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-[180px] flex-1">
                <h3 className="mb-0.5 text-base font-bold text-text-dark">{g.title}</h3>
                <p className="text-[13px] font-semibold text-text-light">{g.date}</p>
                {g.description && (
                  <p className="mt-1 text-sm leading-snug text-text-dark/80">{g.description}</p>
                )}
              </div>
              <button
                className="whitespace-nowrap rounded-[10px] border-none bg-brown-light px-5 py-2.5 font-body text-sm font-bold text-white cursor-pointer transition-colors duration-200 hover:bg-brown-dark"
                onClick={() => handleDownload(g)}
              >
                Télécharger PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

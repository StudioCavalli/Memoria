'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { resolveSeniorId, memoriesService } from '@/lib/dashboard-api'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Theme {
  id: string
  name: string
}

interface Memory {
  id: string
  title: string
  summary: string
  period: string
  themes: string[]
  theme_names?: string[]
  session_id?: string | null
  created_at?: string
}

const PER_PAGE = 12

const THEME_COLORS: Record<string, string> = {
  Enfance: '#E8A87C',
  Famille: '#D4A5A5',
  Travail: '#7FB069',
  Voyages: '#6BAED6',
  Loisirs: '#E6B333',
  Amitié: '#C49BD4',
  Éducation: '#8B6F47',
  Autre: '#A89279',
}

const getThemeColor = (name: string): string => {
  if (THEME_COLORS[name]) return THEME_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 50%, 45%)`
}

const truncate = (text: string, len: number): string =>
  text.length > len ? text.slice(0, len) + '...' : text

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [themeFilter, setThemeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [themes, setThemes] = useState<Theme[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [seniorId, setSeniorId] = useState<string | null>(null)

  useEffect(() => {
    memoriesService.themes().then((res) => {
      const data = res.data as any
      const list: Theme[] = Array.isArray(data) ? data : data.items ?? data.results ?? []
      setThemes(list)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    resolveSeniorId().then(setSeniorId).catch(() => setSeniorId(null))
  }, [])

  const load = useCallback(async () => {
    if (!seniorId) return
    setLoading(true)
    setError(false)
    try {
      const { data } = await memoriesService.list(seniorId, {
        theme: themeFilter || undefined,
        page,
        per_page: PER_PAGE,
      })
      const d = data as any
      const items: Memory[] = Array.isArray(d) ? d : d.items ?? d.results ?? []
      setMemories(items)
      setTotal(d.total ?? items.length)
    } catch {
      setMemories([])
      setTotal(0)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [seniorId, themeFilter, page])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return memories
    const q = search.toLowerCase()
    return memories.filter(
      (m) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.summary || '').toLowerCase().includes(q),
    )
  }, [memories, search])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const themeButtons = useMemo(() => {
    const items: { id: string; name: string }[] = [{ id: '', name: 'Tous' }]
    for (const t of themes) {
      items.push({ id: t.id, name: t.name })
    }
    if (themes.length === 0) {
      for (const name of ['Enfance', 'Famille', 'Travail', 'Voyages', 'Loisirs']) {
        items.push({ id: name, name })
      }
    }
    return items
  }, [themes])

  return (
    <div>
      <h2 className="mb-1 font-heading text-[28px] text-text-dark">Souvenirs</h2>
      <p className="mb-6 text-[15px] text-text-muted">
        Découvrez les souvenirs partagés par votre proche.
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3.5">
        <input
          type="text"
          placeholder="Rechercher un souvenir..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-[400px] rounded-[10px] border border-beige bg-white px-4 py-3 font-body text-[15px] outline-none focus:border-orange-soft"
        />
        <div className="flex flex-wrap gap-2">
          {themeButtons.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setThemeFilter(t.id)
                setPage(1)
              }}
              className={`rounded-full border px-4 py-2 font-body text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                themeFilter === t.id
                  ? 'border-brown-light bg-brown-light text-white'
                  : 'border-beige bg-white text-text-muted hover:bg-cream'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="p-5 text-text-muted">Chargement...</p>
      ) : error ? (
        <p className="p-5 text-red-500">
          Erreur lors du chargement des souvenirs.
        </p>
      ) : filtered.length === 0 ? (
        <p className="p-5 text-text-muted">Aucun souvenir trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id
            const themeList = m.theme_names ?? m.themes ?? []
            return (
              <div
                key={m.id}
                className="flex cursor-pointer flex-col gap-2 rounded-2xl bg-white p-[22px] shadow-sm transition-shadow duration-200 hover:shadow-md"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setExpandedId(isExpanded ? null : m.id)
                }}
              >
                <h3 className="text-[17px] font-bold text-text-dark">{m.title || 'Sans titre'}</h3>
                {m.period && <p className="text-[13px] font-semibold text-text-light">{m.period}</p>}
                {m.created_at && (
                  <p className="text-xs text-text-light">
                    {new Date(m.created_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
                <p className="flex-1 text-sm leading-relaxed text-text-dark/80">
                  {isExpanded
                    ? m.summary || 'Aucun résumé.'
                    : truncate(m.summary || 'Aucun résumé.', 150)}
                </p>
                {!isExpanded && m.summary && m.summary.length > 150 && (
                  <span className="text-[13px] font-bold text-brown-light">Lire la suite</span>
                )}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {themeList.map((t: string) => {
                    const color = getThemeColor(t)
                    return (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ backgroundColor: color + '22', color }}
                      >
                        {t}
                      </span>
                    )
                  })}
                </div>
                {m.session_id && (
                  <button
                    className="mt-1.5 self-start rounded-lg border border-orange-soft bg-cream px-4 py-1.5 font-body text-[13px] font-semibold text-brown-light cursor-pointer hover:bg-orange-soft/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      alert('La réécoute audio sera bientôt disponible.')
                    }}
                  >
                    Réécouter
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-7 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-beige bg-white px-[18px] py-2 font-body text-sm font-semibold text-brown-light cursor-pointer disabled:cursor-default disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm font-semibold text-text-muted">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-beige bg-white px-[18px] py-2 font-body text-sm font-semibold text-brown-light cursor-pointer disabled:cursor-default disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}

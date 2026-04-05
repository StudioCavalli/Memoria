import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { resolveSeniorId, memoriesService } from '../services/api';

interface Theme {
  id: string;
  name: string;
}

interface Memory {
  id: string;
  title: string;
  summary: string;
  period: string;
  themes: string[];
  theme_names?: string[];
  session_id?: string | null;
  created_at?: string;
}

const PER_PAGE = 12;

const THEME_COLORS: Record<string, string> = {
  Enfance: '#E8A87C',
  Famille: '#D4A5A5',
  Travail: '#7FB069',
  Voyages: '#6BAED6',
  Loisirs: '#E6B333',
  Amitié: '#C49BD4',
  Éducation: '#8B6F47',
  Autre: '#A89279',
};

const getThemeColor = (name: string): string => {
  if (THEME_COLORS[name]) return THEME_COLORS[name];
  // Deterministic color from name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 45%)`;
};

const truncate = (text: string, len: number): string =>
  text.length > len ? text.slice(0, len) + '...' : text;

const MemoriesPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [themeFilter, setThemeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seniorId, setSeniorId] = useState<string | null>(null);

  // Load themes once
  useEffect(() => {
    memoriesService.themes().then((res) => {
      const data = res.data;
      const list: Theme[] = Array.isArray(data) ? data : data.items ?? data.results ?? [];
      setThemes(list);
    }).catch(() => {
      // themes not available, use empty list
    });
  }, []);

  // Resolve senior id once
  useEffect(() => {
    resolveSeniorId().then(setSeniorId).catch(() => setSeniorId(null));
  }, []);

  const load = useCallback(async () => {
    if (!seniorId) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await memoriesService.list(seniorId, {
        theme: themeFilter || undefined,
        page,
        per_page: PER_PAGE,
      });
      const items: Memory[] = Array.isArray(data) ? data : data.items ?? data.results ?? [];
      setMemories(items);
      setTotal(data.total ?? items.length);
    } catch {
      setMemories([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [seniorId, themeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side search filter (backend doesn't support text search)
  const filtered = useMemo(() => {
    if (!search.trim()) return memories;
    const q = search.toLowerCase();
    return memories.filter(
      (m) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.summary || '').toLowerCase().includes(q),
    );
  }, [memories, search]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Build theme buttons: "Tous" + real themes from API
  const themeButtons = useMemo(() => {
    const items: { id: string; name: string }[] = [{ id: '', name: 'Tous' }];
    for (const t of themes) {
      items.push({ id: t.id, name: t.name });
    }
    // If no themes from API, add some defaults
    if (themes.length === 0) {
      for (const name of ['Enfance', 'Famille', 'Travail', 'Voyages', 'Loisirs']) {
        items.push({ id: name, name });
      }
    }
    return items;
  }, [themes]);

  return (
    <div>
      <h2 style={styles.pageTitle}>Souvenirs</h2>
      <p style={styles.subtitle}>
        Découvrez les souvenirs partagés par votre proche.
      </p>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Rechercher un souvenir..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.themeRow}>
          {themeButtons.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setThemeFilter(t.id);
                setPage(1);
              }}
              style={{
                ...styles.themeBtn,
                ...(themeFilter === t.id ? styles.themeBtnActive : {}),
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ color: '#7A6555', padding: 20 }}>Chargement...</p>
      ) : error ? (
        <p style={{ color: '#D14343', padding: 20 }}>
          Erreur lors du chargement des souvenirs.
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#7A6555', padding: 20 }}>Aucun souvenir trouvé.</p>
      ) : (
        <div style={styles.grid}>
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id;
            const themeList = m.theme_names ?? m.themes ?? [];
            return (
              <div
                key={m.id}
                style={styles.card}
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setExpandedId(isExpanded ? null : m.id);
                }}
              >
                <h3 style={styles.cardTitle}>{m.title || 'Sans titre'}</h3>
                {m.period && <p style={styles.cardPeriod}>{m.period}</p>}
                {m.created_at && (
                  <p style={styles.cardDate}>
                    {new Date(m.created_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
                <p style={styles.cardSummary}>
                  {isExpanded
                    ? m.summary || 'Aucun résumé.'
                    : truncate(m.summary || 'Aucun résumé.', 150)}
                </p>
                {!isExpanded && m.summary && m.summary.length > 150 && (
                  <span style={styles.readMore}>Lire la suite</span>
                )}
                <div style={styles.tags}>
                  {themeList.map((t: string) => {
                    const color = getThemeColor(t);
                    return (
                      <span
                        key={t}
                        style={{
                          ...styles.tag,
                          backgroundColor: color + '22',
                          color,
                        }}
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
                {m.session_id && (
                  <button
                    style={styles.listenBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Future: link to audio playback
                      alert('La réécoute audio sera bientôt disponible.');
                    }}
                  >
                    Réécouter
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.pageBtn,
              opacity: page <= 1 ? 0.5 : 1,
              cursor: page <= 1 ? 'default' : 'pointer',
            }}
          >
            Précédent
          </button>
          <span style={styles.pageInfo}>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.pageBtn,
              opacity: page >= totalPages ? 0.5 : 1,
              cursor: page >= totalPages ? 'default' : 'pointer',
            }}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageTitle: {
    fontFamily: "'Merriweather', serif",
    fontSize: 28,
    color: '#3D2C1E',
    marginBottom: 4,
  },
  subtitle: {
    color: '#7A6555',
    fontSize: 15,
    marginBottom: 24,
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 24,
  },
  searchInput: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #F5E6D3',
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
    backgroundColor: '#FFFFFF',
    outline: 'none',
    maxWidth: 400,
    width: '100%',
  },
  themeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeBtn: {
    padding: '8px 16px',
    borderRadius: 20,
    border: '1px solid #F5E6D3',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    color: '#7A6555',
    transition: 'all 0.2s',
  },
  themeBtnActive: {
    backgroundColor: '#8B6F47',
    color: '#FFFFFF',
    borderColor: '#8B6F47',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 22,
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#3D2C1E',
  },
  cardPeriod: {
    fontSize: 13,
    color: '#A89279',
    fontWeight: 600,
  },
  cardDate: {
    fontSize: 12,
    color: '#A89279',
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#5C4A3A',
    flex: 1,
  },
  readMore: {
    fontSize: 13,
    fontWeight: 700,
    color: '#8B6F47',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 12,
  },
  listenBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    padding: '6px 16px',
    borderRadius: 8,
    border: '1px solid #E8A87C',
    backgroundColor: '#FFF8F0',
    fontFamily: "'Nunito', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#8B6F47',
    cursor: 'pointer',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 28,
  },
  pageBtn: {
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid #F5E6D3',
    backgroundColor: '#FFFFFF',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: '#8B6F47',
  },
  pageInfo: {
    fontSize: 14,
    color: '#7A6555',
    fontWeight: 600,
  },
};

export default MemoriesPage;

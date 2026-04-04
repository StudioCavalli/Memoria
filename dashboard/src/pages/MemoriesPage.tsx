import React, { useEffect, useState, useCallback } from 'react';
import { memoriesService } from '../services/api';

interface Memory {
  id: string;
  title: string;
  summary: string;
  period: string;
  themes: string[];
}

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default';
const PER_PAGE = 12;

const THEME_OPTIONS = [
  'Tous',
  'Enfance',
  'Famille',
  'Travail',
  'Voyages',
  'Loisirs',
  'Amitié',
  'Éducation',
  'Autre',
];

const THEME_COLORS: Record<string, string> = {
  Enfance: '#E8A87C',
  Famille: '#D4A5A5',
  Travail: '#7FB069',
  Voyages: '#6BAED6',
  Loisirs: '#E6B333',
  'Amitié': '#C49BD4',
  'Éducation': '#8B6F47',
  Autre: '#A89279',
};

const MemoriesPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [theme, setTheme] = useState('Tous');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await memoriesService.list(SENIOR_ID(), {
        theme: theme === 'Tous' ? undefined : theme,
        search: search || undefined,
        page,
        per_page: PER_PAGE,
      });
      setMemories(data.items || data || []);
      setTotal(data.total ?? (data.items || data).length);
    } catch {
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }, [theme, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

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
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={styles.searchInput}
        />
        <div style={styles.themeRow}>
          {THEME_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTheme(t);
                setPage(1);
              }}
              style={{
                ...styles.themeBtn,
                ...(theme === t ? styles.themeBtnActive : {}),
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <p style={{ color: '#7A6555', padding: 20 }}>Chargement...</p>
      ) : memories.length === 0 ? (
        <p style={{ color: '#7A6555', padding: 20 }}>Aucun souvenir trouvé.</p>
      ) : (
        <div style={styles.grid}>
          {memories.map((m) => (
            <div key={m.id} style={styles.card}>
              <h3 style={styles.cardTitle}>{m.title}</h3>
              <p style={styles.cardPeriod}>{m.period}</p>
              <p style={styles.cardSummary}>{m.summary}</p>
              <div style={styles.tags}>
                {(m.themes || []).map((t) => (
                  <span
                    key={t}
                    style={{
                      ...styles.tag,
                      backgroundColor: (THEME_COLORS[t] || '#A89279') + '22',
                      color: THEME_COLORS[t] || '#A89279',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={styles.pageBtn}
          >
            Précédent
          </button>
          <span style={styles.pageInfo}>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={styles.pageBtn}
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
  cardSummary: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#5C4A3A',
    flex: 1,
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
    cursor: 'pointer',
    color: '#8B6F47',
  },
  pageInfo: {
    fontSize: 14,
    color: '#7A6555',
    fontWeight: 600,
  },
};

export default MemoriesPage;

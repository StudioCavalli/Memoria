import React, { useEffect, useState } from 'react';
import { gazettesService } from '../services/api';

interface Gazette {
  id: string;
  title: string;
  date: string;
  description?: string;
}

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default';

const GazettesPage: React.FC = () => {
  const [gazettes, setGazettes] = useState<Gazette[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await gazettesService.list(SENIOR_ID());
        setGazettes(data.items || data || []);
      } catch {
        setGazettes([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = async (gazette: Gazette) => {
    try {
      const { data } = await gazettesService.download(SENIOR_ID(), gazette.id);
      const url = window.URL.createObjectURL(data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${gazette.title || 'gazette'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger la gazette.');
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Gazettes</h2>
      <p style={styles.subtitle}>
        Les gazettes résument les souvenirs et moments clés de votre proche.
      </p>

      {loading ? (
        <p style={{ color: '#7A6555', padding: 20 }}>Chargement...</p>
      ) : gazettes.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Aucune gazette disponible pour le moment.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {gazettes.map((g) => (
            <div key={g.id} style={styles.card}>
              <div style={styles.cardIcon}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="2" width="16" height="20" rx="2" stroke="#8B6F47" strokeWidth="1.5" />
                  <line x1="8" y1="7" x2="16" y2="7" stroke="#E8A87C" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="8" y1="11" x2="16" y2="11" stroke="#E8A87C" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="8" y1="15" x2="13" y2="15" stroke="#E8A87C" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>{g.title}</h3>
                <p style={styles.cardDate}>{g.date}</p>
                {g.description && (
                  <p style={styles.cardDesc}>{g.description}</p>
                )}
              </div>
              <button
                style={styles.downloadBtn}
                onClick={() => handleDownload(g)}
              >
                Télécharger PDF
              </button>
            </div>
          ))}
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: '18px 22px',
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
    flexWrap: 'wrap',
  },
  cardIcon: {
    flexShrink: 0,
    width: 52,
    height: 52,
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    minWidth: 180,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#3D2C1E',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 13,
    color: '#A89279',
    fontWeight: 600,
  },
  cardDesc: {
    fontSize: 14,
    color: '#5C4A3A',
    marginTop: 4,
    lineHeight: 1.4,
  },
  downloadBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#8B6F47',
    color: '#FFFFFF',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    textAlign: 'center',
    padding: 40,
    color: '#7A6555',
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
  },
};

export default GazettesPage;

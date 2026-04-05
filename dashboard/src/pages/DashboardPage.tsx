import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  resolveSeniorId,
  sessionsService,
  memoriesService,
  alertsService,
  metricsService,
  gazettesService,
} from '../services/api';

interface MetricPoint {
  date: string;
  unique_words: number;
}

interface MetricsSummary {
  vitality_score: number;
  semantic_richness_trend: string | null;
  latency_trend: string | null;
  session_count_7d: number;
}

interface DashboardData {
  lastSession: { date: string; summary: string } | null;
  memoriesCount: number;
  unreadAlerts: number;
  metricsHistory: MetricPoint[];
  summary: MetricsSummary;
  latestGazette: { id: string; title: string; date: string } | null;
}

const EMPTY_SUMMARY: MetricsSummary = {
  vitality_score: 0,
  semantic_richness_trend: null,
  latency_trend: null,
  session_count_7d: 0,
};

const trendLabel = (trend: string | null): { text: string; color: string } => {
  if (!trend) return { text: '--', color: '#A89279' };
  if (trend === 'up' || trend === 'improving')
    return { text: 'En hausse', color: '#7FB069' };
  if (trend === 'down' || trend === 'declining')
    return { text: 'En baisse', color: '#D14343' };
  return { text: 'Stable', color: '#E6B333' };
};

const vitalityColor = (score: number): string => {
  if (score > 70) return '#7FB069';
  if (score >= 40) return '#D97706';
  return '#D14343';
};

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    lastSession: null,
    memoriesCount: 0,
    unreadAlerts: 0,
    metricsHistory: [],
    summary: EMPTY_SUMMARY,
    latestGazette: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const sid = await resolveSeniorId();

      const [sessionRes, memoriesRes, alertsRes, historyRes, summaryRes, gazettesRes] =
        await Promise.allSettled([
          sessionsService.latest(sid),
          memoriesService.list(sid, { page: 1, per_page: 1 }),
          alertsService.unreadCount(sid),
          metricsService.history(sid, 7),
          metricsService.summary(sid),
          gazettesService.list(sid, 0, 1),
        ]);

      // --- Parse metrics history ---
      let history: MetricPoint[] = [];
      if (historyRes.status === 'fulfilled') {
        const raw = historyRes.value.data;
        const items: unknown[] = Array.isArray(raw) ? raw : raw.history ?? raw.items ?? [];
        history = items.map((m: any) => ({
          date: m.date ?? '',
          unique_words: m.unique_words ?? m.semantic_richness ?? m.score ?? 0,
        }));
      }

      // --- Parse metrics summary ---
      let summary: MetricsSummary = { ...EMPTY_SUMMARY };
      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value.data;
        summary = {
          vitality_score: s.vitality_score ?? 0,
          semantic_richness_trend: s.semantic_richness_trend ?? null,
          latency_trend: s.latency_trend ?? null,
          session_count_7d: s.session_count_7d ?? s.session_count ?? 0,
        };
      }

      // --- Parse gazette list ---
      let latestGazette: DashboardData['latestGazette'] = null;
      if (gazettesRes.status === 'fulfilled') {
        const gd = gazettesRes.value.data;
        const list = Array.isArray(gd) ? gd : gd.items ?? gd.results ?? [];
        if (list.length > 0) {
          latestGazette = {
            id: list[0].id,
            title: list[0].title ?? 'Gazette',
            date: list[0].created_at ?? list[0].date ?? '',
          };
        }
      }

      setData({
        lastSession:
          sessionRes.status === 'fulfilled' && sessionRes.value.data
            ? {
                date: sessionRes.value.data.created_at ?? sessionRes.value.data.date ?? '',
                summary: sessionRes.value.data.summary ?? '',
              }
            : null,
        memoriesCount:
          memoriesRes.status === 'fulfilled'
            ? (() => {
                const d = memoriesRes.value.data;
                return d.total ?? (Array.isArray(d) ? d : d.items ?? []).length ?? 0;
              })()
            : 0,
        unreadAlerts:
          alertsRes.status === 'fulfilled'
            ? alertsRes.value.data.count ?? 0
            : 0,
        metricsHistory: history,
        summary,
        latestGazette,
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <p style={{ padding: 32, color: '#7A6555' }}>Chargement...</p>;
  }

  if (error) {
    return (
      <p style={{ padding: 32, color: '#D14343' }}>
        Erreur lors du chargement du tableau de bord.
      </p>
    );
  }

  const semTrend = trendLabel(data.summary.semantic_richness_trend);
  const latTrend = trendLabel(data.summary.latency_trend);

  return (
    <div>
      <h2 style={styles.pageTitle}>Bonjour !</h2>
      <p style={styles.subtitle}>
        Voici un aperçu de l'état de votre proche.
      </p>

      <div style={styles.grid}>
        {/* Last session */}
        <div style={{ ...styles.card, gridColumn: 'span 2' }}>
          <h3 style={styles.cardTitle}>Dernière session</h3>
          {data.lastSession ? (
            <>
              <p style={styles.cardMeta}>{data.lastSession.date}</p>
              <p style={styles.cardBody}>{data.lastSession.summary || 'Aucun résumé disponible.'}</p>
            </>
          ) : (
            <p style={styles.cardBody}>Aucune session enregistrée.</p>
          )}
        </div>

        {/* Memories count */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Souvenirs</h3>
          <p style={styles.bigNumber}>{data.memoriesCount}</p>
          <Link to="/memories" style={styles.cardLink}>
            Voir tout
          </Link>
        </div>

        {/* Unread alerts */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Alertes non lues</h3>
          <p
            style={{
              ...styles.bigNumber,
              color: data.unreadAlerts > 0 ? '#D97706' : '#7FB069',
            }}
          >
            {data.unreadAlerts}
          </p>
          <Link to="/alerts" style={styles.cardLink}>
            Gérer
          </Link>
        </div>

        {/* Sessions 7 days */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Sessions (7 jours)</h3>
          <p style={styles.bigNumber}>{data.summary.session_count_7d}</p>
        </div>

        {/* Vitality score */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Score de vitalité</h3>
          <p
            style={{
              ...styles.bigNumber,
              color: vitalityColor(data.summary.vitality_score),
            }}
          >
            {data.summary.vitality_score}
            <span style={{ fontSize: 18, fontWeight: 400 }}> / 100</span>
          </p>
          <Link to="/metrics" style={styles.cardLink}>
            Détails
          </Link>
        </div>

        {/* Semantic richness chart */}
        <div style={{ ...styles.card, gridColumn: 'span 2' }}>
          <h3 style={styles.cardTitle}>
            Richesse sémantique — mots uniques (7 jours)
          </h3>
          {data.metricsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.metricsHistory}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#7A6555' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                  formatter={(value: number) => [`${value}`, 'Mots uniques']}
                />
                <Line
                  type="monotone"
                  dataKey="unique_words"
                  stroke="#E8A87C"
                  strokeWidth={2.5}
                  dot={{ fill: '#8B6F47', r: 3 }}
                  name="Mots uniques"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.cardBody}>Pas de données disponibles.</p>
          )}
        </div>

        {/* Trends */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tendances</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={styles.trendLabel}>Richesse sémantique</p>
              <p style={{ ...styles.trendValue, color: semTrend.color }}>
                {semTrend.text}
              </p>
            </div>
            <div>
              <p style={styles.trendLabel}>Latence de réponse</p>
              <p style={{ ...styles.trendValue, color: latTrend.color }}>
                {latTrend.text}
              </p>
            </div>
          </div>
        </div>

        {/* Latest gazette */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Dernière gazette</h3>
          {data.latestGazette ? (
            <>
              <p style={styles.cardBody}>{data.latestGazette.title}</p>
              <p style={styles.cardMeta}>{data.latestGazette.date}</p>
              <Link to="/gazettes" style={styles.cardLink}>
                Voir les gazettes
              </Link>
            </>
          ) : (
            <p style={styles.cardBody}>Aucune gazette disponible.</p>
          )}
        </div>
      </div>
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
    marginBottom: 28,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: '24px',
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#7A6555',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardMeta: {
    fontSize: 13,
    color: '#A89279',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 1.5,
    color: '#3D2C1E',
  },
  bigNumber: {
    fontSize: 42,
    fontWeight: 700,
    color: '#8B6F47',
    lineHeight: 1,
  },
  cardLink: {
    marginTop: 'auto',
    fontSize: 14,
    fontWeight: 700,
    color: '#8B6F47',
    textDecoration: 'none',
    paddingTop: 8,
  },
  trendLabel: {
    fontSize: 13,
    color: '#A89279',
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 700,
  },
};

export default DashboardPage;

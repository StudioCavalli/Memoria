import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { sessionsService, memoriesService, alertsService, metricsService, gazettesService } from '../services/api';

interface DashboardData {
  lastSession: { date: string; summary: string } | null;
  memoriesCount: number;
  unreadAlerts: number;
  metricsHistory: { date: string; score: number }[];
  vitalityScore: number;
  latestGazette: { id: string; title: string; date: string } | null;
}

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    lastSession: null,
    memoriesCount: 0,
    unreadAlerts: 0,
    metricsHistory: [],
    vitalityScore: 0,
    latestGazette: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sid = SENIOR_ID();
      try {
        const [sessionRes, memoriesRes, alertsRes, metricsRes, gazettesRes] =
          await Promise.allSettled([
            sessionsService.latest(sid),
            memoriesService.list(sid, { page: 1, per_page: 1 }),
            alertsService.unreadCount(sid),
            metricsService.history(sid, 7),
            gazettesService.list(sid),
          ]);

        setData({
          lastSession:
            sessionRes.status === 'fulfilled'
              ? {
                  date: sessionRes.value.data.date,
                  summary: sessionRes.value.data.summary,
                }
              : null,
          memoriesCount:
            memoriesRes.status === 'fulfilled'
              ? memoriesRes.value.data.total || memoriesRes.value.data.length || 0
              : 0,
          unreadAlerts:
            alertsRes.status === 'fulfilled'
              ? alertsRes.value.data.count ?? alertsRes.value.data
              : 0,
          metricsHistory:
            metricsRes.status === 'fulfilled'
              ? (metricsRes.value.data.history || metricsRes.value.data || []).map(
                  (m: { date: string; semantic_richness?: number; score?: number }) => ({
                    date: m.date,
                    score: m.semantic_richness ?? m.score ?? 0,
                  }),
                )
              : [],
          vitalityScore:
            metricsRes.status === 'fulfilled'
              ? metricsRes.value.data.vitality_score ?? 0
              : 0,
          latestGazette:
            gazettesRes.status === 'fulfilled' && gazettesRes.value.data.length > 0
              ? gazettesRes.value.data[0]
              : null,
        });
      } catch {
        // fail silently; widgets stay empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p style={{ padding: 32, color: '#7A6555' }}>Chargement...</p>;
  }

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
              <p style={styles.cardBody}>{data.lastSession.summary}</p>
            </>
          ) : (
            <p style={styles.cardBody}>Aucune session enregistrée.</p>
          )}
        </div>

        {/* Total memories */}
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
            {data.unreadAlerts > 0 && (
              <span style={styles.badge}>{data.unreadAlerts}</span>
            )}
          </p>
          <Link to="/alerts" style={styles.cardLink}>
            Gérer
          </Link>
        </div>

        {/* Mini metrics chart */}
        <div style={{ ...styles.card, gridColumn: 'span 2' }}>
          <h3 style={styles.cardTitle}>
            Richesse sémantique (7 derniers jours)
          </h3>
          {data.metricsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
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
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#E8A87C"
                  strokeWidth={2.5}
                  dot={{ fill: '#8B6F47', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.cardBody}>Pas de données disponibles.</p>
          )}
        </div>

        {/* Vitality score */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Score de vitalité</h3>
          <div style={styles.gauge}>
            <svg viewBox="0 0 120 70" width="120" height="70">
              <path
                d="M10 60 A50 50 0 0 1 110 60"
                fill="none"
                stroke="#F5E6D3"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M10 60 A50 50 0 0 1 110 60"
                fill="none"
                stroke="#E8A87C"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(data.vitalityScore / 100) * 157} 157`}
              />
              <text
                x="60"
                y="55"
                textAnchor="middle"
                fontSize="22"
                fontWeight="bold"
                fill="#3D2C1E"
                fontFamily="Nunito"
              >
                {data.vitalityScore}
              </text>
            </svg>
          </div>
          <Link to="/metrics" style={styles.cardLink}>
            Détails
          </Link>
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    marginLeft: 6,
    backgroundColor: '#D97706',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 99,
    padding: '2px 8px',
    lineHeight: '18px',
  },
  cardLink: {
    marginTop: 'auto',
    fontSize: 14,
    fontWeight: 700,
    color: '#8B6F47',
    textDecoration: 'none',
    paddingTop: 8,
  },
  gauge: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 0',
  },
};

export default DashboardPage;

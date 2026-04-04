import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { metricsService } from '../services/api';

interface MetricPoint {
  date: string;
  semantic_richness: number;
  response_latency: number;
}

interface MetricsSummary {
  vitality_score: number;
  semantic_trend: 'stable' | 'increasing' | 'decreasing';
  latency_trend: 'stable' | 'increasing' | 'decreasing';
}

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default';

const TREND_LABELS: Record<string, { label: string; color: string; arrow: string }> = {
  increasing: { label: 'En hausse', color: '#7FB069', arrow: '↑' },
  stable: { label: 'Stable', color: '#E6B333', arrow: '→' },
  decreasing: { label: 'En baisse', color: '#D14343', arrow: '↓' },
};

const MetricsPage: React.FC = () => {
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [summary, setSummary] = useState<MetricsSummary>({
    vitality_score: 0,
    semantic_trend: 'stable',
    latency_trend: 'stable',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sid = SENIOR_ID();
      try {
        const [histRes, sumRes] = await Promise.allSettled([
          metricsService.history(sid, 30),
          metricsService.summary(sid),
        ]);
        if (histRes.status === 'fulfilled') {
          setHistory(histRes.value.data.history || histRes.value.data || []);
        }
        if (sumRes.status === 'fulfilled') {
          setSummary({
            vitality_score: sumRes.value.data.vitality_score ?? 0,
            semantic_trend: sumRes.value.data.semantic_trend ?? 'stable',
            latency_trend: sumRes.value.data.latency_trend ?? 'stable',
          });
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const semTrend = TREND_LABELS[summary.semantic_trend] || TREND_LABELS.stable;
  const latTrend = TREND_LABELS[summary.latency_trend] || TREND_LABELS.stable;

  if (loading) {
    return <p style={{ padding: 32, color: '#7A6555' }}>Chargement...</p>;
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Suivi cognitif</h2>
      <p style={styles.subtitle}>
        Évolution des indicateurs cognitifs sur les 30 derniers jours.
      </p>

      {/* Vitality gauge + trend cards */}
      <div style={styles.topRow}>
        {/* Vitality score */}
        <div style={{ ...styles.card, alignItems: 'center', minWidth: 200 }}>
          <h3 style={styles.cardLabel}>Score de vitalité</h3>
          <svg viewBox="0 0 160 95" width="180" height="105">
            <path
              d="M15 80 A65 65 0 0 1 145 80"
              fill="none"
              stroke="#F5E6D3"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M15 80 A65 65 0 0 1 145 80"
              fill="none"
              stroke={
                summary.vitality_score >= 70
                  ? '#7FB069'
                  : summary.vitality_score >= 40
                  ? '#E6B333'
                  : '#D14343'
              }
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(summary.vitality_score / 100) * 204} 204`}
            />
            <text
              x="80"
              y="72"
              textAnchor="middle"
              fontSize="32"
              fontWeight="bold"
              fill="#3D2C1E"
              fontFamily="Nunito"
            >
              {summary.vitality_score}
            </text>
            <text
              x="80"
              y="90"
              textAnchor="middle"
              fontSize="12"
              fill="#7A6555"
              fontFamily="Nunito"
            >
              / 100
            </text>
          </svg>
        </div>

        {/* Semantic trend */}
        <div style={styles.card}>
          <h3 style={styles.cardLabel}>Richesse sémantique</h3>
          <div style={styles.trendRow}>
            <span style={{ ...styles.trendArrow, color: semTrend.color }}>
              {semTrend.arrow}
            </span>
            <span style={{ ...styles.trendText, color: semTrend.color }}>
              {semTrend.label}
            </span>
          </div>
        </div>

        {/* Latency trend */}
        <div style={styles.card}>
          <h3 style={styles.cardLabel}>Temps de réponse</h3>
          <div style={styles.trendRow}>
            <span style={{ ...styles.trendArrow, color: latTrend.color }}>
              {latTrend.arrow}
            </span>
            <span style={{ ...styles.trendText, color: latTrend.color }}>
              {latTrend.label}
            </span>
          </div>
        </div>
      </div>

      {/* Semantic richness chart */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Richesse sémantique (30 jours)</h3>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#7A6555' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#7A6555' }}
                axisLine={false}
                tickLine={false}
              />
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
                dataKey="semantic_richness"
                name="Richesse"
                stroke="#E8A87C"
                strokeWidth={2.5}
                dot={{ fill: '#8B6F47', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={styles.noData}>Pas de données disponibles.</p>
        )}
      </div>

      {/* Response latency chart */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Temps de réponse (30 jours)</h3>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#7A6555' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#7A6555' }}
                axisLine={false}
                tickLine={false}
                unit="s"
              />
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
                dataKey="response_latency"
                name="Latence"
                stroke="#D4A5A5"
                strokeWidth={2.5}
                dot={{ fill: '#8B6F47', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={styles.noData}>Pas de données disponibles.</p>
        )}
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
  topRow: {
    display: 'flex',
    gap: 18,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 22,
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#7A6555',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  trendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  trendArrow: {
    fontSize: 28,
    fontWeight: 700,
  },
  trendText: {
    fontSize: 18,
    fontWeight: 700,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#3D2C1E',
    marginBottom: 16,
  },
  noData: {
    color: '#7A6555',
    textAlign: 'center',
    padding: 32,
  },
};

export default MetricsPage;

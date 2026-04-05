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

const TREND_LABELS: Record<string, { label: string; colorClass: string; arrow: string }> = {
  increasing: { label: 'En hausse', colorClass: 'text-green-light', arrow: '↑' },
  stable: { label: 'Stable', colorClass: 'text-yellow-warm', arrow: '→' },
  decreasing: { label: 'En baisse', colorClass: 'text-red-500', arrow: '↓' },
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
    return <p className="p-8 text-text-muted">Chargement...</p>;
  }

  return (
    <div>
      <h2 className="mb-1 font-heading text-[28px] text-text-dark">Suivi cognitif</h2>
      <p className="mb-7 text-[15px] text-text-muted">
        Évolution des indicateurs cognitifs sur les 30 derniers jours.
      </p>

      {/* Vitality gauge + trend cards */}
      <div className="mb-6 flex flex-wrap gap-[18px]">
        {/* Vitality score */}
        <div className="flex min-w-[200px] flex-1 flex-col items-center gap-3 rounded-2xl bg-white p-[22px] shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">Score de vitalité</h3>
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
        <div className="flex min-w-[160px] flex-1 flex-col gap-3 rounded-2xl bg-white p-[22px] shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">Richesse sémantique</h3>
          <div className="flex items-center gap-2.5">
            <span className={`text-[28px] font-bold ${semTrend.colorClass}`}>{semTrend.arrow}</span>
            <span className={`text-lg font-bold ${semTrend.colorClass}`}>{semTrend.label}</span>
          </div>
        </div>

        {/* Latency trend */}
        <div className="flex min-w-[160px] flex-1 flex-col gap-3 rounded-2xl bg-white p-[22px] shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">Temps de réponse</h3>
          <div className="flex items-center gap-2.5">
            <span className={`text-[28px] font-bold ${latTrend.colorClass}`}>{latTrend.arrow}</span>
            <span className={`text-lg font-bold ${latTrend.colorClass}`}>{latTrend.label}</span>
          </div>
        </div>
      </div>

      {/* Semantic richness chart */}
      <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-text-dark">Richesse sémantique (30 jours)</h3>
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
          <p className="p-8 text-center text-text-muted">Pas de données disponibles.</p>
        )}
      </div>

      {/* Response latency chart */}
      <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-text-dark">Temps de réponse (30 jours)</h3>
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
          <p className="p-8 text-center text-text-muted">Pas de données disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default MetricsPage;

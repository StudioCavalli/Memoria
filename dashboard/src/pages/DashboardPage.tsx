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

const trendLabel = (trend: string | null): { text: string; colorClass: string } => {
  if (!trend) return { text: '--', colorClass: 'text-text-light' };
  if (trend === 'up' || trend === 'improving')
    return { text: 'En hausse', colorClass: 'text-green-light' };
  if (trend === 'down' || trend === 'declining')
    return { text: 'En baisse', colorClass: 'text-red-500' };
  return { text: 'Stable', colorClass: 'text-yellow-warm' };
};

const vitalityColorClass = (score: number): string => {
  if (score > 70) return 'text-green-light';
  if (score >= 40) return 'text-amber-warm';
  return 'text-red-500';
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

      let history: MetricPoint[] = [];
      if (historyRes.status === 'fulfilled') {
        const raw = historyRes.value.data;
        const items: unknown[] = Array.isArray(raw) ? raw : raw.history ?? raw.items ?? [];
        history = items.map((m: any) => ({
          date: m.date ?? '',
          unique_words: m.unique_words ?? m.semantic_richness ?? m.score ?? 0,
        }));
      }

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
    return <p className="p-8 text-text-muted">Chargement...</p>;
  }

  if (error) {
    return (
      <p className="p-8 text-red-500">
        Erreur lors du chargement du tableau de bord.
      </p>
    );
  }

  const semTrend = trendLabel(data.summary.semantic_richness_trend);
  const latTrend = trendLabel(data.summary.latency_trend);

  return (
    <div>
      <h2 className="mb-1 font-heading text-[28px] text-text-dark">Bonjour !</h2>
      <p className="mb-7 text-[15px] text-text-muted">
        Voici un aperçu de l'état de votre proche.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        {/* Last session */}
        <div className="col-span-1 flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm sm:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Dernière session</h3>
          {data.lastSession ? (
            <>
              <p className="text-[13px] text-text-light">{data.lastSession.date}</p>
              <p className="text-[15px] leading-relaxed text-text-dark">{data.lastSession.summary || 'Aucun résumé disponible.'}</p>
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-text-dark">Aucune session enregistrée.</p>
          )}
        </div>

        {/* Memories count */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Souvenirs</h3>
          <p className="text-[42px] font-bold leading-none text-brown-light">{data.memoriesCount}</p>
          <Link to="/memories" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
            Voir tout
          </Link>
        </div>

        {/* Unread alerts */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Alertes non lues</h3>
          <p className={`text-[42px] font-bold leading-none ${data.unreadAlerts > 0 ? 'text-amber-warm' : 'text-green-light'}`}>
            {data.unreadAlerts}
          </p>
          <Link to="/alerts" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
            Gérer
          </Link>
        </div>

        {/* Sessions 7 days */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Sessions (7 jours)</h3>
          <p className="text-[42px] font-bold leading-none text-brown-light">{data.summary.session_count_7d}</p>
        </div>

        {/* Vitality score */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Score de vitalité</h3>
          <p className={`text-[42px] font-bold leading-none ${vitalityColorClass(data.summary.vitality_score)}`}>
            {data.summary.vitality_score}
            <span className="text-lg font-normal"> / 100</span>
          </p>
          <Link to="/metrics" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
            Détails
          </Link>
        </div>

        {/* Semantic richness chart */}
        <div className="col-span-1 flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm sm:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">
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
            <p className="text-[15px] leading-relaxed text-text-dark">Pas de données disponibles.</p>
          )}
        </div>

        {/* Trends */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Tendances</h3>
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-0.5 text-[13px] text-text-light">Richesse sémantique</p>
              <p className={`text-base font-bold ${semTrend.colorClass}`}>{semTrend.text}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[13px] text-text-light">Latence de réponse</p>
              <p className={`text-base font-bold ${latTrend.colorClass}`}>{latTrend.text}</p>
            </div>
          </div>
        </div>

        {/* Latest gazette */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">Dernière gazette</h3>
          {data.latestGazette ? (
            <>
              <p className="text-[15px] leading-relaxed text-text-dark">{data.latestGazette.title}</p>
              <p className="text-[13px] text-text-light">{data.latestGazette.date}</p>
              <Link to="/gazettes" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
                Voir les gazettes
              </Link>
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-text-dark">Aucune gazette disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

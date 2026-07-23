'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { metricsService } from '@/lib/dashboard-api'
import { useI18n } from '@/lib/i18n'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ApiMetricPoint {
  id: number
  senior_id: number
  session_id: number
  unique_words: number
  type_token_ratio: number
  avg_sentence_length: number
  named_entities_count: number
  avg_latency_ms: number
  max_latency_ms: number
  silence_count: number
  evasive_responses: number
  recorded_at: string
}

interface MetricPoint {
  date: string
  unique_words: number
  avg_latency_ms: number
}

interface MetricsSummary {
  vitality_score: number
  semantic_trend: 'stable' | 'increasing' | 'decreasing'
  latency_trend: 'stable' | 'increasing' | 'decreasing'
}

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default'

export default function MetricsPage() {
  const { t } = useI18n()

  const TREND_LABELS: Record<string, { label: string; colorClass: string; arrow: string }> = {
    increasing: { label: t('metrics.trend.up'), colorClass: 'text-green-light', arrow: '\u2191' },
    stable: { label: t('metrics.trend.stable'), colorClass: 'text-yellow-warm', arrow: '\u2192' },
    decreasing: { label: t('metrics.trend.down'), colorClass: 'text-red-500', arrow: '\u2193' },
  }

  const [history, setHistory] = useState<MetricPoint[]>([])
  const [summary, setSummary] = useState<MetricsSummary>({
    vitality_score: 0,
    semantic_trend: 'stable',
    latency_trend: 'stable',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const sid = SENIOR_ID()
      try {
        const [histRes, sumRes] = await Promise.allSettled([
          metricsService.history(sid, 30),
          metricsService.summary(sid),
        ])
        if (histRes.status === 'fulfilled') {
          const mapped: MetricPoint[] = histRes.value.data.map((p) => {
            const d = new Date(p.recorded_at)
            return {
              date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
              unique_words: p.unique_words,
              avg_latency_ms: p.avg_latency_ms,
            }
          })
          setHistory(mapped)
        }
        if (sumRes.status === 'fulfilled') {
          const s = sumRes.value.data
          setSummary({
            vitality_score: s.vitality_score,
            // backend field is `semantic_richness_trend` (the old `semantic_trend`
            // access was silently undefined → always fell back to 'stable').
            // Backend sends a free string; the UI has a fallback for unknown values.
            semantic_trend: s.semantic_richness_trend as MetricsSummary['semantic_trend'],
            latency_trend: s.latency_trend as MetricsSummary['latency_trend'],
          })
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const semTrend = TREND_LABELS[summary.semantic_trend] || TREND_LABELS.stable
  const latTrend = TREND_LABELS[summary.latency_trend] || TREND_LABELS.stable

  if (loading) {
    return <p className="p-8 text-text-muted">{t('metrics.title')}... {t('dash.loading')}</p>
  }

  return (
    <div>
      <h2 className="mb-1 font-heading text-[28px] text-text-dark">{t('metrics.title')}</h2>
      <p className="mb-7 text-[15px] text-text-muted">
        {t('metrics.subtitle')}
      </p>

      {/* Vitality gauge + trend cards */}
      <div className="mb-6 flex flex-wrap gap-[18px]">
        {/* Vitality score */}
        <div className="flex min-w-[200px] flex-1 flex-col items-center gap-3 rounded-2xl bg-white p-[22px] shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">{t('metrics.vitality')}</h3>
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
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">{t('metrics.semantic')}</h3>
          <div className="flex items-center gap-2.5">
            <span className={`text-[28px] font-bold ${semTrend.colorClass}`}>{semTrend.arrow}</span>
            <span className={`text-lg font-bold ${semTrend.colorClass}`}>{semTrend.label}</span>
          </div>
        </div>

        {/* Latency trend */}
        <div className="flex min-w-[160px] flex-1 flex-col gap-3 rounded-2xl bg-white p-[22px] shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">{t('metrics.latency')}</h3>
          <div className="flex items-center gap-2.5">
            <span className={`text-[28px] font-bold ${latTrend.colorClass}`}>{latTrend.arrow}</span>
            <span className={`text-lg font-bold ${latTrend.colorClass}`}>{latTrend.label}</span>
          </div>
        </div>
      </div>

      {/* Semantic richness chart */}
      <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-text-dark">{t('metrics.chart.semantic')}</h3>
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
                dataKey="unique_words"
                name={t('metrics.unique.words')}
                stroke="#7D6340"
                strokeWidth={2.5}
                dot={{ fill: '#8B6F47', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="p-8 text-center text-text-muted">{t('metrics.no.data')}</p>
        )}
      </div>

      {/* Response latency chart */}
      <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-text-dark">{t('metrics.chart.latency')}</h3>
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
                dataKey="avg_latency_ms"
                name={t('metrics.latency.ms')}
                stroke="#E8A87C"
                strokeWidth={2.5}
                dot={{ fill: '#8B6F47', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="p-8 text-center text-text-muted">{t('metrics.no.data')}</p>
        )}
      </div>
    </div>
  )
}

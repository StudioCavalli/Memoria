'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  resolveSeniorId,
  sessionsService,
  memoriesService,
  alertsService,
  metricsService,
  gazettesService,
} from '@/lib/dashboard-api'
import { useI18n } from '@/lib/i18n'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MetricPoint {
  date: string
  unique_words: number
}

interface MetricsSummary {
  vitality_score: number
  semantic_richness_trend: string | null
  latency_trend: string | null
  session_count_7d: number
}

interface DashboardData {
  lastSession: { date: string; summary: string } | null
  memoriesCount: number
  unreadAlerts: number
  metricsHistory: MetricPoint[]
  summary: MetricsSummary
  latestGazette: { id: string; title: string; date: string } | null
}

const EMPTY_SUMMARY: MetricsSummary = {
  vitality_score: 0,
  semantic_richness_trend: null,
  latency_trend: null,
  session_count_7d: 0,
}

const vitalityColorClass = (score: number): string => {
  if (score > 70) return 'text-green-light'
  if (score >= 40) return 'text-amber-warm'
  return 'text-red-500'
}

export default function DashboardPage() {
  const { t } = useI18n()

  const trendLabel = (trend: string | null): { text: string; colorClass: string } => {
    if (!trend) return { text: '--', colorClass: 'text-text-light' }
    if (trend === 'up' || trend === 'improving')
      return { text: t('dash.trend.up'), colorClass: 'text-green-light' }
    if (trend === 'down' || trend === 'declining')
      return { text: t('dash.trend.down'), colorClass: 'text-red-500' }
    return { text: t('dash.trend.stable'), colorClass: 'text-yellow-warm' }
  }

  const [data, setData] = useState<DashboardData>({
    lastSession: null,
    memoriesCount: 0,
    unreadAlerts: 0,
    metricsHistory: [],
    summary: EMPTY_SUMMARY,
    latestGazette: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    try {
      const sid = await resolveSeniorId()

      const [sessionRes, memoriesRes, alertsRes, historyRes, summaryRes, gazettesRes] =
        await Promise.allSettled([
          sessionsService.latest(sid),
          memoriesService.list(sid, { page: 1, per_page: 1 }),
          alertsService.unreadCount(sid),
          metricsService.history(sid, 7),
          metricsService.summary(sid),
          gazettesService.list(sid, 0, 1),
        ])

      let history: MetricPoint[] = []
      if (historyRes.status === 'fulfilled') {
        history = historyRes.value.data.map((m) => {
          const d = new Date(m.recorded_at)
          return {
            // was `m.date` (absent from the API → always empty); the field is `recorded_at`
            date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
            unique_words: m.unique_words,
          }
        })
      }

      let summary: MetricsSummary = { ...EMPTY_SUMMARY }
      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value.data
        summary = {
          vitality_score: s.vitality_score,
          semantic_richness_trend: s.semantic_richness_trend,
          latency_trend: s.latency_trend,
          session_count_7d: 0, // not exposed by the metrics/summary endpoint
        }
      }

      let latestGazette: DashboardData['latestGazette'] = null
      if (gazettesRes.status === 'fulfilled' && gazettesRes.value.data.length > 0) {
        const g = gazettesRes.value.data[0]
        latestGazette = { id: String(g.id), title: g.title, date: g.created_at }
      }

      // last_session is now typed (SeniorDetailResponse.last_session)
      const lastSessionRaw =
        sessionRes.status === 'fulfilled' ? sessionRes.value.data : null

      setData({
        lastSession: lastSessionRaw
          ? {
              date: lastSessionRaw.date ?? '',
              summary: lastSessionRaw.summary ?? '',
            }
          : null,
        memoriesCount:
          memoriesRes.status === 'fulfilled' ? memoriesRes.value.data.length : 0,
        unreadAlerts:
          alertsRes.status === 'fulfilled' ? alertsRes.value.data.count : 0,
        metricsHistory: history,
        summary,
        latestGazette,
      })
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 60_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <p className="p-8 text-text-muted">{t('dash.loading')}</p>
  }

  if (error) {
    return (
      <p className="p-8 text-red-500">
        {t('dash.error')}
      </p>
    )
  }

  const semTrend = trendLabel(data.summary.semantic_richness_trend)
  const latTrend = trendLabel(data.summary.latency_trend)

  return (
    <div>
      <h2 className="mb-1 font-heading text-[28px] text-text-dark">{t('dash.greeting')}</h2>
      <p className="mb-7 text-[15px] text-text-muted">
        {t('dash.overview')}
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        {/* Last session */}
        <div className="col-span-1 flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm sm:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">{t('dash.last.session')}</h3>
          {data.lastSession ? (
            <>
              <p className="text-[13px] text-text-light">{data.lastSession.date}</p>
              <p className="text-[15px] leading-relaxed text-text-dark">{data.lastSession.summary || t('dash.no.summary')}</p>
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-text-dark">{t('dash.no.session')}</p>
          )}
        </div>

        {/* Memories count */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">{t('dash.memories.count')}</h3>
          <p className="text-[42px] font-bold leading-none text-brown-light">{data.memoriesCount}</p>
          <Link href="/dashboard/memories" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
            {t('dash.view.all')}
          </Link>
        </div>

        {/* Unread alerts */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">{t('dash.unread.alerts')}</h3>
          <p className={`text-[42px] font-bold leading-none ${data.unreadAlerts > 0 ? 'text-amber-warm' : 'text-green-light'}`}>
            {data.unreadAlerts}
          </p>
          <Link href="/dashboard/alerts" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
            {t('dash.manage')}
          </Link>
        </div>

        {/* Sessions 7 days */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">{t('dash.sessions.7d')}</h3>
          <p className="text-[42px] font-bold leading-none text-brown-light">{data.summary.session_count_7d}</p>
        </div>

        {/* Vitality score */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">{t('dash.vitality.score')}</h3>
          <p className={`text-[42px] font-bold leading-none ${vitalityColorClass(data.summary.vitality_score)}`}>
            {data.summary.vitality_score}
            <span className="text-lg font-normal"> / 100</span>
          </p>
          <Link href="/dashboard/metrics" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
            {t('dash.details')}
          </Link>
        </div>

        {/* Semantic richness chart */}
        <div className="col-span-1 flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm sm:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">
            {t('dash.semantic.chart')}
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
                  formatter={(value) => [`${value}`, t('dash.unique.words')]}
                />
                <Line
                  type="monotone"
                  dataKey="unique_words"
                  stroke="#E8A87C"
                  strokeWidth={2.5}
                  dot={{ fill: '#8B6F47', r: 3 }}
                  name={t('dash.unique.words')}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[15px] leading-relaxed text-text-dark">{t('dash.no.data')}</p>
          )}
        </div>

        {/* Trends */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">{t('dash.trends')}</h3>
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-0.5 text-[13px] text-text-light">{t('dash.semantic.richness')}</p>
              <p className={`text-base font-bold ${semTrend.colorClass}`}>{semTrend.text}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[13px] text-text-light">{t('dash.response.latency')}</p>
              <p className={`text-base font-bold ${latTrend.colorClass}`}>{latTrend.text}</p>
            </div>
          </div>
        </div>

        {/* Latest gazette */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">{t('dash.latest.gazette')}</h3>
          {data.latestGazette ? (
            <>
              <p className="text-[15px] leading-relaxed text-text-dark">{data.latestGazette.title}</p>
              <p className="text-[13px] text-text-light">{data.latestGazette.date}</p>
              <Link href="/dashboard/gazettes" className="mt-auto pt-2 text-sm font-bold text-brown-light no-underline hover:underline">
                {t('dash.view.gazettes')}
              </Link>
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-text-dark">{t('dash.no.gazette')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

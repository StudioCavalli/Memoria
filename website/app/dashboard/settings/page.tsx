'use client'

import { useEffect, useState } from 'react'
import {
  resolveSeniorId,
  settingsService,
  seniorsService,
  gdprService,
  pairingService,
} from '@/lib/dashboard-api'
import type { components } from '@/lib/api-types'
import { useI18n } from '@/lib/i18n'

type SeniorCreate = components['schemas']['SeniorCreate']

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Profile {
  first_name: string
  last_name: string
  birth_date: string
  birth_place: string
}

interface Schedule {
  days: string[]
  time: string
  duration_minutes: number
}

interface NotifPrefs {
  email_alerts: boolean
  email_gazette: boolean
  push_enabled: boolean
}

interface FamilyMember {
  id: string
  name: string
  email: string
  role: string
}

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

let toastCounter = 0

export default function SettingsPage() {
  const { t } = useI18n()

  const DAYS_OF_WEEK = [
    { key: 'settings.day.mon', value: 'Lundi' },
    { key: 'settings.day.tue', value: 'Mardi' },
    { key: 'settings.day.wed', value: 'Mercredi' },
    { key: 'settings.day.thu', value: 'Jeudi' },
    { key: 'settings.day.fri', value: 'Vendredi' },
    { key: 'settings.day.sat', value: 'Samedi' },
    { key: 'settings.day.sun', value: 'Dimanche' },
  ]

  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
  })
  const [schedule, setSchedule] = useState<Schedule>({
    days: [],
    time: '10:00',
    duration_minutes: 30,
  })
  const [notifs, setNotifs] = useState<NotifPrefs>({
    email_alerts: true,
    email_gazette: true,
    push_enabled: false,
  })
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [seniorId, setSeniorId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [savingNotifs, setSavingNotifs] = useState(false)

  // Pairing
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [settingsPin, setSettingsPin] = useState<string | null>(null)
  const [pairingLoading, setPairingLoading] = useState(false)

  // Senior creation (when no senior exists)
  const [showCreateSenior, setShowCreateSenior] = useState(false)
  const [newSenior, setNewSenior] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
  })
  const [creatingSenior, setCreatingSenior] = useState(false)

  const addToast = (message: string, type: ToastType) => {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((tt) => tt.id !== id))
    }, 3000)
  }

  useEffect(() => {
    resolveSeniorId().then(setSeniorId).catch(() => {
      setSeniorId(null)
      setError(true)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!seniorId) return
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const [profRes, schedRes, notifRes, famRes] = await Promise.allSettled([
          seniorsService.get(seniorId),
          settingsService.getSchedule(seniorId),
          settingsService.getNotificationPrefs(),
          settingsService.getFamilyMembers(seniorId),
        ])
        if (profRes.status === 'fulfilled') {
          const d = profRes.value.data // SeniorResponse (typed)
          setProfile({
            first_name: d.first_name || '',
            last_name: d.last_name || '',
            birth_date: d.birth_date || '',
            birth_place: d.birth_place || '',
          })
        }
        // schedule + family_members are typed (SeniorDetailResponse).
        if (schedRes.status === 'fulfilled') {
          const d = schedRes.value.data
          setSchedule({ days: d.days, time: d.time, duration_minutes: d.duration_minutes })
        }
        // notification prefs are the one still-loose feature: there's no backend
        // model for them yet (they always fall back to defaults) → narrow cast.
        if (notifRes.status === 'fulfilled') {
          const d = notifRes.value.data as { email_alerts?: boolean; email_gazette?: boolean; push_enabled?: boolean }
          setNotifs({
            email_alerts: d.email_alerts ?? true,
            email_gazette: d.email_gazette ?? true,
            push_enabled: d.push_enabled ?? false,
          })
        }
        if (famRes.status === 'fulfilled') {
          setFamily(famRes.value.data.map((m) => ({ ...m, id: String(m.id) })))
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [seniorId])

  const saveProfile = async () => {
    if (!seniorId) return
    setSavingProfile(true)
    try {
      await settingsService.updateProfile(seniorId, { ...profile })
      addToast(t('settings.toast.profile.ok'), 'success')
    } catch {
      addToast(t('settings.toast.profile.err'), 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const saveSchedule = async () => {
    if (!seniorId) return
    setSavingSchedule(true)
    try {
      await settingsService.updateSchedule(seniorId, { ...schedule })
      addToast(t('settings.toast.schedule.ok'), 'success')
    } catch {
      addToast(t('settings.toast.schedule.err'), 'error')
    } finally {
      setSavingSchedule(false)
    }
  }

  const saveNotifs = async () => {
    setSavingNotifs(true)
    try {
      await settingsService.updateNotificationPrefs({ ...notifs })
      addToast(t('settings.toast.notif.ok'), 'success')
    } catch {
      addToast(t('settings.toast.notif.err'), 'error')
    } finally {
      setSavingNotifs(false)
    }
  }

  const handleExportData = async () => {
    try {
      const res = await gdprService.exportData()
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'memoria-export.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast(t('settings.toast.export.ok'), 'success')
    } catch {
      addToast(t('settings.toast.export.err'), 'error')
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    try {
      await gdprService.deleteAccount()
      localStorage.clear()
      window.location.href = '/login'
    } catch {
      addToast(t('settings.toast.delete.err'), 'error')
      setDeleteConfirm(false)
    }
  }

  const handleGeneratePairingCode = async () => {
    if (!seniorId) return
    setPairingLoading(true)
    try {
      const res = await pairingService.generateCode(seniorId)
      const d = res.data
      setPairingCode(d.code)
      setSettingsPin(d.settings_pin || null)
      addToast(t('settings.pairing.toast.ok'), 'success')
    } catch {
      addToast(t('settings.pairing.toast.err'), 'error')
    } finally {
      setPairingLoading(false)
    }
  }

  const handleCreateSenior = async () => {
    if (!newSenior.first_name.trim() || !newSenior.last_name.trim()) {
      addToast(t('settings.createsenior.toast.empty'), 'error')
      return
    }
    setCreatingSenior(true)
    try {
      const payload: SeniorCreate = {
        first_name: newSenior.first_name.trim(),
        last_name: newSenior.last_name.trim(),
      }
      if (newSenior.birth_date) payload.birth_date = newSenior.birth_date
      if (newSenior.birth_place) payload.birth_place = newSenior.birth_place
      const res = await seniorsService.create(payload)
      const id = String(res.data.id)
      localStorage.setItem('memoria_senior_id', id)
      setSeniorId(id)
      setShowCreateSenior(false)
      setNewSenior({ first_name: '', last_name: '', birth_date: '', birth_place: '' })
      addToast(t('settings.createsenior.toast.ok'), 'success')
      // Reload profile data
      setProfile({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        birth_date: res.data.birth_date || '',
        birth_place: res.data.birth_place || '',
      })
    } catch {
      addToast(t('settings.createsenior.toast.err'), 'error')
    } finally {
      setCreatingSenior(false)
    }
  }

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }))
  }

  if (loading) {
    return <p className="p-8 text-text-muted">{t('dash.loading')}</p>
  }

  if (error && !seniorId) {
    return (
      <div className="p-8">
        <h2 className="mb-1 font-heading text-[28px] text-text-dark">{t('settings.title')}</h2>
        <p className="mb-7 text-[15px] text-text-muted">{t('settings.subtitle')}</p>

        <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-text-dark">{t('settings.createsenior.title')}</h3>
          <p className="mb-4 text-sm text-text-muted">{t('settings.createsenior.desc')}</p>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
              {t('settings.firstname')} *
              <input
                type="text"
                value={newSenior.first_name}
                onChange={(e) => setNewSenior((s) => ({ ...s, first_name: e.target.value }))}
                className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
              {t('settings.lastname')} *
              <input
                type="text"
                value={newSenior.last_name}
                onChange={(e) => setNewSenior((s) => ({ ...s, last_name: e.target.value }))}
                className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
              {t('settings.birthdate')}
              <input
                type="date"
                value={newSenior.birth_date}
                onChange={(e) => setNewSenior((s) => ({ ...s, birth_date: e.target.value }))}
                className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
              {t('settings.birthplace')}
              <input
                type="text"
                value={newSenior.birth_place}
                onChange={(e) => setNewSenior((s) => ({ ...s, birth_place: e.target.value }))}
                className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
              />
            </label>
          </div>
          <button
            className="rounded-[10px] border-none bg-brown-light px-6 py-2.5 font-body text-sm font-bold text-white cursor-pointer transition-colors duration-200 hover:bg-brown-dark disabled:opacity-60"
            onClick={handleCreateSenior}
            disabled={creatingSenior}
          >
            {creatingSenior ? t('settings.saving') : t('settings.createsenior.submit')}
          </button>
        </section>
      </div>
    )
  }

  return (
    <div>
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
          {toasts.map((tt) => (
            <div
              key={tt.id}
              className={`rounded-[10px] border px-5 py-3 font-body text-sm font-semibold shadow-lg ${
                tt.type === 'success'
                  ? 'border-green-light bg-success-bg text-green-dark'
                  : 'border-red-500 bg-error-bg text-error-text'
              }`}
            >
              {tt.message}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-1 font-heading text-[28px] text-text-dark">{t('settings.title')}</h2>
      <p className="mb-7 text-[15px] text-text-muted">
        {t('settings.subtitle')}
      </p>

      {/* Senior profile */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">{t('settings.profile')}</h3>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            {t('settings.firstname')}
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, first_name: e.target.value }))
              }
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            {t('settings.lastname')}
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, last_name: e.target.value }))
              }
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            {t('settings.birthdate')}
            <input
              type="date"
              value={profile.birth_date}
              onChange={(e) =>
                setProfile((p) => ({ ...p, birth_date: e.target.value }))
              }
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            {t('settings.birthplace')}
            <input
              type="text"
              value={profile.birth_place}
              onChange={(e) =>
                setProfile((p) => ({ ...p, birth_place: e.target.value }))
              }
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
            />
          </label>
        </div>
        <div className="flex items-center gap-3.5">
          <button
            className="rounded-[10px] border-none bg-brown-light px-6 py-2.5 font-body text-sm font-bold text-white cursor-pointer transition-colors duration-200 hover:bg-brown-dark disabled:opacity-60"
            onClick={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </section>

      {/* Session schedule */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">{t('settings.schedule')}</h3>
        <p className="mb-3 text-sm text-text-muted">
          {t('settings.schedule.desc')}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              onClick={() => toggleDay(day.value)}
              className={`rounded-full border px-3.5 py-2 font-body text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                schedule.days.includes(day.value)
                  ? 'border-brown-light bg-brown-light text-white'
                  : 'border-beige bg-white text-text-muted hover:bg-cream'
              }`}
            >
              {t(day.key).slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            {t('settings.time')}
            <input
              type="time"
              value={schedule.time}
              onChange={(e) =>
                setSchedule((s) => ({ ...s, time: e.target.value }))
              }
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            {t('settings.duration')}
            <input
              type="number"
              min={10}
              max={120}
              value={schedule.duration_minutes}
              onChange={(e) =>
                setSchedule((s) => ({
                  ...s,
                  duration_minutes: parseInt(e.target.value) || 30,
                }))
              }
              className="rounded-[10px] border border-beige bg-cream px-3.5 py-2.5 font-body text-[15px] outline-none focus:border-orange-soft"
            />
          </label>
        </div>
        <div className="flex items-center gap-3.5">
          <button
            className="rounded-[10px] border-none bg-brown-light px-6 py-2.5 font-body text-sm font-bold text-white cursor-pointer transition-colors duration-200 hover:bg-brown-dark disabled:opacity-60"
            onClick={saveSchedule}
            disabled={savingSchedule}
          >
            {savingSchedule ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </section>

      {/* Notification preferences */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">{t('settings.notifications')}</h3>
        <div className="mb-4 flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-text-dark">
            <input
              type="checkbox"
              checked={notifs.email_alerts}
              onChange={(e) =>
                setNotifs((n) => ({ ...n, email_alerts: e.target.checked }))
              }
              className="h-[18px] w-[18px] accent-brown-light"
            />
            {t('settings.notif.email.alerts')}
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-text-dark">
            <input
              type="checkbox"
              checked={notifs.email_gazette}
              onChange={(e) =>
                setNotifs((n) => ({ ...n, email_gazette: e.target.checked }))
              }
              className="h-[18px] w-[18px] accent-brown-light"
            />
            {t('settings.notif.email.gazette')}
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-text-dark">
            <input
              type="checkbox"
              checked={notifs.push_enabled}
              onChange={(e) =>
                setNotifs((n) => ({ ...n, push_enabled: e.target.checked }))
              }
              className="h-[18px] w-[18px] accent-brown-light"
            />
            {t('settings.notif.push')}
          </label>
        </div>
        <div className="flex items-center gap-3.5">
          <button
            className="rounded-[10px] border-none bg-brown-light px-6 py-2.5 font-body text-sm font-bold text-white cursor-pointer transition-colors duration-200 hover:bg-brown-dark disabled:opacity-60"
            onClick={saveNotifs}
            disabled={savingNotifs}
          >
            {savingNotifs ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </section>

      {/* Family members */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">{t('settings.family')}</h3>
        {family.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t('settings.family.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {family.map((m) => (
              <div key={m.id} className="flex items-center gap-3.5 rounded-[10px] bg-cream px-4 py-3">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-orange-soft text-lg font-bold text-white">
                  {(m.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-text-dark">{m.name}</p>
                  <p className="text-[13px] text-text-muted">{m.email}</p>
                  {m.role && <p className="text-xs font-semibold text-text-light">{m.role}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tablet pairing */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">{t('settings.pairing.title')}</h3>
        <p className="mb-4 text-sm text-text-muted">{t('settings.pairing.desc')}</p>

        {pairingCode ? (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-cream p-6">
            <p className="text-sm font-semibold text-text-muted">{t('settings.pairing.instruction')}</p>
            <p className="font-mono text-[48px] font-bold tracking-[0.3em] text-brown-dark">
              {pairingCode}
            </p>
            <p className="text-sm text-text-muted">{t('settings.pairing.expires')}</p>
            {settingsPin && (
              <div className="mt-3 rounded-lg bg-white border border-brown/10 px-4 py-2 text-center">
                <p className="text-xs text-text-muted">{t('settings.pairing.pin_label')}</p>
                <p className="font-mono text-2xl font-bold text-brown tracking-widest">{settingsPin}</p>
                <p className="text-xs text-text-muted mt-1">{t('settings.pairing.pin_hint')}</p>
              </div>
            )}
            <button
              className="mt-2 rounded-[10px] border border-brown-light bg-white px-6 py-2.5 font-body text-sm font-bold text-brown-light cursor-pointer hover:bg-cream"
              onClick={() => { setPairingCode(null); setSettingsPin(null); }}
            >
              {t('settings.pairing.dismiss')}
            </button>
          </div>
        ) : (
          <button
            className="rounded-[10px] border-none bg-brown-light px-6 py-2.5 font-body text-sm font-bold text-white cursor-pointer transition-colors duration-200 hover:bg-brown-dark disabled:opacity-60"
            onClick={handleGeneratePairingCode}
            disabled={pairingLoading}
          >
            {pairingLoading ? t('settings.saving') : t('settings.pairing.generate')}
          </button>
        )}
      </section>

      {/* GDPR section */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">{t('settings.gdpr')}</h3>
        <p className="mb-3 text-sm text-text-muted">
          {t('settings.gdpr.desc')}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className="rounded-[10px] border border-brown-light bg-white px-6 py-2.5 font-body text-sm font-bold text-brown-light cursor-pointer hover:bg-cream"
            onClick={handleExportData}
          >
            {t('settings.export')}
          </button>
          <button
            className={`rounded-[10px] border border-red-500 px-6 py-2.5 font-body text-sm font-bold cursor-pointer transition-colors duration-200 ${
              deleteConfirm
                ? 'bg-error-text text-white'
                : 'bg-error-bg text-error-text'
            }`}
            onClick={handleDeleteAccount}
          >
            {deleteConfirm
              ? t('settings.delete.confirm')
              : t('settings.delete')}
          </button>
          {deleteConfirm && (
            <button
              className="rounded-[10px] border border-beige bg-white px-6 py-2.5 font-body text-sm font-semibold text-text-muted cursor-pointer hover:bg-cream"
              onClick={() => setDeleteConfirm(false)}
            >
              {t('settings.delete.cancel')}
            </button>
          )}
        </div>
        {deleteConfirm && (
          <p className="mt-2 text-[13px] text-error-text">
            {t('settings.delete.warning')}
          </p>
        )}
      </section>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import {
  resolveSeniorId,
  settingsService,
  seniorsService,
  gdprService,
} from '@/lib/dashboard-api'

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

const DAYS_OF_WEEK = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
]

let toastCounter = 0

export default function SettingsPage() {
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

  const addToast = (message: string, type: ToastType) => {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
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
          const d = profRes.value.data as any
          setProfile({
            first_name: d.first_name || '',
            last_name: d.last_name || '',
            birth_date: d.birth_date || '',
            birth_place: d.birth_place || '',
          })
        }
        if (schedRes.status === 'fulfilled') {
          const d = schedRes.value.data as any
          setSchedule({
            days: d.days || [],
            time: d.time || '10:00',
            duration_minutes: d.duration_minutes ?? 30,
          })
        }
        if (notifRes.status === 'fulfilled') {
          const d = notifRes.value.data as any
          setNotifs({
            email_alerts: d.email_alerts ?? true,
            email_gazette: d.email_gazette ?? true,
            push_enabled: d.push_enabled ?? false,
          })
        }
        if (famRes.status === 'fulfilled') {
          const d = famRes.value.data as any
          setFamily(Array.isArray(d) ? d : d.items ?? [])
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
      addToast('Profil sauvegardé avec succès.', 'success')
    } catch {
      addToast('Erreur lors de la sauvegarde du profil.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const saveSchedule = async () => {
    if (!seniorId) return
    setSavingSchedule(true)
    try {
      await settingsService.updateSchedule(seniorId, { ...schedule })
      addToast('Planning sauvegardé avec succès.', 'success')
    } catch {
      addToast('Erreur lors de la sauvegarde du planning.', 'error')
    } finally {
      setSavingSchedule(false)
    }
  }

  const saveNotifs = async () => {
    setSavingNotifs(true)
    try {
      await settingsService.updateNotificationPrefs({ ...notifs })
      addToast('Préférences de notification sauvegardées.', 'success')
    } catch {
      addToast('Erreur lors de la sauvegarde des notifications.', 'error')
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
      addToast('Export téléchargé avec succès.', 'success')
    } catch {
      addToast("Erreur lors de l'export des données.", 'error')
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
      addToast('Erreur lors de la suppression du compte.', 'error')
      setDeleteConfirm(false)
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
    return <p className="p-8 text-text-muted">Chargement...</p>
  }

  if (error && !seniorId) {
    return (
      <p className="p-8 text-red-500">
        Erreur lors du chargement des paramètres.
      </p>
    )
  }

  return (
    <div>
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-[10px] border px-5 py-3 font-body text-sm font-semibold shadow-lg ${
                t.type === 'success'
                  ? 'border-green-light bg-success-bg text-green-dark'
                  : 'border-red-500 bg-error-bg text-error-text'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-1 font-heading text-[28px] text-text-dark">Paramètres</h2>
      <p className="mb-7 text-[15px] text-text-muted">
        Gérez le profil de votre proche et vos préférences.
      </p>

      {/* Senior profile */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">Profil du proche</h3>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            Prénom
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
            Nom de famille
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
            Date de naissance
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
            Lieu de naissance
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
            {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </section>

      {/* Session schedule */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">Planning des sessions</h3>
        <p className="mb-3 text-sm text-text-muted">
          Choisissez les jours et l{"'"}heure des sessions de réminiscence.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`rounded-full border px-3.5 py-2 font-body text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                schedule.days.includes(day)
                  ? 'border-brown-light bg-brown-light text-white'
                  : 'border-beige bg-white text-text-muted hover:bg-cream'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-dark">
            Heure
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
            Durée (minutes)
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
            {savingSchedule ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </section>

      {/* Notification preferences */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">Notifications</h3>
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
            Recevoir les alertes par e-mail
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
            Recevoir les gazettes par e-mail
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
            Notifications push (navigateur)
          </label>
        </div>
        <div className="flex items-center gap-3.5">
          <button
            className="rounded-[10px] border-none bg-brown-light px-6 py-2.5 font-body text-sm font-bold text-white cursor-pointer transition-colors duration-200 hover:bg-brown-dark disabled:opacity-60"
            onClick={saveNotifs}
            disabled={savingNotifs}
          >
            {savingNotifs ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </section>

      {/* Family members */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">Membres de la famille</h3>
        {family.length === 0 ? (
          <p className="text-sm text-text-muted">
            Aucun membre ajouté pour l{"'"}instant.
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

      {/* GDPR section */}
      <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-dark">Données personnelles (RGPD)</h3>
        <p className="mb-3 text-sm text-text-muted">
          Conformément au RGPD, vous pouvez exporter ou supprimer vos données à tout moment.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className="rounded-[10px] border border-brown-light bg-white px-6 py-2.5 font-body text-sm font-bold text-brown-light cursor-pointer hover:bg-cream"
            onClick={handleExportData}
          >
            Exporter mes données
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
              ? 'Confirmer la suppression définitive'
              : 'Supprimer mon compte'}
          </button>
          {deleteConfirm && (
            <button
              className="rounded-[10px] border border-beige bg-white px-6 py-2.5 font-body text-sm font-semibold text-text-muted cursor-pointer hover:bg-cream"
              onClick={() => setDeleteConfirm(false)}
            >
              Annuler
            </button>
          )}
        </div>
        {deleteConfirm && (
          <p className="mt-2 text-[13px] text-error-text">
            Attention : cette action est irréversible. Toutes vos données seront
            définitivement supprimées.
          </p>
        )}
      </section>
    </div>
  )
}

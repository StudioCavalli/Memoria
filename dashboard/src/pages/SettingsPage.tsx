import React, { useEffect, useState } from 'react';
import { settingsService, seniorsService } from '../services/api';

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default';

interface Profile {
  first_name: string;
  last_name: string;
  birth_date: string;
}

interface Schedule {
  days: string[];
  time: string;
  duration_minutes: number;
}

interface NotifPrefs {
  email_alerts: boolean;
  email_gazette: boolean;
  push_enabled: boolean;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile>({ first_name: '', last_name: '', birth_date: '' });
  const [schedule, setSchedule] = useState<Schedule>({
    days: [],
    time: '10:00',
    duration_minutes: 30,
  });
  const [notifs, setNotifs] = useState<NotifPrefs>({
    email_alerts: true,
    email_gazette: true,
    push_enabled: false,
  });
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const load = async () => {
      const sid = SENIOR_ID();
      try {
        const [profRes, schedRes, notifRes, famRes] = await Promise.allSettled([
          seniorsService.get(sid),
          settingsService.getSchedule(sid),
          settingsService.getNotificationPrefs(),
          settingsService.getFamilyMembers(sid),
        ]);
        if (profRes.status === 'fulfilled') {
          const d = profRes.value.data;
          setProfile({
            first_name: d.first_name || '',
            last_name: d.last_name || '',
            birth_date: d.birth_date || '',
          });
        }
        if (schedRes.status === 'fulfilled') {
          const d = schedRes.value.data;
          setSchedule({
            days: d.days || [],
            time: d.time || '10:00',
            duration_minutes: d.duration_minutes ?? 30,
          });
        }
        if (notifRes.status === 'fulfilled') {
          const d = notifRes.value.data;
          setNotifs({
            email_alerts: d.email_alerts ?? true,
            email_gazette: d.email_gazette ?? true,
            push_enabled: d.push_enabled ?? false,
          });
        }
        if (famRes.status === 'fulfilled') {
          setFamily(famRes.value.data.items || famRes.value.data || []);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showSaved = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(''), 2500);
  };

  const saveProfile = async () => {
    try {
      await seniorsService.update(SENIOR_ID(), profile);
      showSaved('profile');
    } catch {
      alert('Erreur lors de la sauvegarde du profil.');
    }
  };

  const saveSchedule = async () => {
    try {
      await settingsService.updateSchedule(SENIOR_ID(), schedule);
      showSaved('schedule');
    } catch {
      alert('Erreur lors de la sauvegarde du planning.');
    }
  };

  const saveNotifs = async () => {
    try {
      await settingsService.updateNotificationPrefs(notifs);
      showSaved('notifs');
    } catch {
      alert('Erreur lors de la sauvegarde des notifications.');
    }
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  if (loading) {
    return <p style={{ padding: 32, color: '#7A6555' }}>Chargement...</p>;
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Paramètres</h2>
      <p style={styles.subtitle}>
        Gérez le profil de votre proche et vos préférences.
      </p>

      {/* Senior profile */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Profil du proche</h3>
        <div style={styles.formGrid}>
          <label style={styles.label}>
            Prénom
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Nom de famille
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Date de naissance
            <input
              type="date"
              value={profile.birth_date}
              onChange={(e) =>
                setProfile((p) => ({ ...p, birth_date: e.target.value }))
              }
              style={styles.input}
            />
          </label>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.saveBtn} onClick={saveProfile}>
            Enregistrer
          </button>
          {saved === 'profile' && (
            <span style={styles.savedMsg}>Sauvegardé !</span>
          )}
        </div>
      </section>

      {/* Session schedule */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Planning des sessions</h3>
        <p style={styles.hint}>
          Choisissez les jours et l'heure des sessions de réminiscence.
        </p>
        <div style={styles.daysRow}>
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              style={{
                ...styles.dayBtn,
                ...(schedule.days.includes(day) ? styles.dayBtnActive : {}),
              }}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div style={styles.formGrid}>
          <label style={styles.label}>
            Heure
            <input
              type="time"
              value={schedule.time}
              onChange={(e) =>
                setSchedule((s) => ({ ...s, time: e.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
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
              style={styles.input}
            />
          </label>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.saveBtn} onClick={saveSchedule}>
            Enregistrer
          </button>
          {saved === 'schedule' && (
            <span style={styles.savedMsg}>Sauvegardé !</span>
          )}
        </div>
      </section>

      {/* Notification preferences */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Notifications</h3>
        <div style={styles.checkGroup}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={notifs.email_alerts}
              onChange={(e) =>
                setNotifs((n) => ({ ...n, email_alerts: e.target.checked }))
              }
              style={styles.checkbox}
            />
            Recevoir les alertes par e-mail
          </label>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={notifs.email_gazette}
              onChange={(e) =>
                setNotifs((n) => ({ ...n, email_gazette: e.target.checked }))
              }
              style={styles.checkbox}
            />
            Recevoir les gazettes par e-mail
          </label>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={notifs.push_enabled}
              onChange={(e) =>
                setNotifs((n) => ({ ...n, push_enabled: e.target.checked }))
              }
              style={styles.checkbox}
            />
            Notifications push (navigateur)
          </label>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.saveBtn} onClick={saveNotifs}>
            Enregistrer
          </button>
          {saved === 'notifs' && (
            <span style={styles.savedMsg}>Sauvegardé !</span>
          )}
        </div>
      </section>

      {/* Family members */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Membres de la famille</h3>
        {family.length === 0 ? (
          <p style={{ color: '#7A6555', fontSize: 14 }}>
            Aucun membre ajouté pour l'instant.
          </p>
        ) : (
          <div style={styles.familyList}>
            {family.map((m) => (
              <div key={m.id} style={styles.familyCard}>
                <div style={styles.avatar}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={styles.familyName}>{m.name}</p>
                  <p style={styles.familyEmail}>{m.email}</p>
                  <p style={styles.familyRole}>{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#3D2C1E',
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: '#7A6555',
    marginBottom: 12,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    color: '#3D2C1E',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #F5E6D3',
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
    outline: 'none',
    backgroundColor: '#FFF8F0',
  },
  daysRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayBtn: {
    padding: '8px 14px',
    borderRadius: 20,
    border: '1px solid #F5E6D3',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    color: '#7A6555',
    transition: 'all 0.2s',
  },
  dayBtnActive: {
    backgroundColor: '#8B6F47',
    color: '#FFFFFF',
    borderColor: '#8B6F47',
  },
  checkGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    fontWeight: 600,
    color: '#3D2C1E',
    cursor: 'pointer',
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: '#8B6F47',
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  saveBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#8B6F47',
    color: '#FFFFFF',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  savedMsg: {
    fontSize: 14,
    fontWeight: 700,
    color: '#7FB069',
  },
  familyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  familyCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 16px',
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    backgroundColor: '#E8A87C',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
  familyName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#3D2C1E',
  },
  familyEmail: {
    fontSize: 13,
    color: '#7A6555',
  },
  familyRole: {
    fontSize: 12,
    color: '#A89279',
    fontWeight: 600,
  },
};

export default SettingsPage;

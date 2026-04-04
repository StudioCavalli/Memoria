import React, { useEffect, useState, useCallback } from 'react';
import { alertsService } from '../services/api';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
  read: boolean;
}

const SENIOR_ID = () => localStorage.getItem('memoria_senior_id') || 'default';

const SEVERITY_STYLES: Record<string, { bg: string; border: string; label: string; color: string }> = {
  low: { bg: '#F0FAF0', border: '#7FB069', label: 'Faible', color: '#3D7A28' },
  medium: { bg: '#FFF8EB', border: '#E6B333', label: 'Moyen', color: '#92700C' },
  high: { bg: '#FDE8E8', border: '#D14343', label: 'Élevé', color: '#B91C1C' },
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await alertsService.list(SENIOR_ID(), showUnreadOnly);
      setAlerts(data.items || data || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [showUnreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (alertId: string) => {
    try {
      await alertsService.markRead(SENIOR_ID(), alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
      );
    } catch {
      // silently fail
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>
            Alertes
            {unreadCount > 0 && (
              <span style={styles.unreadBadge}>{unreadCount}</span>
            )}
          </h2>
          <p style={styles.subtitle}>
            Notifications concernant la santé cognitive de votre proche.
          </p>
        </div>
        <label style={styles.filterLabel}>
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            style={styles.checkbox}
          />
          Non lues uniquement
        </label>
      </div>

      {loading ? (
        <p style={{ color: '#7A6555', padding: 20 }}>Chargement...</p>
      ) : alerts.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Aucune alerte pour le moment. Tout va bien !</p>
        </div>
      ) : (
        <div style={styles.list}>
          {alerts.map((alert) => {
            const sev = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
            return (
              <div
                key={alert.id}
                style={{
                  ...styles.card,
                  borderLeft: `4px solid ${sev.border}`,
                  backgroundColor: alert.read ? '#FFFFFF' : sev.bg,
                  opacity: alert.read ? 0.75 : 1,
                }}
              >
                <div style={styles.cardTop}>
                  <span
                    style={{
                      ...styles.severityBadge,
                      backgroundColor: sev.border + '22',
                      color: sev.color,
                    }}
                  >
                    {sev.label}
                  </span>
                  <span style={styles.date}>{alert.created_at}</span>
                </div>
                <h3 style={styles.cardTitle}>{alert.title}</h3>
                <p style={styles.cardMessage}>{alert.message}</p>
                {!alert.read && (
                  <button
                    style={styles.markReadBtn}
                    onClick={() => handleMarkRead(alert.id)}
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: "'Merriweather', serif",
    fontSize: 28,
    color: '#3D2C1E',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  subtitle: {
    color: '#7A6555',
    fontSize: 15,
  },
  unreadBadge: {
    backgroundColor: '#D97706',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    borderRadius: 99,
    padding: '2px 10px',
    lineHeight: '20px',
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#7A6555',
    cursor: 'pointer',
    paddingTop: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: '#8B6F47',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    borderRadius: 12,
    padding: '18px 22px',
    boxShadow: '0 2px 12px rgba(139,111,71,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 10,
  },
  date: {
    fontSize: 13,
    color: '#A89279',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#3D2C1E',
  },
  cardMessage: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#5C4A3A',
  },
  markReadBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    padding: '6px 16px',
    borderRadius: 8,
    border: '1px solid #F5E6D3',
    backgroundColor: '#FFFFFF',
    fontFamily: "'Nunito', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#8B6F47',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: 40,
    color: '#7FB069',
    fontSize: 16,
    fontWeight: 600,
    backgroundColor: '#F0FAF0',
    borderRadius: 14,
  },
};

export default AlertsPage;

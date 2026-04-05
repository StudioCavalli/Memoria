import React, { useEffect, useState, useCallback, useRef } from 'react';
import { resolveSeniorId, alertsService, authService } from '../services/api';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
  read: boolean;
}

const SEVERITY_MAP: Record<
  string,
  { bgClass: string; borderColor: string; label: string; badgeBg: string; badgeText: string }
> = {
  low: {
    bgClass: 'bg-success-bg',
    borderColor: '#7FB069',
    label: 'Faible',
    badgeBg: 'bg-green-light/15',
    badgeText: 'text-green-dark',
  },
  medium: {
    bgClass: 'bg-[#FFF8EB]',
    borderColor: '#E6B333',
    label: 'Moyen',
    badgeBg: 'bg-yellow-warm/15',
    badgeText: 'text-yellow-dark',
  },
  high: {
    bgClass: 'bg-error-bg',
    borderColor: '#D14343',
    label: 'Élevé',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-error-text',
  },
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [seniorId, setSeniorId] = useState<string | null>(null);
  const [wsBanner, setWsBanner] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    resolveSeniorId().then(setSeniorId).catch(() => setSeniorId(null));
  }, []);

  const load = useCallback(async () => {
    if (!seniorId) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await alertsService.list(seniorId, showUnreadOnly);
      const items: Alert[] = Array.isArray(data) ? data : data.items ?? data.results ?? [];
      setAlerts(items);
    } catch {
      setAlerts([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [seniorId, showUnreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = async () => {
      try {
        const meRes = await authService.me();
        const userId = meRes.data.id;
        if (!userId) return;

        const wsUrl = `ws://localhost:8000/ws/dashboard/${userId}`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'new_alert') {
              setWsBanner(true);
            }
          } catch {
            // Ignore non-JSON messages
          }
        };

        ws.onerror = () => {};
      } catch {
        // auth/me failed, no WS
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleMarkRead = async (alertId: string) => {
    if (!seniorId) return;
    try {
      await alertsService.markRead(seniorId, alertId);
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
      {/* WebSocket banner */}
      {wsBanner && (
        <div className="mb-[18px] flex items-center gap-3 rounded-[10px] border border-yellow-warm bg-[#FFF8EB] px-[18px] py-2.5 text-sm font-semibold text-yellow-dark">
          <span>Nouvelle alerte reçue</span>
          <button
            className="rounded-lg border border-yellow-warm bg-white px-3.5 py-1 font-body text-[13px] font-bold text-brown-light cursor-pointer"
            onClick={() => {
              setWsBanner(false);
              load();
            }}
          >
            Rafraîchir
          </button>
          <button
            className="ml-auto rounded-md border-none bg-transparent p-1 text-base font-bold text-text-light cursor-pointer"
            onClick={() => setWsBanner(false)}
            aria-label="Fermer"
          >
            x
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2.5 font-heading text-[28px] text-text-dark">
            Alertes
            {unreadCount > 0 && (
              <span className="rounded-full bg-amber-warm px-2.5 py-0.5 font-body text-[13px] font-bold leading-5 text-white">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-[15px] text-text-muted">
            Notifications concernant la santé cognitive de votre proche.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 pt-2 text-sm font-semibold text-text-muted">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="h-4 w-4 accent-brown-light"
          />
          Non lues uniquement
        </label>
      </div>

      {loading ? (
        <p className="p-5 text-text-muted">Chargement...</p>
      ) : error ? (
        <p className="p-5 text-red-500">
          Erreur lors du chargement des alertes.
        </p>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl bg-success-bg p-10 text-center text-base font-semibold text-green-light">
          <p>Aucune alerte pour le moment. Tout va bien !</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {alerts.map((alert) => {
            const sev = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.low;
            return (
              <div
                key={alert.id}
                className={`flex flex-col gap-2 rounded-xl border-l-4 px-[22px] py-[18px] shadow-sm ${
                  alert.read ? 'bg-white opacity-75' : sev.bgClass
                }`}
                style={{ borderLeftColor: sev.borderColor }}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-[10px] px-2.5 py-[3px] text-xs font-bold ${sev.badgeBg} ${sev.badgeText}`}>
                    {sev.label}
                  </span>
                  <span className="text-[13px] text-text-light">
                    {alert.created_at
                      ? new Date(alert.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-dark">{alert.title}</h3>
                <p className="text-sm leading-relaxed text-text-dark/80">{alert.message}</p>
                {!alert.read && (
                  <button
                    className="mt-1 self-start rounded-lg border border-beige bg-white px-4 py-1.5 font-body text-[13px] font-semibold text-brown-light cursor-pointer hover:bg-cream"
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

export default AlertsPage;

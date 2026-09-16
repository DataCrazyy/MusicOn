import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { createPortal } from 'react-dom';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@/lib/notifications';

type Props = {
  onClose: () => void;
  onRead: () => void;
};

function timeAgo(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Centro de notificaciones (55/56): panel lateral en escritorio, bottom sheet en
 * mobile — mismo lenguaje visual que HelpFaqModal. Cada notificación lleva a su
 * contexto exacto (Chat, Solicitud o Contrato) en vez de forzar a buscarlo a mano.
 */
export default function NotificationsPanel({ onClose, onRead }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listNotifications(user.id)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleClick(n: AppNotification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      onRead();
    }
    onClose();
    if (n.link) navigate(n.link);
  }

  async function handleMarkAll() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    onRead();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-bg-base/70 backdrop-blur-[2px] sm:items-stretch sm:justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-card border border-line bg-bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-full sm:max-h-none sm:w-[400px] sm:max-w-[90vw] sm:rounded-none sm:rounded-l-card sm:border-y-0 sm:border-r-0 sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-primary">
            <Bell className="h-5 w-5 text-lime" /> Notificaciones
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-bg-raised"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.some((n) => !n.read) && (
          <div className="flex-shrink-0 border-b border-line px-5 py-2">
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-xs font-semibold text-ink-muted hover:text-ink-primary"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : items.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-ink-muted">Todavía no tienes notificaciones.</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full rounded-lg border px-3.5 py-3 text-left text-sm transition ${
                      n.read
                        ? 'border-line bg-bg-base text-ink-muted hover:border-lime/30'
                        : 'border-lime/30 bg-lime/5 text-ink-primary hover:border-lime/50'
                    }`}
                  >
                    <p className="font-semibold">{n.message}</p>
                    <p className="mt-1 text-[11px] text-ink-muted">{timeAgo(n.created_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

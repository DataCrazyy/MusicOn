import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { countUnreadNotifications } from './notifications';

/** Contador de notificaciones sin leer para la campana del Navbar — mismo patrón que
 * useUnreadCount (mensajes), con refresco periódico y al volver a la pestaña. */
export function useUnreadNotifications(): [number, () => void] {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  async function refresh() {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      const c = await countUnreadNotifications(user.id);
      setCount(c);
    } catch {
      // silencioso: el badge no es crítico
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 20000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return [count, refresh];
}

import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { listUnreadBookingIds } from './messages';

export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let cancelled = false;

    async function refresh() {
      try {
        const ids = await listUnreadBookingIds(user!.id);
        if (!cancelled) setCount(ids.size);
      } catch {
        // silencioso: el badge de no-leídos no es crítico
      }
    }

    refresh();
    const interval = setInterval(refresh, 20000);
    window.addEventListener('focus', refresh);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [user]);

  return count;
}

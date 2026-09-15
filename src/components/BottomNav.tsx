import { Link, useLocation } from 'react-router-dom';
import { Compass, ClipboardList, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useUnreadCount } from '@/lib/useUnreadCount';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const unread = useUnreadCount();

  const tabs = [
    { to: '/explore', label: 'Explorar', icon: Compass, badge: false },
    { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList, badge: false },
    { to: user ? '/chat' : '/login', label: 'Chat', icon: MessageCircle, badge: unread > 0 },
    { to: user ? '/cuenta' : '/login', label: 'Cuenta', icon: User, badge: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-bg-surface/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ to, label, icon: Icon, badge }) => {
          const active = location.pathname.startsWith(to.split('?')[0]) && to !== '/login';
          return (
            <Link
              key={label}
              to={to}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition ${
                active ? 'text-lime' : 'text-ink-muted'
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {badge && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-lime" />}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

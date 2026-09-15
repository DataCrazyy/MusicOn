import { Link, useLocation } from 'react-router-dom';
import { Compass, ClipboardList, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const tabs = [
    { to: '/explore', label: 'Explorar', icon: Compass },
    { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList },
    { to: user ? '/cuenta' : '/login', label: 'Cuenta', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-bg-surface/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to.split('?')[0]) && to !== '/login';
          return (
            <Link
              key={label}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition ${
                active ? 'text-lime' : 'text-ink-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

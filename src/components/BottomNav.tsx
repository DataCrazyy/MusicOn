import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Sparkles } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/client', label: 'Perfil', icon: User },
  { to: '/pro', label: 'Pro', icon: Sparkles },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-bg-surface/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
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

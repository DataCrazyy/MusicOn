import { Link, useLocation } from 'react-router-dom';
import { Music2, Compass, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const NAV_ITEMS = [
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList },
];

export default function Navbar() {
  const location = useLocation();
  const { user, profile } = useAuth();

  const initials = (profile?.full_name || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (location.pathname === '/') return null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime">
            <Music2 className="h-5 w-5 text-bg-base" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-ink-primary">
            Music<span className="text-lime">On</span>
          </span>
        </Link>

        {/* Links de escritorio */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-bg-raised text-lime' : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Cuenta — escritorio */}
        <div className="hidden md:flex">
          {user ? (
            <Link
              to="/cuenta"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-bg-raised text-sm font-bold text-ink-primary ring-1 ring-line transition hover:ring-lime"
              title="Mi cuenta"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Mi cuenta" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-pill bg-lime px-4 py-2 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Cuenta — mobile (la nav inferior maneja la navegación principal) */}
        <Link
          to={user ? '/cuenta' : '/login'}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-bg-raised text-sm font-bold text-ink-primary ring-1 ring-line transition hover:ring-lime md:hidden"
        >
          {user ? (
            profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Mi cuenta" className="h-full w-full object-cover" />
            ) : (
              initials
            )
          ) : (
            '?'
          )}
        </Link>
      </div>
    </header>
  );
}

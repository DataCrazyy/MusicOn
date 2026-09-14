import { Link, useLocation } from 'react-router-dom';
import { Music2, Compass, MessageCircle, Shield, LayoutDashboard, Menu, X, Gift } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/escrow', label: 'Escrow', icon: Shield },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/referidos', label: 'Referidos', icon: Gift },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

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

        {/* Desktop nav links */}
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

        {/* Desktop right actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/pro"
            className="rounded-pill bg-lime px-4 py-2 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
          >
            Go Pro
          </Link>
          <Link
            to="/client"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-sm font-bold text-ink-primary ring-1 ring-line transition hover:ring-lime"
          >
            JD
          </Link>
        </div>

        {/* Mobile: only avatar, no links (bottom nav handles navigation) */}
        <Link
          to="/client"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-sm font-bold text-ink-primary ring-1 ring-line transition hover:ring-lime md:hidden"
        >
          JD
        </Link>
      </div>
    </header>
  );
}

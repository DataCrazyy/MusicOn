import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { saveIntendedPath } from '@/lib/authRedirect';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-muted">
        Cargando...
      </div>
    );
  }

  if (!user) {
    // 67: se guarda a dónde quería llegar el usuario (perfil de artista, reserva en
    // curso, solicitud, etc.) para volver ahí — no a la home — después de loguearse.
    // sessionStorage sobrevive incluso al redirect completo de página de Google OAuth.
    saveIntendedPath(location.pathname + location.search);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && !profile.onboarded && location.pathname !== '/bienvenida') {
    return <Navigate to="/bienvenida" replace />;
  }

  return <>{children}</>;
}

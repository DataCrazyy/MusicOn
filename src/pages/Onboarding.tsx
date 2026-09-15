import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Search, Mic2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { completeOnboarding } from '@/lib/profile';

type Role = 'client' | 'artist';

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const suggestedName =
    profile?.full_name || (user?.user_metadata?.full_name as string | undefined) || (user?.user_metadata?.name as string | undefined) || '';
  const googleAvatar =
    (user?.user_metadata?.avatar_url as string | undefined) || (user?.user_metadata?.picture as string | undefined) || null;

  const [nickname, setNickname] = useState(suggestedName);
  const [role, setRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !nickname.trim() || !role) return;

    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding(user.id, {
        full_name: nickname.trim(),
        role,
        avatar_url: profile?.avatar_url ? null : googleAvatar,
      });
      await refreshProfile();
      navigate(role === 'artist' ? '/artista/nuevo' : '/explore', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tus datos. Probá de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-line bg-bg-surface p-8">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime">
            <Music2 className="h-5 w-5 text-bg-base" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-ink-primary">
            Music<span className="text-lime">On</span>
          </span>
        </div>

        <h1 className="text-center font-display text-xl font-bold text-ink-primary">¡Bienvenido/a!</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">Contanos un poco de vos para arrancar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Elegí tu nombre o nickname</label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Como querés que te vean"
              className="w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-ink-muted">¿Qué querés hacer en MusicOn?</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`flex flex-col items-center gap-2 rounded-card border p-5 text-center transition ${
                  role === 'client' ? 'border-lime bg-lime/10' : 'border-line bg-bg-base hover:border-lime/40'
                }`}
              >
                <Search className={`h-6 w-6 ${role === 'client' ? 'text-lime' : 'text-ink-muted'}`} />
                <span className="text-sm font-bold text-ink-primary">Buscar y reservar artistas</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('artist')}
                className={`flex flex-col items-center gap-2 rounded-card border p-5 text-center transition ${
                  role === 'artist' ? 'border-violet bg-violet/10' : 'border-line bg-bg-base hover:border-violet/40'
                }`}
              >
                <Mic2 className={`h-6 w-6 ${role === 'artist' ? 'text-violet' : 'text-ink-muted'}`} />
                <span className="text-sm font-bold text-ink-primary">Soy artista o tengo una banda</span>
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !nickname.trim() || !role}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}

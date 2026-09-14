import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Music2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

type Mode = 'login' | 'signup';

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    await signInWithGoogle();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'signup') {
      setSignupDone(true);
      return;
    }

    navigate(from, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-bg-surface p-8">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime">
            <Music2 className="h-5 w-5 text-bg-base" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-ink-primary">
            Music<span className="text-lime">On</span>
          </span>
        </div>

        {signupDone ? (
          <div className="text-center">
            <p className="text-sm text-ink-primary">
              Te mandamos un mail para confirmar tu cuenta. Confirmalo y después volvé para iniciar sesión.
            </p>
            <button
              onClick={() => {
                setSignupDone(false);
                setMode('login');
              }}
              className="mt-4 text-sm font-semibold text-lime hover:underline"
            >
              Volver a iniciar sesión
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex rounded-pill bg-bg-raised p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-pill py-2 text-sm font-bold transition ${
                  mode === 'login' ? 'bg-lime text-bg-base' : 'text-ink-muted'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 rounded-pill py-2 text-sm font-bold transition ${
                  mode === 'signup' ? 'bg-lime text-bg-base' : 'text-ink-muted'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-muted">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
                    placeholder="Juan Pérez"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-muted">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
                  placeholder="vos@email.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-muted">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink-muted">o</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-pill border border-line bg-bg-base px-4 py-3 text-sm font-bold text-ink-primary transition hover:border-lime/40 disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.09C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.28a12 12 0 0 0 0 10.78z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.61l4.01 3.09C6.23 6.86 8.88 4.75 12 4.75z" />
                </svg>
              )}
              Continuar con Google
            </button>
          </>
        )}

        <p className="mt-6 text-center text-xs text-ink-muted">
          <Link to="/explore" className="hover:text-lime">
            Seguir explorando sin cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, LogOut, Mic2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { updateProfileName, updateProfileAvatar, uploadAvatarPhoto } from '@/lib/profile';
import { getArtistByOwner, type DbArtist } from '@/lib/artists';
import { supabase } from '@/lib/supabase';

export default function Account() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const isGoogleAccount = user?.app_metadata?.provider === 'google';

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [myArtist, setMyArtist] = useState<DbArtist | null>(null);
  const [checkingArtist, setCheckingArtist] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  useEffect(() => {
    if (!user) return;
    getArtistByOwner(user.id)
      .then(setMyArtist)
      .catch(() => setMyArtist(null))
      .finally(() => setCheckingArtist(false));
  }, [user]);

  const initials = (profile?.full_name || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!user || !fullName.trim()) return;
    setSavingName(true);
    setNameSaved(false);
    try {
      await updateProfileName(user.id, fullName.trim());
      await refreshProfile();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadAvatarPhoto(user.id, file);
      await updateProfileAvatar(user.id, url);
      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg('Contraseña actualizada');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-primary">Mi cuenta</h1>

      {/* Foto y nombre */}
      <div className="mt-6 rounded-card border border-line bg-bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-bg-raised text-lg font-bold text-ink-primary ring-1 ring-line">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-lime text-bg-base ring-2 ring-bg-surface">
              {avatarUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-ink-primary">{profile?.full_name || 'Sin nombre'}</p>
            <p className="text-sm text-ink-muted">{user.email}</p>
            <p className="mt-1 inline-block rounded-pill bg-bg-raised px-2 py-0.5 text-xs font-medium text-ink-muted">
              {profile?.role === 'artist' ? 'Artista' : 'Cliente'}
            </p>
          </div>
        </div>
        {avatarError && <p className="mt-2 text-sm text-red-500">{avatarError}</p>}

        <form onSubmit={handleSaveName} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre"
            className="flex-1 rounded-pill border border-line bg-bg-base px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
          />
          <button
            type="submit"
            disabled={savingName || !fullName.trim()}
            className="rounded-pill bg-lime px-4 py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-50"
          >
            {savingName ? 'Guardando...' : nameSaved ? 'Guardado ✓' : 'Guardar nombre'}
          </button>
        </form>
      </div>

      {/* Perfil de artista */}
      <div className="mt-4 rounded-card border border-line bg-bg-surface p-6">
        {checkingArtist ? (
          <p className="text-sm text-ink-muted">Cargando...</p>
        ) : myArtist ? (
          <>
            <p className="font-semibold text-ink-primary">Tu perfil de artista</p>
            <p className="mt-1 text-sm text-ink-muted">{myArtist.name} · {myArtist.city}</p>
            <button
              onClick={() => navigate('/artista/nuevo')}
              className="mt-3 flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-sm font-bold text-ink-primary transition hover:border-lime/40"
            >
              <Mic2 className="h-4 w-4" /> Editar mi perfil de artista
            </button>
          </>
        ) : (
          <>
            <p className="font-semibold text-ink-primary">¿Sos artista o tenés una banda?</p>
            <p className="mt-1 text-sm text-ink-muted">Publicá tu perfil gratis y empezá a recibir solicitudes.</p>
            <button
              onClick={() => navigate('/artista/nuevo')}
              className="mt-3 flex items-center gap-2 rounded-pill bg-violet px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-dark"
            >
              <Mic2 className="h-4 w-4" /> Publicar mi perfil
            </button>
          </>
        )}
      </div>

      {/* Contraseña */}
      {!isGoogleAccount && (
        <div className="mt-4 rounded-card border border-line bg-bg-surface p-6">
          <p className="font-semibold text-ink-primary">Cambiar contraseña</p>
          <form onSubmit={handleChangePassword} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="flex-1 rounded-pill border border-line bg-bg-base px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
            />
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="rounded-pill bg-bg-raised px-4 py-2.5 text-sm font-bold text-ink-primary ring-1 ring-line transition hover:ring-lime disabled:opacity-50"
            >
              {savingPassword ? 'Guardando...' : 'Actualizar'}
            </button>
          </form>
          {passwordMsg && <p className="mt-2 text-sm text-lime">{passwordMsg}</p>}
          {passwordError && <p className="mt-2 text-sm text-red-500">{passwordError}</p>}
        </div>
      )}
      {isGoogleAccount && (
        <p className="mt-4 text-center text-sm text-ink-muted">Iniciaste sesión con Google — la contraseña se administra desde tu cuenta de Google.</p>
      )}

      <button
        onClick={handleSignOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-pill border border-line bg-bg-surface px-4 py-3 text-sm font-bold text-ink-muted transition hover:text-ink-primary"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </div>
  );
}

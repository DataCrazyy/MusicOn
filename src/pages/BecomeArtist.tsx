import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Sparkles, Pencil, ImagePlus, X, Plus, Music, Youtube } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  createArtist,
  updateArtist,
  getArtistByOwner,
  uploadArtistPhoto,
  type DbArtist,
} from '@/lib/artists';
import { ARTIST_GENRES, BOLIVIA_CITIES, BIO_MAX_LENGTH } from '@/lib/constants';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

const MAX_PHOTO_MB = 5;
const MAX_GALLERY_PHOTOS = 8;

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

export default function BecomeArtist() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState<DbArtist | null>(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [genre, setGenre] = useState<string>(ARTIST_GENRES[0]);
  const [city, setCity] = useState(BOLIVIA_CITIES[0]);
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [priceFrom, setPriceFrom] = useState('');
  const [pricePer, setPricePer] = useState<'hour' | 'event'>('event');
  const [durationHours, setDurationHours] = useState('');
  const [members, setMembers] = useState('1');
  const [travelRadiusKm, setTravelRadiusKm] = useState('50');
  const [tagsInput, setTagsInput] = useState('');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getArtistByOwner(user.id)
      .then(setExisting)
      .finally(() => setChecking(false));
  }, [user]);

  function loadIntoForm(artist: DbArtist | null) {
    setName(artist?.name ?? '');
    setGenre(artist?.genre ?? ARTIST_GENRES[0]);
    setCity(artist?.city ?? BOLIVIA_CITIES[0]);
    setBio(artist?.bio ?? '');
    setPhotoPreview(artist?.photo_url ?? null);
    setPhotoFile(null);
    setPriceFrom(artist ? String(artist.price_from) : '');
    setPricePer(artist?.price_per ?? 'event');
    setDurationHours(artist?.duration_hours ? String(artist.duration_hours) : '');
    setMembers(artist ? String(artist.members) : '1');
    setTravelRadiusKm(artist ? String(artist.travel_radius_km) : '50');
    setTagsInput(artist?.tags?.join(', ') ?? '');
    setBlockedDates(artist?.blocked_dates ?? []);
    setWeeklyOffDays(artist?.weekly_off_days ?? []);
    setGalleryUrls(artist?.gallery_urls ?? []);
    setSpotifyUrl(artist?.spotify_url ?? '');
    setYoutubeUrl(artist?.youtube_url ?? '');
  }

  function startEditing() {
    loadIntoForm(existing);
    setEditing(true);
  }

  function acceptFile(file: File | undefined | null) {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Subí un archivo de imagen (JPG, PNG o WEBP).');
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`La imagen no puede pesar más de ${MAX_PHOTO_MB}MB.`);
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0]);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  function removePhoto(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  function toggleBlockedDate(dateStr: string) {
    setBlockedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()
    );
  }

  function toggleWeekday(value: number) {
    setWeeklyOffDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()
    );
  }

  async function handleGalleryFiles(files: FileList | null) {
    if (!files || !user) return;
    setGalleryError(null);

    const room = MAX_GALLERY_PHOTOS - galleryUrls.length;
    if (room <= 0) {
      setGalleryError(`Máximo ${MAX_GALLERY_PHOTOS} fotos en la galería.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, room);
    setGalleryUploading(true);
    try {
      for (const file of toUpload) {
        if (!file.type.startsWith('image/')) {
          setGalleryError('Solo se pueden subir imágenes (JPG, PNG o WEBP).');
          continue;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
          setGalleryError(`Cada imagen puede pesar hasta ${MAX_PHOTO_MB}MB.`);
          continue;
        }
        const url = await uploadArtistPhoto(user.id, file);
        setGalleryUrls((prev) => [...prev, url]);
      }
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : 'No pudimos subir alguna foto. Probá de nuevo.');
    } finally {
      setGalleryUploading(false);
    }
  }

  function removeGalleryUrl(url: string) {
    setGalleryUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);

    try {
      let photoUrl = existing?.photo_url ?? '';
      if (photoFile) {
        photoUrl = await uploadArtistPhoto(user.id, photoFile);
      }
      if (!photoUrl) {
        setError('Subí una foto de perfil.');
        setSubmitting(false);
        return;
      }

      const input = {
        name,
        genre,
        city,
        bio,
        photo_url: photoUrl,
        price_from: Number(priceFrom),
        price_per: pricePer,
        duration_hours: pricePer === 'hour' && durationHours ? Number(durationHours) : null,
        members: Number(members),
        travel_radius_km: Number(travelRadiusKm),
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        blocked_dates: blockedDates,
        weekly_off_days: weeklyOffDays,
        gallery_urls: galleryUrls,
        spotify_url: spotifyUrl.trim(),
        youtube_url: youtubeUrl.trim(),
      };

      const artist = existing ? await updateArtist(existing.id, input) : await createArtist(user.id, input);
      navigate(`/profile/${artist.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error al guardar el perfil de artista:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'No pudimos guardar tu perfil. Revisá tu conexión e intentá de nuevo.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    );
  }

  if (existing && !editing) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <Sparkles className="h-10 w-10 text-lime" />
        <h1 className="font-display text-2xl font-bold text-ink-primary">Ya tenés tu perfil de artista</h1>
        <p className="text-sm text-ink-muted">
          Tu ficha "{existing.name}" ya está publicada en MusicOn.
        </p>
        <div className="flex gap-3">
          <Link
            to={`/profile/${existing.id}`}
            className="rounded-pill bg-lime px-6 py-3 font-bold text-bg-base hover:bg-lime-dark"
          >
            Ver mi perfil
          </Link>
          <button
            onClick={startEditing}
            className="flex items-center gap-2 rounded-pill border border-line px-6 py-3 font-bold text-ink-primary hover:border-lime/40"
          >
            <Pencil className="h-4 w-4" /> Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl font-bold text-ink-primary">
          {existing ? 'Editar tu perfil de artista' : 'Creá tu perfil de artista'}
        </h1>
        <p className="mb-8 text-sm text-ink-muted">
          {existing
            ? 'Actualizá tus datos cuando quieras.'
            : 'Completá tus datos para que la gente te pueda encontrar y contratar en MusicOn.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo dropzone — estilo Airbnb */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-muted">Foto de perfil</label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`group relative flex aspect-square w-full max-w-[240px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
                dragActive ? 'border-lime bg-lime/5' : 'border-line bg-bg-surface'
              }`}
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-bg-base/0 opacity-0 transition group-hover:bg-bg-base/60 group-hover:opacity-100">
                    <label className="cursor-pointer rounded-pill bg-bg-base px-3 py-1.5 text-xs font-bold text-ink-primary hover:bg-bg-raised">
                      Cambiar
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="flex items-center gap-1 rounded-pill bg-bg-base px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-bg-raised"
                    >
                      <X className="h-3.5 w-3.5" /> Quitar
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-raised">
                    <ImagePlus className="h-5 w-5 text-ink-muted" />
                  </div>
                  <span className="text-sm font-semibold text-ink-primary">Arrastrá una foto acá</span>
                  <span className="text-xs text-ink-muted">o hacé clic para elegir un archivo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>

            <p className="mt-2 text-xs text-ink-muted">JPG, PNG o WEBP. Hasta {MAX_PHOTO_MB}MB.</p>
            {photoError && <p className="mt-1 text-xs text-red-400">{photoError}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Nombre artístico</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Ej: Banda Los Ceibos"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Género</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              >
                {ARTIST_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Ciudad</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              >
                {BOLIVIA_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold text-ink-muted">Bio</label>
              <span className={`text-xs ${bio.length >= BIO_MAX_LENGTH ? 'text-red-400' : 'text-ink-muted'}`}>
                {bio.length}/{BIO_MAX_LENGTH}
              </span>
            </div>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
              maxLength={BIO_MAX_LENGTH}
              rows={3}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Contá tu experiencia, estilo, para qué tipo de eventos tocás..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Precio desde (USD)</label>
              <input
                required
                type="number"
                min="0"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Por</label>
              <select
                value={pricePer}
                onChange={(e) => setPricePer(e.target.value as 'hour' | 'event')}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              >
                <option value="event">Evento</option>
                <option value="hour">Hora</option>
              </select>
            </div>
          </div>

          {pricePer === 'hour' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">
                Duración estimada del show (horas)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
                placeholder="Ej: 3"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Así el cliente sabe cuántas horas suele durar tu show y calcula el costo total.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Integrantes</label>
              <input
                type="number"
                min="1"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Radio de viaje (km)</label>
              <input
                type="number"
                min="0"
                value={travelRadiusKm}
                onChange={(e) => setTravelRadiusKm(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-muted">
              Días de la semana que no atendés
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleWeekday(d.value)}
                  className={`rounded-pill border px-3 py-1.5 text-xs font-semibold transition ${
                    weeklyOffDays.includes(d.value)
                      ? 'border-ink-muted/40 bg-bg-raised text-ink-muted'
                      : 'border-line text-ink-primary hover:border-lime/40'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Esos días van a aparecer en gris para los clientes, todas las semanas.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-muted">
              Fechas puntuales ya ocupadas
            </label>
            <AvailabilityCalendar
              blockedDates={blockedDates}
              weeklyOffDays={weeklyOffDays}
              onToggle={toggleBlockedDate}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-muted">
              Galería de fotos ({galleryUrls.length}/{MAX_GALLERY_PHOTOS})
            </label>
            <div className="flex flex-wrap gap-3">
              {galleryUrls.map((url) => (
                <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-line">
                  <img src={url} alt="Foto de la galería" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryUrl(url)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-bg-base/80 text-red-400 opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {galleryUrls.length < MAX_GALLERY_PHOTOS && (
                <label
                  className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-ink-muted hover:border-lime/40 ${
                    galleryUploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {galleryUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span className="text-[10px]">Agregar</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleGalleryFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              Mostrale a la gente fotos de tus shows anteriores. Hasta {MAX_GALLERY_PHOTOS} fotos.
            </p>
            {galleryError && <p className="mt-1 text-xs text-red-400">{galleryError}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                <Music className="h-3.5 w-3.5" /> Link de Spotify (opcional)
              </label>
              <input
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
                placeholder="https://open.spotify.com/artist/..."
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                <Youtube className="h-3.5 w-3.5" /> Link de YouTube (opcional)
              </label>
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">
              Etiquetas (separadas por coma)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Bodas, Corporativo, Fiestas privadas"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {existing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-pill border border-line px-6 py-3 text-sm font-bold text-ink-primary hover:border-lime/40"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {existing ? 'Guardar cambios' : 'Publicar mi perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

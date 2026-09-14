import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getArtistById, type DbArtist } from '@/lib/artists';
import { createBookingRequest } from '@/lib/bookings';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

const EVENT_TYPES = ['Boda', 'Corporativo', 'Fiesta privada', 'Cumpleaños', 'Otro'];

const GUEST_RANGES = [
  'Menos de 50',
  '50 - 100',
  '100 - 200',
  '200 - 500',
  'Más de 500',
];

export default function RequestBooking() {
  const { artistId } = useParams<{ artistId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [artist, setArtist] = useState<DbArtist | null>(null);
  const [loading, setLoading] = useState(true);

  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [venue, setVenue] = useState('');
  const [guestRange, setGuestRange] = useState(GUEST_RANGES[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!artistId) return;
    getArtistById(artistId)
      .then(setArtist)
      .finally(() => setLoading(false));
  }, [artistId]);

  const isDateOccupied = !!artist?.blocked_dates?.includes(eventDate);
  const isWeeklyOff =
    !!eventDate &&
    !!artist?.weekly_off_days?.includes(new Date(`${eventDate}T00:00:00`).getDay());
  const isDateBlocked = isDateOccupied || isWeeklyOff;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !artist) return;
    setError(null);

    if (!eventDate) {
      setError('Elegí una fecha en el calendario.');
      return;
    }
    if (isDateOccupied || isWeeklyOff) {
      setError(`Esa fecha ya no está disponible para ${artist.name}. Elegí otra en el calendario.`);
      return;
    }

    setSubmitting(true);
    try {
      await createBookingRequest(user.id, artist.id, artist.price_from, {
        event_type: eventType,
        event_date: eventDate,
        start_time: startTime,
        venue,
        guest_range: guestRange,
        notes,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu solicitud. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-ink-muted">
        <p>No encontramos este artista.</p>
        <Link to="/explore" className="text-lime hover:underline">
          Volver a explorar
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-lime" />
        <h1 className="font-display text-2xl font-bold text-ink-primary">Solicitud enviada</h1>
        <p className="text-sm text-ink-muted">
          Le avisamos a {artist.name}. Vas a ver el estado de tu pedido en "Mis solicitudes".
        </p>
        <Link
          to="/solicitudes"
          className="rounded-pill bg-lime px-6 py-3 font-bold text-bg-base hover:bg-lime-dark"
        >
          Ver mis solicitudes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <Link
          to={`/profile/${artist.id}`}
          className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al perfil
        </Link>

        <div className="mb-6 flex items-center gap-3 rounded-card border border-line bg-bg-surface p-4">
          <img
            src={artist.photo_url ?? undefined}
            alt={artist.name}
            className="h-14 w-14 rounded-lg object-cover"
          />
          <div>
            <p className="font-display text-lg font-bold text-ink-primary">{artist.name}</p>
            <p className="text-sm text-ink-muted">
              ${artist.price_from}/{artist.price_per === 'hour' ? 'hora' : 'evento'} · {artist.city}
            </p>
          </div>
        </div>

        <h1 className="mb-2 font-display text-2xl font-bold text-ink-primary">Pedir una reserva</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Esto es una solicitud — {artist.name} la va a poder aceptar o rechazar. Todavía no se cobra nada.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Tipo de evento</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">
              Fecha del evento — elegí un día libre
            </label>
            <AvailabilityCalendar
              blockedDates={artist.blocked_dates ?? []}
              weeklyOffDays={artist.weekly_off_days ?? []}
              selectedDate={eventDate}
              onSelect={setEventDate}
            />
            {!eventDate && (
              <p className="mt-1 text-xs text-ink-muted">Todavía no elegiste una fecha.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Hora del evento</label>
            <input
              required
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Dirección completa del lugar</label>
            <input
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Ej: Salón Los Tajibos, Av. San Martín #123, Santa Cruz"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Dale la dirección exacta — el artista la necesita para decidir si acepta.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Cantidad de invitados</label>
            <select
              value={guestRange}
              onChange={(e) => setGuestRange(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
            >
              {GUEST_RANGES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Consultas o detalles extra (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Algo más que el artista deba saber antes de responder..."
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !eventDate || isDateBlocked}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar solicitud
          </button>
        </form>
      </div>
    </div>
  );
}

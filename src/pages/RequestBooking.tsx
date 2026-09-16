import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getArtistById, type DbArtist } from '@/lib/artists';
import { formatPrice, computeEndTime } from '@/lib/format';
import { createBookingRequest } from '@/lib/bookings';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import AddressMapField from '@/components/AddressMapField';
import HowItWorksModal from '@/components/HowItWorksModal';

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
  const [eventTypeOther, setEventTypeOther] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [venue, setVenue] = useState('');
  const [venueReference, setVenueReference] = useState('');
  const [eventLat, setEventLat] = useState<number | null>(null);
  const [eventLng, setEventLng] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
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

    if (eventType === 'Otro' && !eventTypeOther.trim()) {
      setError('Especifica el tipo de evento.');
      return;
    }
    if (!eventDate) {
      setError('Elige una fecha en el calendario.');
      return;
    }
    if (!durationHours || Number(durationHours) <= 0) {
      setError('Indica la duración estimada del show en horas.');
      return;
    }
    if (isDateOccupied || isWeeklyOff) {
      setError(`Esa fecha ya no está disponible para ${artist.name}. Elige otra en el calendario.`);
      return;
    }

    setSubmitting(true);
    try {
      await createBookingRequest(user.id, artist.id, artist.price_from, {
        event_type: eventType === 'Otro' ? eventTypeOther.trim() : eventType,
        event_date: eventDate,
        start_time: startTime,
        venue,
        venue_reference: venueReference,
        event_lat: eventLat,
        event_lng: eventLng,
        duration_hours: durationHours ? Number(durationHours) : null,
        guest_range: guestRange,
        notes,
      }, artist.owner_id);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu solicitud. Prueba de nuevo.');
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
    <>
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
              {formatPrice(artist.price_from)}/{artist.price_per === 'hour' ? 'hora' : 'evento'} · {artist.city}
            </p>
          </div>
        </div>

        <div className="mb-2 flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink-primary">Pedir una reserva</h1>
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="mt-1 flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-ink-muted hover:text-lime"
          >
            <HelpCircle className="h-3.5 w-3.5" /> ¿Cómo funciona?
          </button>
        </div>
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

          {eventType === 'Otro' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">
                Especifica el tipo de evento
              </label>
              <input
                required
                value={eventTypeOther}
                onChange={(e) => setEventTypeOther(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
                placeholder="Ej: Aniversario, Show privado, Festival"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">
              Fecha del evento — elige un día libre
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

          <AddressMapField
            address={venue}
            onAddressChange={setVenue}
            lat={eventLat}
            lng={eventLng}
            onLocationChange={(lat, lng) => {
              setEventLat(lat);
              setEventLng(lng);
            }}
          />

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">
              Referencia adicional (opcional)
            </label>
            <input
              value={venueReference}
              onChange={(e) => setVenueReference(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Ej: Condominio Las Palmas, bloque B, salón de eventos"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">
              Duración estimada del show (horas)
            </label>
            <input
              required
              type="number"
              min={1}
              step={0.5}
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Ej: 3"
            />
            {startTime && durationHours && Number(durationHours) > 0 && (
              <p className="mt-1 text-xs text-ink-muted">
                Hora estimada de finalización: {computeEndTime(startTime, Number(durationHours))}
              </p>
            )}
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

          <div className="rounded-card border border-line bg-bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold text-ink-primary">Resumen</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Artista</dt>
                <dd className="text-ink-primary">{artist.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Fecha</dt>
                <dd className="text-ink-primary">{eventDate || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Horario</dt>
                <dd className="text-ink-primary">
                  {startTime || '—'}
                  {startTime && durationHours && Number(durationHours) > 0
                    ? ` – ${computeEndTime(startTime, Number(durationHours))}`
                    : ''}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Duración</dt>
                <dd className="text-ink-primary">{durationHours ? `${durationHours} horas` : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Invitados</dt>
                <dd className="text-ink-primary">{guestRange}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold">
                <dt className="text-ink-primary">Precio de referencia</dt>
                <dd className="text-ink-primary">
                  {formatPrice(artist.price_from)}/{artist.price_per === 'hour' ? 'hora' : 'evento'}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-ink-muted">
              Este es el precio publicado por el artista. El precio final se acuerda con él por chat
              antes de confirmar la contratación — todavía no se realiza ningún cobro.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !eventDate || isDateBlocked || !durationHours}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar solicitud
          </button>
        </form>
      </div>
    </div>
    {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
    </>
  );
}

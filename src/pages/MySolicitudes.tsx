import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, X, Calendar, MapPin, Clock, Users, MessageCircle, ClipboardList, CheckCircle2, Archive, ArchiveRestore, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getArtistByOwner, addBlockedDate, type DbArtist } from '@/lib/artists';
import { formatPrice } from '@/lib/format';
import {
  listBookingsAsClient,
  listBookingsForArtist,
  respondToBooking,
  markBookingCompleted,
  setBookingArchived,
  type BookingWithArtist,
  type BookingWithClient,
  type BookingStatus,
} from '@/lib/bookings';
import { listReviewsByClient, type Review } from '@/lib/reviews';
import ReviewForm from '@/components/ReviewForm';
import StarRating from '@/components/StarRating';
import { listUnreadBookingIds } from '@/lib/messages';
import EmptyState from '@/components/EmptyState';
import { STATUS_LABELS } from '@/lib/bookingStatus';

export default function MySolicitudes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myArtist, setMyArtist] = useState<DbArtist | null>(null);
  const [asClient, setAsClient] = useState<BookingWithArtist[]>([]);
  const [asArtist, setAsArtist] = useState<BookingWithClient[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [reviewsByBooking, setReviewsByBooking] = useState<Record<string, Review>>({});
  const [completingId, setCompletingId] = useState<string | null>(null);

  // id of the booking currently showing the "leave a message" panel for a decision, and which
  // decision it's for
  const [respondingTo, setRespondingTo] = useState<{
    id: string;
    status: BookingStatus;
    artistId: string;
    eventDate: string;
    clientId: string;
  } | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [view, setView] = useState<'client' | 'artist'>('client');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showArchived, setShowArchived] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [clientBookings, artist, unread, myReviews] = await Promise.all([
      listBookingsAsClient(user.id),
      getArtistByOwner(user.id),
      listUnreadBookingIds(user.id),
      listReviewsByClient(user.id),
    ]);
    setAsClient(clientBookings);
    setMyArtist(artist);
    setUnreadIds(unread);
    setReviewsByBooking(Object.fromEntries(myReviews.map((r) => [r.booking_id, r])));
    if (artist) {
      setAsArtist(await listBookingsForArtist(artist.id));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function startRespond(booking: BookingWithClient, status: BookingStatus) {
    setRespondingTo({ id: booking.id, status, artistId: booking.artist_id, eventDate: booking.event_date, clientId: booking.client_id });
    setResponseMsg('');
  }

  async function confirmRespond() {
    if (!respondingTo) return;
    setActingOn(respondingTo.id);
    try {
      await respondToBooking(respondingTo.id, respondingTo.status, responseMsg.trim() || undefined, respondingTo.clientId);
      if (respondingTo.status === 'confirmed') {
        // Bloqueamos esa fecha para que nadie más la pida — se ve en rojo en el calendario.
        await addBlockedDate(respondingTo.artistId, respondingTo.eventDate);
      }
      setRespondingTo(null);
      setResponseMsg('');
      await load();
    } finally {
      setActingOn(null);
    }
  }

  async function handleMarkCompleted(bookingId: string, clientId?: string | null) {
    setCompletingId(bookingId);
    try {
      await markBookingCompleted(bookingId, clientId);
      await load();
    } finally {
      setCompletingId(null);
    }
  }

  async function handleToggleArchive(bookingId: string, role: 'client' | 'artist', archived: boolean) {
    setArchivingId(bookingId);
    try {
      await setBookingArchived(bookingId, role, archived);
      await load();
    } finally {
      setArchivingId(null);
    }
  }


  if (!user) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-7 w-7" />}
        title="Aquí aparecerán tus solicitudes"
        description="Cuando solicites un artista o servicio, podrás consultar aquí el estado de tus solicitudes, contrataciones y reservas."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    );
  }

  // El archivado es independiente por lado (archived_by_client / archived_by_artist):
  // archivar una solicitud no la oculta de la otra parte, solo de tu propia vista.
  // Orden por fecha de solicitud (created_at) -- independiente del orden por fecha de
  // evento que usan Chat y la consulta base, para poder ver "la última que pedí" o
  // "la primera que pedí" en Mis solicitudes.
  function byRequestDate(a: { created_at: string }, b: { created_at: string }) {
    return sortOrder === 'newest' ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at);
  }
  const visibleAsClient = asClient
    .filter((b) => (showArchived ? b.archived_by_client : !b.archived_by_client))
    .filter((b) => statusFilter === 'all' || b.status === statusFilter)
    .sort(byRequestDate);
  const visibleAsArtist = asArtist
    .filter((b) => (showArchived ? b.archived_by_artist : !b.archived_by_artist))
    .filter((b) => statusFilter === 'all' || b.status === statusFilter)
    .sort(byRequestDate);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-ink-primary">Mis solicitudes</h1>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-lime/40 hover:text-ink-primary"
          >
            {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {showArchived ? 'Ver activas' : 'Ver archivadas'}
          </button>
        </div>

        {/* Filtrar por estado y elegir el orden (por fecha en que se pidió, no la
            fecha del evento) -- reemplaza el segmentado "Todas/Mis eventos" por algo
            mas flexible. */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | BookingStatus)}
            className="flex-1 rounded-lg border border-line bg-bg-surface px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
          >
            <option value="all">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortOrder((v) => (v === 'newest' ? 'oldest' : 'newest'))}
            title="Cambiar orden"
            className="flex flex-shrink-0 items-center gap-1.5 rounded-pill border border-line px-3 py-2.5 text-xs font-semibold text-ink-muted transition hover:border-lime/40 hover:text-ink-primary"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortOrder === 'newest' ? 'Más recientes primero' : 'Más antiguas primero'}
          </button>
        </div>

        {/* Filtro Cliente/Artista — solo tiene sentido mostrarlo si el usuario tiene
            ambos roles; si no, no hay nada que filtrar. */}
        {myArtist && (
          <div className="flex gap-2 rounded-pill border border-line bg-bg-surface p-1">
            <button
              type="button"
              onClick={() => setView('client')}
              className={`flex-1 rounded-pill px-4 py-2 text-sm font-bold transition ${
                view === 'client' ? 'bg-lime text-bg-base' : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Como cliente
            </button>
            <button
              type="button"
              onClick={() => setView('artist')}
              className={`flex-1 rounded-pill px-4 py-2 text-sm font-bold transition ${
                view === 'artist' ? 'bg-lime text-bg-base' : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Como artista
            </button>
          </div>
        )}

        <div className={myArtist && view !== 'client' ? 'hidden' : ''}>
          {!myArtist && (
            <h2 className="mb-3 font-display text-lg font-bold text-ink-primary">Como cliente</h2>
          )}
          {visibleAsClient.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {showArchived
                ? 'No tienes solicitudes archivadas.'
                : statusFilter !== 'all'
                  ? `No tienes solicitudes con el estado "${STATUS_LABELS[statusFilter].label}".`
                  : 'Todavía no pediste ninguna reserva.'}
            </p>
          ) : (
            <div className="space-y-3">
              {visibleAsClient.map((b) => (
                <div
                  key={b.id}
                  className="space-y-3 rounded-card border border-line bg-bg-surface p-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={b.artist?.photo_url ?? undefined}
                      alt={b.artist?.name}
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink-primary">{b.artist?.name}</p>
                      <p className="flex items-center gap-1 text-sm text-ink-muted">
                        <Calendar className="h-3.5 w-3.5" /> {b.event_date}
                        {b.start_time && (
                          <>
                            {' '}
                            <Clock className="ml-1 h-3.5 w-3.5" /> {b.start_time}
                          </>
                        )}
                        {' '}· {b.event_type}
                      </p>
                      {b.venue && (
                        <p className="flex items-center gap-1 text-sm text-ink-muted">
                          <MapPin className="h-3.5 w-3.5" /> {b.venue}
                        </p>
                      )}
                      {b.guest_range && (
                        <p className="flex items-center gap-1 text-sm text-ink-muted">
                          <Users className="h-3.5 w-3.5" /> {b.guest_range}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-ink-primary">Precio de referencia: {formatPrice(b.total)}</p>
                      {b.notes && <p className="mt-1 text-sm text-ink-muted">Tu mensaje: "{b.notes}"</p>}
                      {b.artist_response && (b.status === 'confirmed' || b.status === 'cancelled') && (
                        <div
                          className={`mt-2 rounded-lg p-2 text-sm ${
                            b.status === 'confirmed' ? 'bg-lime/10' : 'bg-red-500/10'
                          }`}
                        >
                          <p
                            className={`flex items-center gap-1 text-xs font-bold ${
                              b.status === 'confirmed' ? 'text-lime' : 'text-red-400'
                            }`}
                          >
                            {b.status === 'confirmed' ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            {b.status === 'confirmed'
                              ? `${b.artist?.name} confirmó tu reserva`
                              : `${b.artist?.name} rechazó tu reserva`}
                          </p>
                          <p className="mt-1 text-ink-primary">"{b.artist_response}"</p>
                        </div>
                      )}
                      {b.status === 'confirmed' && (
                        <Link
                          to={`/contrato/${b.id}`}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-lime px-4 py-2 text-xs font-bold text-bg-base hover:bg-lime-dark"
                        >
                          Confirmar contratación
                        </Link>
                      )}
                      {b.status === 'in_escrow' && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Reseña disponible después de completar el servicio.
                        </p>
                      )}
                      {b.status === 'completed' && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-lime">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Servicio realizado — contratación finalizada
                        </p>
                      )}
                      {b.status === 'completed' && b.artist?.owner_id && (
                        reviewsByBooking[b.id] ? (
                          <div className="mt-3 rounded-lg border border-line bg-bg-base p-3">
                            <p className="mb-1 text-xs font-semibold text-ink-muted">Tu reseña</p>
                            <StarRating value={reviewsByBooking[b.id].rating} />
                            {reviewsByBooking[b.id].comment && (
                              <p className="mt-1 text-sm text-ink-muted">"{reviewsByBooking[b.id].comment}"</p>
                            )}
                          </div>
                        ) : (
                          <>
                            <p className="mt-2 text-xs font-semibold text-ink-primary">¿Cómo fue tu experiencia?</p>
                            <ReviewForm
                              bookingId={b.id}
                              artistId={b.artist_id}
                              clientId={b.client_id}
                              artistName={b.artist?.name ?? 'el artista'}
                              onDone={load}
                            />
                          </>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                    <span className={`truncate rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_LABELS[b.status].className}`}>
                      {STATUS_LABELS[b.status].label}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(b.id, 'client', !b.archived_by_client)}
                        disabled={archivingId === b.id}
                        title={b.archived_by_client ? 'Desarchivar' : 'Archivar'}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-lime/40 hover:text-lime disabled:opacity-60"
                      >
                        {archivingId === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : b.archived_by_client ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        to={`/chat?b=${b.id}`}
                        title="Ir al chat de esta solicitud"
                        className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-lime/40 hover:text-lime"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {unreadIds.has(b.id) && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-surface bg-lime" />
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {myArtist && (
          <div className={view !== 'artist' ? 'hidden' : ''}>
            <h2 className="mb-3 font-display text-lg font-bold text-ink-primary">
              Como artista ({myArtist.name})
            </h2>
            {visibleAsArtist.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {showArchived
                  ? 'No tienes solicitudes archivadas.'
                  : statusFilter !== 'all'
                    ? `No tienes solicitudes con el estado "${STATUS_LABELS[statusFilter].label}".`
                    : 'Todavía no recibiste solicitudes.'}
              </p>
            ) : (
              <div className="space-y-3">
                {visibleAsArtist.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col gap-3 rounded-card border border-line bg-bg-surface p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-ink-primary">{b.client?.full_name ?? 'Cliente'}</p>
                        <p className="flex items-center gap-1 text-sm text-ink-muted">
                          <Calendar className="h-3.5 w-3.5" /> {b.event_date}
                          {b.start_time && (
                            <>
                              {' '}
                              <Clock className="ml-1 h-3.5 w-3.5" /> {b.start_time}
                            </>
                          )}
                          {' '}· {b.event_type}
                        </p>
                        {b.venue && (
                          <p className="flex items-center gap-1 text-sm text-ink-muted">
                            <MapPin className="h-3.5 w-3.5" /> {b.venue}
                          </p>
                        )}
                        {b.guest_range && (
                          <p className="flex items-center gap-1 text-sm text-ink-muted">
                            <Users className="h-3.5 w-3.5" /> {b.guest_range}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-semibold text-ink-primary">Precio de referencia: {formatPrice(b.total)}</p>
                        {b.notes && <p className="mt-1 text-sm text-ink-muted">"{b.notes}"</p>}
                        {b.status === 'completed' && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-lime">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Servicio realizado — contratación finalizada
                          </p>
                        )}
                        {/* El cliente ya tenia un boton para llegar al contrato -- el artista no
                            tenia ninguno propio ademas del enlace de una notificacion (74). */}
                        {(b.status === 'confirmed' || b.status === 'in_escrow') && (
                          <Link
                            to={`/contrato/${b.id}`}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-lime px-4 py-2 text-xs font-bold text-bg-base hover:bg-lime-dark"
                          >
                            {b.status === 'confirmed' ? 'Revisar contratación y firmar' : 'Ver contrato'}
                          </Link>
                        )}
                      </div>

                      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                        {b.status === 'pending' && !respondingTo ? (
                          <>
                            <button
                              onClick={() => startRespond(b, 'confirmed')}
                              className="flex items-center gap-1 rounded-pill bg-lime px-4 py-2 text-sm font-bold text-bg-base hover:bg-lime-dark"
                            >
                              <Check className="h-4 w-4" /> Aceptar
                            </button>
                            <button
                              onClick={() => startRespond(b, 'cancelled')}
                              className="flex items-center gap-1 rounded-pill border border-line px-4 py-2 text-sm font-bold text-ink-primary hover:border-red-400/40 hover:text-red-400"
                            >
                              <X className="h-4 w-4" /> Rechazar
                            </button>
                          </>
                        ) : b.status === 'in_escrow' ? (
                          <button
                            onClick={() => handleMarkCompleted(b.id, b.client_id)}
                            disabled={completingId === b.id}
                            className="flex items-center gap-1.5 rounded-pill bg-lime px-4 py-2 text-sm font-bold text-bg-base hover:bg-lime-dark disabled:opacity-60"
                          >
                            {completingId === b.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Marcar servicio como realizado
                          </button>
                        ) : (
                          b.status !== 'pending' && (
                            <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_LABELS[b.status].className}`}>
                              {STATUS_LABELS[b.status].label}
                            </span>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(b.id, 'artist', !b.archived_by_artist)}
                          disabled={archivingId === b.id}
                          title={b.archived_by_artist ? 'Desarchivar' : 'Archivar'}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-lime/40 hover:text-lime disabled:opacity-60"
                        >
                          {archivingId === b.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : b.archived_by_artist ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          to={`/chat?b=${b.id}`}
                          title="Ir al chat de esta solicitud"
                          className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-lime/40 hover:text-lime"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {unreadIds.has(b.id) && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-surface bg-lime" />
                          )}
                        </Link>
                      </div>
                    </div>

                    {respondingTo?.id === b.id && (
                      <div className="rounded-lg border border-line bg-bg-raised p-3">
                        <label className="mb-1 block text-xs font-semibold text-ink-muted">
                          {respondingTo.status === 'confirmed'
                            ? 'Mensaje para el cliente (opcional)'
                            : 'Motivo o mensaje para el cliente (opcional)'}
                        </label>
                        <textarea
                          value={responseMsg}
                          onChange={(e) => setResponseMsg(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                          placeholder={
                            respondingTo.status === 'confirmed'
                              ? 'Ej: Confirmado, llego 30 min antes a armar el equipo.'
                              : 'Ej: Esa fecha ya la tengo ocupada.'
                          }
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={confirmRespond}
                            disabled={actingOn === b.id}
                            className={`flex items-center gap-1 rounded-pill px-4 py-2 text-sm font-bold disabled:opacity-60 ${
                              respondingTo.status === 'confirmed'
                                ? 'bg-lime text-bg-base hover:bg-lime-dark'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            {actingOn === b.id && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirmar {respondingTo.status === 'confirmed' ? 'aceptación' : 'rechazo'}
                          </button>
                          <button
                            onClick={() => setRespondingTo(null)}
                            disabled={actingOn === b.id}
                            className="rounded-pill border border-line px-4 py-2 text-sm font-bold text-ink-primary hover:bg-bg-surface disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

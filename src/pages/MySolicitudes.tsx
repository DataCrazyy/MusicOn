import { useEffect, useState } from 'react';
import { Loader2, Check, X, Calendar, MapPin, Clock, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getArtistByOwner, addBlockedDate, type DbArtist } from '@/lib/artists';
import {
  listBookingsAsClient,
  listBookingsForArtist,
  respondToBooking,
  type BookingWithArtist,
  type BookingWithClient,
  type BookingStatus,
} from '@/lib/bookings';
import { listUnreadBookingIds } from '@/lib/messages';
import BookingMessages from '@/components/BookingMessages';

const STATUS_LABELS: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber/15 text-amber' },
  confirmed: { label: 'Confirmada', className: 'bg-lime/15 text-lime' },
  in_escrow: { label: 'En escrow', className: 'bg-teal/15 text-teal' },
  completed: { label: 'Completada', className: 'bg-bg-raised text-ink-muted' },
  cancelled: { label: 'Rechazada', className: 'bg-red-500/15 text-red-400' },
};

function ChatButton({
  active,
  unread,
  onClick,
}: {
  active: boolean;
  unread: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={active ? 'Cerrar consulta' : 'Consultar'}
      className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition ${
        active ? 'border-lime bg-lime/10 text-lime' : 'border-line text-ink-muted hover:border-lime/40 hover:text-lime'
      }`}
    >
      <MessageCircle className="h-4 w-4" />
      {unread && !active && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-surface bg-lime" />
      )}
    </button>
  );
}

export default function MySolicitudes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myArtist, setMyArtist] = useState<DbArtist | null>(null);
  const [asClient, setAsClient] = useState<BookingWithArtist[]>([]);
  const [asArtist, setAsArtist] = useState<BookingWithClient[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  // id of the booking currently showing the "leave a message" panel for a decision, and which
  // decision it's for
  const [respondingTo, setRespondingTo] = useState<{
    id: string;
    status: BookingStatus;
    artistId: string;
    eventDate: string;
  } | null>(null);
  const [responseMsg, setResponseMsg] = useState('');

  // id of the booking whose message thread ("Consultar") is currently open
  const [openThread, setOpenThread] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [clientBookings, artist, unread] = await Promise.all([
      listBookingsAsClient(user.id),
      getArtistByOwner(user.id),
      listUnreadBookingIds(user.id),
    ]);
    setAsClient(clientBookings);
    setMyArtist(artist);
    setUnreadIds(unread);
    if (artist) {
      setAsArtist(await listBookingsForArtist(artist.id));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function startRespond(booking: BookingWithClient, status: BookingStatus) {
    setRespondingTo({ id: booking.id, status, artistId: booking.artist_id, eventDate: booking.event_date });
    setResponseMsg('');
  }

  async function confirmRespond() {
    if (!respondingTo) return;
    setActingOn(respondingTo.id);
    try {
      await respondToBooking(respondingTo.id, respondingTo.status, responseMsg.trim() || undefined);
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

  function toggleThread(bookingId: string) {
    setOpenThread((prev) => (prev === bookingId ? null : bookingId));
  }

  function clearUnread(bookingId: string) {
    setUnreadIds((prev) => {
      if (!prev.has(bookingId)) return prev;
      const next = new Set(prev);
      next.delete(bookingId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="mb-6 font-display text-3xl font-bold text-ink-primary">Mis solicitudes</h1>

          <h2 className="mb-3 font-display text-lg font-bold text-ink-primary">Como cliente</h2>
          {asClient.length === 0 ? (
            <p className="text-sm text-ink-muted">Todavía no pediste ninguna reserva.</p>
          ) : (
            <div className="space-y-3">
              {asClient.map((b) => (
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
                    <div className="flex-1">
                      <p className="font-bold text-ink-primary">{b.artist?.name}</p>
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
                      <p className="mt-1 text-sm font-semibold text-ink-primary">Precio de referencia: ${b.total}</p>
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
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_LABELS[b.status].className}`}>
                        {STATUS_LABELS[b.status].label}
                      </span>
                      {b.artist?.owner_id && (
                        <ChatButton
                          active={openThread === b.id}
                          unread={unreadIds.has(b.id)}
                          onClick={() => toggleThread(b.id)}
                        />
                      )}
                    </div>
                  </div>

                  {openThread === b.id && b.artist?.owner_id && (
                    <BookingMessages
                      bookingId={b.id}
                      recipientId={b.artist.owner_id}
                      onRead={() => clearUnread(b.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {myArtist && (
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-ink-primary">
              Como artista ({myArtist.name})
            </h2>
            {asArtist.length === 0 ? (
              <p className="text-sm text-ink-muted">Todavía no recibiste solicitudes.</p>
            ) : (
              <div className="space-y-3">
                {asArtist.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col gap-3 rounded-card border border-line bg-bg-surface p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex-1">
                        <p className="font-bold text-ink-primary">{b.client?.full_name ?? 'Cliente'}</p>
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
                        <p className="mt-1 text-sm font-semibold text-ink-primary">Precio de referencia: ${b.total}</p>
                        {b.notes && <p className="mt-1 text-sm text-ink-muted">"{b.notes}"</p>}
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-2">
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
                        ) : (
                          b.status !== 'pending' && (
                            <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_LABELS[b.status].className}`}>
                              {STATUS_LABELS[b.status].label}
                            </span>
                          )
                        )}
                        <ChatButton
                          active={openThread === b.id}
                          unread={unreadIds.has(b.id)}
                          onClick={() => toggleThread(b.id)}
                        />
                      </div>
                    </div>

                    {openThread === b.id && (
                      <BookingMessages
                        bookingId={b.id}
                        recipientId={b.client_id}
                        onRead={() => clearUnread(b.id)}
                      />
                    )}

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

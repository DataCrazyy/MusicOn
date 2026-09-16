import { useEffect, useState } from 'react';
import { Loader2, MessageCircle, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getArtistByOwner, addBlockedDate } from '@/lib/artists';
import {
  listBookingsAsClient,
  listBookingsForArtist,
  respondToBooking,
  type BookingWithArtist,
  type BookingWithClient,
  type BookingStatus,
} from '@/lib/bookings';
import { STATUS_LABELS } from '@/lib/bookingStatus';
import { listUnreadBookingIds } from '@/lib/messages';
import BookingMessages from '@/components/BookingMessages';
import EmptyState from '@/components/EmptyState';

type Conversation = {
  bookingId: string;
  name: string;
  photoUrl: string | null;
  subtitle: string;
  recipientId: string;
  status: BookingStatus;
  /** true si el usuario actual es el artista de esta conversación (puede aceptar/rechazar). */
  isArtistSide: boolean;
  artistId: string;
  eventDate: string;
};

// Se ocultan solo las rechazadas; las pendientes también se muestran, para poder
// negociar y decidir directamente desde el chat sin volver a Solicitudes.
const VISIBLE_STATUSES = new Set(['pending', 'confirmed', 'in_escrow', 'completed']);

const QUICK_REPLIES = [
  '¿Tienes disponibilidad?',
  '¿Cuál es el precio?',
  '¿Incluyes equipo de sonido?',
  '¿Puedes hacer un set personalizado?',
  '¿Viajas a otra ciudad?',
];

export default function Chat() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [responding, setResponding] = useState<'confirmed' | 'cancelled' | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [acting, setActing] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [asClient, myArtist, unread] = await Promise.all([
      listBookingsAsClient(user.id),
      getArtistByOwner(user.id),
      listUnreadBookingIds(user.id),
    ]);

    const asArtist: BookingWithClient[] = myArtist ? await listBookingsForArtist(myArtist.id) : [];

    const clientSide: Conversation[] = (asClient as BookingWithArtist[])
      .filter((b) => VISIBLE_STATUSES.has(b.status) && b.artist?.owner_id)
      .map((b) => ({
        bookingId: b.id,
        name: b.artist!.name,
        photoUrl: b.artist!.photo_url,
        subtitle: `${b.event_type} · ${b.event_date}`,
        recipientId: b.artist!.owner_id!,
        status: b.status,
        isArtistSide: false,
        artistId: b.artist_id,
        eventDate: b.event_date,
      }));

    const artistSide: Conversation[] = asArtist
      .filter((b) => VISIBLE_STATUSES.has(b.status))
      .map((b) => ({
        bookingId: b.id,
        name: b.client?.full_name ?? 'Cliente',
        photoUrl: null,
        subtitle: `${b.event_type} · ${b.event_date}`,
        recipientId: b.client_id,
        status: b.status,
        isArtistSide: true,
        artistId: b.artist_id,
        eventDate: b.event_date,
      }));

    const all = [...clientSide, ...artistSide];
    setConversations(all);
    setUnreadIds(unread);
    setOpenId((prev) => prev ?? (all[0]?.bookingId ?? null));
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

  function clearUnread(bookingId: string) {
    setUnreadIds((prev) => {
      if (!prev.has(bookingId)) return prev;
      const next = new Set(prev);
      next.delete(bookingId);
      return next;
    });
  }

  function startResponding(status: 'confirmed' | 'cancelled') {
    setResponding(status);
    setResponseMsg('');
  }

  async function confirmResponding(active: Conversation) {
    if (!responding) return;
    setActing(true);
    try {
      await respondToBooking(active.bookingId, responding, responseMsg.trim() || undefined);
      if (responding === 'confirmed') {
        // Bloqueamos esa fecha para que nadie más la pida — se ve en rojo en el calendario.
        await addBlockedDate(active.artistId, active.eventDate);
      }
      setResponding(null);
      setResponseMsg('');
      await load();
    } finally {
      setActing(false);
    }
  }

  if (!user) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-7 w-7" />}
        title="Aquí podrás conversar con tus artistas"
        description="Cuando inicies una conversación relacionada con una solicitud, podrás comunicarte directamente con el artista y consultar los detalles del servicio."
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

  const active = conversations.find((c) => c.bookingId === openId) ?? null;

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-7 w-7" />}
        title="Todavía no tienes conversaciones"
        description="Se habilitan aquí apenas envíes o recibas una solicitud. Mientras tanto puedes consultar a los artistas desde tus Solicitudes."
        ctaLabel="Ver mis solicitudes"
        ctaTo="/solicitudes"
      />
    );
  }

  const canRespond = !!active && active.isArtistSide && active.status === 'pending';

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl md:h-[calc(100vh-4rem)]">
      {/* Lista de conversaciones */}
      <div className={`w-full flex-shrink-0 overflow-y-auto border-r border-line bg-bg-base md:w-96 ${active ? 'hidden md:block' : 'block'}`}>
        <h1 className="px-6 pb-4 pt-7 font-display text-2xl font-bold text-ink-primary">Chat</h1>
        <div>
          {conversations.map((c) => (
            <button
              key={c.bookingId}
              onClick={() => {
                setOpenId(c.bookingId);
                setResponding(null);
              }}
              className={`flex w-full items-center gap-3.5 border-b border-line px-6 py-4 text-left transition hover:bg-bg-surface ${
                openId === c.bookingId ? 'bg-bg-surface' : ''
              }`}
            >
              <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-raised">
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <MessageCircle className="h-5 w-5 text-ink-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink-primary">{c.name}</p>
                <p className="truncate text-sm text-ink-muted">{c.subtitle}</p>
              </div>
              {unreadIds.has(c.bookingId) && <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-lime" />}
            </button>
          ))}
        </div>
      </div>

      {/* Hilo activo */}
      <div className={`flex min-w-0 flex-1 flex-col ${active ? 'flex' : 'hidden md:flex'}`}>
        {active ? (
          <>
            <div className="border-b border-line bg-bg-base px-6 py-5">
              <div className="flex items-center gap-3.5">
                <button onClick={() => setOpenId(null)} className="text-ink-muted md:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-raised">
                  {active.photoUrl ? (
                    <img src={active.photoUrl} alt={active.name} className="h-full w-full object-cover" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-ink-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink-primary">{active.name}</p>
                  <p className="truncate text-xs text-ink-muted">{active.subtitle}</p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_LABELS[active.status].className}`}
                >
                  {STATUS_LABELS[active.status].label}
                </span>
              </div>

              {canRespond && !responding && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => startResponding('confirmed')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-lime px-4 py-2.5 text-sm font-bold text-bg-base hover:bg-lime-dark"
                  >
                    <Check className="h-4 w-4" /> Aceptar solicitud
                  </button>
                  <button
                    onClick={() => startResponding('cancelled')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-line px-4 py-2.5 text-sm font-bold text-ink-primary hover:border-red-400/40 hover:text-red-400"
                  >
                    <X className="h-4 w-4" /> Rechazar
                  </button>
                </div>
              )}

              {canRespond && responding && (
                <div className="mt-4 rounded-lg border border-line bg-bg-surface p-3">
                  <p className="mb-2 text-xs font-semibold text-ink-muted">
                    {responding === 'confirmed'
                      ? 'Puedes dejarle un mensaje al cliente antes de aceptar (opcional).'
                      : 'Puedes explicarle al cliente por qué no puedes tomar esta solicitud (opcional).'}
                  </p>
                  <textarea
                    value={responseMsg}
                    onChange={(e) => setResponseMsg(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-line bg-bg-base px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                    placeholder="Escribe un mensaje (opcional)..."
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setResponding(null)}
                      className="flex-1 rounded-pill border border-line px-4 py-2 text-xs font-bold text-ink-primary hover:border-lime/40"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => confirmResponding(active)}
                      disabled={acting}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill px-4 py-2 text-xs font-bold disabled:opacity-60 ${
                        responding === 'confirmed'
                          ? 'bg-lime text-bg-base hover:bg-lime-dark'
                          : 'bg-red-500/90 text-white hover:bg-red-500'
                      }`}
                    >
                      {acting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Confirmar {responding === 'confirmed' ? 'aceptación' : 'rechazo'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden px-6 py-2">
              <BookingMessages
                key={active.bookingId}
                bookingId={active.bookingId}
                recipientId={active.recipientId}
                onRead={() => clearUnread(active.bookingId)}
                suggestions={QUICK_REPLIES}
                bare
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
            Elige una conversación
          </div>
        )}
      </div>
    </div>
  );
}

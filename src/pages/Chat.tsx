import { useEffect, useState } from 'react';
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getArtistByOwner } from '@/lib/artists';
import { listBookingsAsClient, listBookingsForArtist, type BookingWithArtist, type BookingWithClient } from '@/lib/bookings';
import { listUnreadBookingIds } from '@/lib/messages';
import BookingMessages from '@/components/BookingMessages';

type Conversation = {
  bookingId: string;
  name: string;
  photoUrl: string | null;
  subtitle: string;
  recipientId: string;
};

const APPROVED = new Set(['confirmed', 'in_escrow', 'completed']);

const QUICK_REPLIES = [
  '¿Tenés disponibilidad?',
  '¿Cuál es el precio?',
  '¿Incluís equipo de sonido?',
  '¿Podés hacer un set personalizado?',
  '¿Viajás a otra ciudad?',
];

export default function Chat() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

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
      .filter((b) => APPROVED.has(b.status) && b.artist?.owner_id)
      .map((b) => ({
        bookingId: b.id,
        name: b.artist!.name,
        photoUrl: b.artist!.photo_url,
        subtitle: `${b.event_type} · ${b.event_date}`,
        recipientId: b.artist!.owner_id!,
      }));

    const artistSide: Conversation[] = asArtist
      .filter((b) => APPROVED.has(b.status))
      .map((b) => ({
        bookingId: b.id,
        name: b.client?.full_name ?? 'Cliente',
        photoUrl: null,
        subtitle: `${b.event_type} · ${b.event_date}`,
        recipientId: b.client_id,
      }));

    const all = [...clientSide, ...artistSide];
    setConversations(all);
    setUnreadIds(unread);
    setOpenId((prev) => prev ?? (all[0]?.bookingId ?? null));
    setLoading(false);
  }

  useEffect(() => {
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <MessageCircle className="h-8 w-8 text-ink-muted" />
        <p className="font-semibold text-ink-primary">Todavía no tenés conversaciones</p>
        <p className="max-w-sm text-sm text-ink-muted">
          Se habilitan acá apenas una reserva queda confirmada. Mientras tanto podés consultar a los artistas desde tus Solicitudes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl md:h-[calc(100vh-4rem)]">
      {/* Lista de conversaciones */}
      <div className={`w-full flex-shrink-0 overflow-y-auto border-r border-line bg-bg-base md:w-80 ${active ? 'hidden md:block' : 'block'}`}>
        <h1 className="px-4 pb-2 pt-6 font-display text-2xl font-bold text-ink-primary">Chat</h1>
        <div>
          {conversations.map((c) => (
            <button
              key={c.bookingId}
              onClick={() => setOpenId(c.bookingId)}
              className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition hover:bg-bg-surface ${
                openId === c.bookingId ? 'bg-bg-surface' : ''
              }`}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-raised">
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
            <div className="flex items-center gap-3 border-b border-line bg-bg-base px-4 py-4">
              <button onClick={() => setOpenId(null)} className="text-ink-muted md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-raised">
                {active.photoUrl ? (
                  <img src={active.photoUrl} alt={active.name} className="h-full w-full object-cover" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-ink-muted" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-ink-primary">{active.name}</p>
                <p className="truncate text-xs text-ink-muted">{active.subtitle}</p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-4">
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
            Elegí una conversación
          </div>
        )}
      </div>
    </div>
  );
}

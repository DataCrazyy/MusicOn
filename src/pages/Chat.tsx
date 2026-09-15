import { useEffect, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getArtistByOwner, type DbArtist } from '@/lib/artists';
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

    setConversations([...clientSide, ...artistSide]);
    setUnreadIds(unread);
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

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink-primary">Chat</h1>

        {conversations.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Todavía no tenés conversaciones activas. Se habilitan acá apenas una reserva queda confirmada.
          </p>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => (
              <div key={c.bookingId} className="overflow-hidden rounded-card border border-line bg-bg-surface">
                <button
                  onClick={() => setOpenId((prev) => (prev === c.bookingId ? null : c.bookingId))}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-raised">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-ink-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-ink-primary">{c.name}</p>
                    <p className="text-sm text-ink-muted">{c.subtitle}</p>
                  </div>
                  {unreadIds.has(c.bookingId) && openId !== c.bookingId && (
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-lime" />
                  )}
                </button>

                {openId === c.bookingId && (
                  <div className="border-t border-line p-4">
                    <BookingMessages
                      bookingId={c.bookingId}
                      recipientId={c.recipientId}
                      onRead={() => clearUnread(c.bookingId)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

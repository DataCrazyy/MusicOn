import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  listMessages,
  sendMessage,
  subscribeToBookingMessages,
  markThreadRead,
  type BookingMessage,
} from '@/lib/messages';

type Props = {
  bookingId: string;
  recipientId: string;
  onRead?: () => void;
  /** Preguntas rápidas para completar el mensaje con un click (estilo chip). */
  suggestions?: string[];
  /** Cuando es true, ocupa todo el alto disponible del contenedor padre en vez del recuadro chico embebido. */
  bare?: boolean;
};

export default function BookingMessages({ bookingId, recipientId, onRead, suggestions, bare }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMessages(bookingId)
      .then((data) => {
        if (!cancelled) setMessages(data);
        if (user) {
          markThreadRead(bookingId, user.id).then(() => {
            if (!cancelled) onRead?.();
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeToBookingMessages(bookingId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (user && msg.recipient_id === user.id) {
        markThreadRead(bookingId, user.id).then(() => onRead?.());
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setSending(true);
    const text = body.trim();
    setBody('');
    try {
      const msg = await sendMessage(bookingId, user.id, recipientId, text);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={bare ? 'flex h-full flex-col' : 'rounded-lg border border-line bg-bg-raised p-3'}>
      <div className={bare ? 'flex-1 space-y-2 overflow-y-auto px-1 py-2' : 'mb-2 max-h-56 space-y-2 overflow-y-auto pr-1'}>
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-xs text-ink-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <p className="py-1 text-xs text-ink-muted">
            Todavía no hay mensajes. Escribí tu consulta abajo.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
                    mine ? 'bg-lime text-bg-base' : 'bg-bg-surface text-ink-primary'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setBody(s)}
              className="rounded-pill border border-line bg-bg-base px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-lime/40 hover:text-ink-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribí una consulta..."
          className="flex-1 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="flex items-center justify-center rounded-lg bg-lime px-3 py-2 text-bg-base hover:bg-lime-dark disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

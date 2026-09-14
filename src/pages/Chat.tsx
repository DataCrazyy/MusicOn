import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, Phone, Video, MoreVertical, BadgeCheck, Archive } from 'lucide-react';
import { CONVERSATIONS, getArtist, type Conversation } from '@/data';

const QUICK_REPLIES = [
  '¿Tenés disponibilidad?',
  '¿Cuál es el precio?',
  '¿Incluís equipo de sonido?',
  '¿Podés hacer un set personalizado?',
  '¿Viajás a otra ciudad?',
];

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState(id || '');
  const [input, setInput] = useState('');
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  const active = conversations.find((c) => c.id === activeId);
  const artist = active ? getArtist(active.artistId) : undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length]);

  const sendMessage = (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || !active) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: msg,
              timestamp: 'now',
              messages: [...c.messages, { from: 'me', text: msg, time: 'Now' }],
            }
          : c
      )
    );
    setInput('');
  };

  const archiveConversation = (convId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setSwipeId(null);
    if (activeId === convId) setActiveId('');
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent, convId: string) => {
    touchCurrentX.current = e.touches[0].clientX;
    const delta = touchStartX.current - touchCurrentX.current;
    if (delta > 10 && delta < 100) {
      setSwipeId(convId);
    } else if (delta <= 0) {
      setSwipeId(null);
    }
  };

  const onTouchEnd = () => {
    const delta = touchStartX.current - touchCurrentX.current;
    if (delta < 30) setSwipeId(null);
  };

  const showList = !activeId;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-bg-base">
      {/* Conversation list */}
      <div className={`w-full border-r border-line bg-bg-surface md:w-80 ${activeId ? 'hidden md:block' : ''}`}>
        <div className="border-b border-line p-4">
          <h1 className="font-display text-xl font-bold text-ink-primary">Messages</h1>
        </div>
        <div className="overflow-y-auto">
          {conversations.map((conv) => {
            const a = getArtist(conv.artistId);
            if (!a) return null;
            return (
              <div key={conv.id} className="relative overflow-hidden">
                {/* Archive action revealed by swipe */}
                {swipeId === conv.id && (
                  <button
                    onClick={() => archiveConversation(conv.id)}
                    className="absolute right-0 top-0 flex h-full items-center gap-2 bg-coral/20 px-6 text-sm font-medium text-coral transition"
                  >
                    <Archive className="h-4 w-4" /> Archivar
                  </button>
                )}
                <button
                  onClick={() => setActiveId(conv.id)}
                  onTouchStart={onTouchStart}
                  onTouchMove={(e) => onTouchMove(e, conv.id)}
                  onTouchEnd={onTouchEnd}
                  style={swipeId === conv.id ? { transform: 'translateX(-100px)' } : undefined}
                  className={`flex w-full items-start gap-3 border-b border-line p-4 text-left transition-transform ${
                    conv.id === activeId ? 'bg-bg-raised' : 'hover:bg-bg-raised/50'
                  }`}
                >
                  <img src={a.photo} alt={a.name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-ink-primary">{a.name}</span>
                        {a.verified && <BadgeCheck className="h-3.5 w-3.5 text-lime" />}
                      </div>
                      <span className="text-xs text-ink-muted">{conv.timestamp}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">{conv.lastMessage}</p>
                  </div>
                  {conv.unread && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-lime" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      {active && artist ? (
        <div className={`flex flex-1 flex-col ${showList ? 'hidden md:flex' : 'fixed inset-0 top-16 z-[60] bg-bg-base md:static md:z-auto md:inset-auto md:top-auto'}`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-bg-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveId('')} className="md:hidden">
                <ArrowLeft className="h-5 w-5 text-ink-muted" />
              </button>
              <img src={artist.photo} alt={artist.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink-primary">{artist.name}</span>
                  {artist.verified && <BadgeCheck className="h-4 w-4 text-lime" />}
                </div>
                <span className="text-xs text-teal">● Online</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-ink-primary">
                <Phone className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-ink-primary">
                <Video className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-ink-primary">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-2xl space-y-3">
              <div className="mb-4 text-center">
                <span className="rounded-pill bg-bg-surface px-3 py-1 text-xs text-ink-muted">
                  Conversation started
                </span>
              </div>
              {active.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.from === 'me'
                        ? 'rounded-br-sm bg-lime text-bg-base'
                        : 'rounded-bl-sm bg-bg-surface text-ink-primary'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`mt-1 text-xs ${msg.from === 'me' ? 'text-bg-base/60' : 'text-ink-muted'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick replies — horizontal scroll */}
          <div className="border-t border-line bg-bg-surface px-4 pt-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="flex-shrink-0 whitespace-nowrap rounded-pill border border-line bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-lime/40 hover:text-lime"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-line bg-bg-surface p-4">
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-pill border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-lime text-bg-base transition hover:bg-lime-dark disabled:opacity-30"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="mx-auto mt-2 flex max-w-2xl justify-center">
              <Link
                to={`/booking?id=${artist.id}`}
                className="text-xs font-medium text-lime hover:underline"
              >
                Ready to book? Start a booking request →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <p className="text-ink-muted">Select a conversation</p>
        </div>
      )}
    </div>
  );
}

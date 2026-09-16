import { useEffect, useState } from 'react';
import { Loader2, HandCoins, Check, X, ChevronDown, ChevronUp, History, Pencil } from 'lucide-react';
import { formatPrice, computeEndTime } from '@/lib/format';
import {
  listNegotiationEvents,
  proposeBundle,
  acceptNegotiationEvent,
  rejectNegotiationEvent,
  getProposalBundle,
  getPreviousBundle,
  type NegotiationEvent,
  type NegotiationRole,
  type ProposalBundle,
} from '@/lib/negotiation';
import { createNotification } from '@/lib/notifications';

type CurrentValues = {
  eventDate: string;
  startTime: string | null;
  durationHours: number | null;
  venue: string | null;
  venueReference: string | null;
  guestRange: string | null;
  total: number;
  equipment: string | null;
  notes: string | null;
};

type Props = {
  bookingId: string;
  userId: string;
  myRole: NegotiationRole;
  otherPartyName: string;
  otherPartyUserId: string;
  current: CurrentValues;
  onUpdated: () => void;
};

function currentBundle(current: CurrentValues): ProposalBundle {
  return {
    price: current.total,
    duration_hours: current.durationHours,
    start_time: current.startTime,
    equipment: current.equipment,
  };
}

function fmtDuration(v: number | null): string {
  return v != null ? `${v} horas` : '—';
}

function fmtField(key: keyof ProposalBundle, value: ProposalBundle[typeof key]): string {
  if (key === 'price') return formatPrice(Number(value));
  if (key === 'duration_hours') return fmtDuration(value as number | null);
  return (value as string | null) || '—';
}

const BUNDLE_LABELS: Record<keyof ProposalBundle, string> = {
  price: 'Precio',
  duration_hours: 'Duración',
  start_time: 'Horario',
  equipment: 'Equipamiento',
};

function historyLine(e: NegotiationEvent): string {
  const time = new Date(e.created_at).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const who = e.proposed_role === 'client' ? 'El cliente' : 'El artista';
  const bundle = getProposalBundle(e);
  const label = e.proposal_number ? `Propuesta #${e.proposal_number}` : 'Propuesta';
  const summary = bundle
    ? `${formatPrice(bundle.price)} · ${fmtDuration(bundle.duration_hours)} · ${bundle.start_time ?? '—'}`
    : '';
  let statusText = '';
  if (e.status === 'accepted') statusText = 'aceptada';
  if (e.status === 'rejected') statusText = 'rechazada';
  if (e.status === 'superseded') statusText = 'reemplazada por otra propuesta';
  return `${time} — ${who} envió ${label}: ${summary}${statusText ? ` — ${statusText}` : ''}`;
}

/**
 * Panel de negociación estructurada: la fuente de verdad de la reserva nunca es el
 * chat, siempre son las columnas de bookings + la tabla de eventos de negociación.
 * Toda propuesta agrupa Precio, Duración, Horario y Equipamiento en una sola
 * transacción versionada ("Propuesta #N") — nunca se envía un evento por campo. La
 * ubicación y la fecha del evento son datos fijos de la solicitud: no se negocian.
 */
export default function NegotiationPanel({ bookingId, userId, myRole, otherPartyName, otherPartyUserId, current, onUpdated }: Props) {
  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'editing' | 'reviewing'>('view');
  const [draft, setDraft] = useState<ProposalBundle>(currentBundle(current));
  const [reviewBundle, setReviewBundle] = useState<ProposalBundle | null>(null);
  const [previousForReview, setPreviousForReview] = useState<ProposalBundle>(currentBundle(current));
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listNegotiationEvents(bookingId);
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const pending = events.find((e) => e.status === 'pending' && e.field === 'proposal') ?? null;
  const history = events.filter((e) => e.status !== 'pending' && e.field === 'proposal').slice().reverse();
  const endTime = computeEndTime(current.startTime, current.durationHours);

  function startEditing(seed?: ProposalBundle) {
    const base = seed ?? currentBundle(current);
    setDraft(base);
    setPreviousForReview(currentBundle(current));
    setFormMessage('');
    setFormError(null);
    setMode('editing');
  }

  function saveDraft() {
    setFormError(null);
    if (!(draft.price > 0)) {
      setFormError('El precio debe ser mayor a 0.');
      return;
    }
    if (draft.duration_hours != null && !(draft.duration_hours > 0)) {
      setFormError('La duración debe ser mayor a 0 horas.');
      return;
    }
    setReviewBundle(draft);
    setMode('reviewing');
  }

  async function sendProposal() {
    if (!reviewBundle) return;
    setSaving(true);
    setFormError(null);
    try {
      await proposeBundle({
        bookingId,
        previous: previousForReview,
        next: reviewBundle,
        message: formMessage.trim() || undefined,
        proposedBy: userId,
        proposedRole: myRole,
      });
      await createNotification({
        userId: otherPartyUserId,
        bookingId,
        type: 'proposal_received',
        message:
          myRole === 'client'
            ? 'El cliente realizó una nueva propuesta.'
            : 'El artista realizó una nueva propuesta.',
        link: `/chat?b=${bookingId}`,
      });
      setMode('view');
      setReviewBundle(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No pudimos enviar la propuesta.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAccept(event: NegotiationEvent) {
    setSaving(true);
    try {
      await acceptNegotiationEvent(event);
      await createNotification({
        userId: event.proposed_by,
        bookingId,
        type: 'proposal_accepted',
        message: myRole === 'client' ? 'El cliente aceptó tu propuesta.' : 'El artista aceptó tu propuesta.',
        link: `/chat?b=${bookingId}`,
      });
      await load();
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(event: NegotiationEvent) {
    setSaving(true);
    try {
      await rejectNegotiationEvent(event.id);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const nextProposalNumber = (events.filter((e) => e.field === 'proposal').reduce(
    (max, e) => Math.max(max, e.proposal_number ?? 0),
    0
  )) + 1;

  return (
    <div className="mt-4 rounded-lg border border-line bg-bg-surface p-3">
      {/* Resumen actual — siempre viene de bookings, nunca del historial de chat.
          Fecha/Ubicación/Personas son datos fijos de la solicitud: no se negocian. */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
        <div>
          <p className="font-semibold text-ink-muted">Fecha</p>
          <p className="text-ink-primary">{current.eventDate}</p>
        </div>
        <div>
          <p className="font-semibold text-ink-muted">Horario</p>
          <p className="text-ink-primary">
            {current.startTime ?? '—'}
            {endTime ? ` – ${endTime}` : ''}
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink-muted">Duración</p>
          <p className="text-ink-primary">{fmtDuration(current.durationHours)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="font-semibold text-ink-muted">Ubicación (fija)</p>
          <p className="truncate text-ink-primary">
            {current.venue ?? '—'}
            {current.venueReference ? ` (${current.venueReference})` : ''}
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink-muted">Personas</p>
          <p className="text-ink-primary">{current.guestRange ?? '—'}</p>
        </div>
        <div>
          <p className="font-semibold text-ink-muted">Precio acordado</p>
          <p className="font-bold text-lime">{formatPrice(current.total)}</p>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <p className="font-semibold text-ink-muted">Equipamiento</p>
          <p className="text-ink-primary">{current.equipment || '—'}</p>
        </div>
      </div>

      {history.length > 0 && (
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-ink-primary"
        >
          <History className="h-3 w-3" />
          Ver historial de propuestas
          {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      )}

      {showHistory && (
        <ul className="mt-2 space-y-1 rounded-lg bg-bg-base p-2 text-[11px] text-ink-muted">
          {history.map((e) => (
            <li key={e.id}>{historyLine(e)}</li>
          ))}
        </ul>
      )}

      {/* Propuesta pendiente — comparación completa, "anterior" vs "nueva", como un
          solo bloque (54). */}
      {pending && mode === 'view' && (
        <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 p-3">
          <p className="text-xs font-bold text-ink-primary">
            Propuesta #{pending.proposal_number} — por {pending.proposed_role === 'client' ? 'el cliente' : 'el artista'}
          </p>
          <ProposalDiff previous={getPreviousBundle(pending)} next={getProposalBundle(pending)} />
          {pending.message && <p className="mt-2 text-xs italic text-ink-primary">"{pending.message}"</p>}

          {pending.proposed_by === userId ? (
            <p className="mt-2 text-xs text-ink-muted">Esperando respuesta de {otherPartyName}...</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleAccept(pending)}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-pill bg-lime px-3 py-1.5 text-xs font-bold text-bg-base hover:bg-lime-dark disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" /> Aceptar
              </button>
              <button
                onClick={() => {
                  const b = getProposalBundle(pending);
                  if (b) startEditing(b);
                }}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-bold text-ink-primary hover:border-lime/40"
              >
                <Pencil className="h-3.5 w-3.5" /> Contraoferta
              </button>
              <button
                onClick={() => handleReject(pending)}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-bold text-ink-primary hover:border-red-400/40 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" /> Rechazar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Proponer cambios */}
      {!pending && mode === 'view' && !loading && (
        <button
          type="button"
          onClick={() => startEditing()}
          className="mt-3 flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-lime/40"
        >
          <HandCoins className="h-3.5 w-3.5" /> Negociar condiciones
        </button>
      )}

      {/* Edición local — se puede ajustar Precio, Duración, Horario y Equipamiento
          libremente y "Guardar cambios" antes de enviar nada (53); recién al confirmar
          en la pantalla de revisión se envía como una sola propuesta. */}
      {mode === 'editing' && (
        <div className="mt-3 rounded-lg border border-line bg-bg-base p-3">
          <p className="mb-2 text-xs font-bold text-ink-primary">Propuesta #{nextProposalNumber} (borrador)</p>

          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Precio (Bs)</label>
          <input
            type="number"
            min="0"
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
            className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
          />

          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Duración (horas)</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={draft.duration_hours ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, duration_hours: e.target.value ? Number(e.target.value) : null }))
            }
            className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
          />

          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Horario</label>
          <input
            type="time"
            value={draft.start_time ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))}
            className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
          />

          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Equipamiento</label>
          <input
            type="text"
            value={draft.equipment ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, equipment: e.target.value }))}
            placeholder="Ej: Sonido + micrófonos"
            className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
          />

          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Mensaje (opcional)</label>
          <textarea
            value={formMessage}
            onChange={(e) => setFormMessage(e.target.value)}
            rows={2}
            className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
            placeholder="Agrega una explicación o comentario (opcional)"
          />

          {formError && <p className="mb-2 text-xs text-red-400">{formError}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setMode('view')}
              className="flex-1 rounded-pill border border-line px-4 py-2 text-xs font-bold text-ink-primary hover:border-lime/40"
            >
              Cancelar
            </button>
            <button
              onClick={saveDraft}
              className="flex-1 rounded-pill bg-lime px-4 py-2 text-xs font-bold text-bg-base hover:bg-lime-dark"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* Revisión antes de enviar — compara "propuesta anterior" vs "nueva propuesta"
          como un bloque completo, y solo aquí se envía todo como una única
          transacción (53/54). */}
      {mode === 'reviewing' && reviewBundle && (
        <div className="mt-3 rounded-lg border border-line bg-bg-base p-3">
          <p className="mb-2 text-xs font-bold text-ink-primary">Revisar Propuesta #{nextProposalNumber}</p>
          <ProposalDiff previous={previousForReview} next={reviewBundle} />
          {formMessage.trim() && <p className="mt-2 text-xs italic text-ink-primary">"{formMessage.trim()}"</p>}

          {formError && <p className="mt-2 text-xs text-red-400">{formError}</p>}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setMode('editing')}
              className="flex-1 rounded-pill border border-line px-4 py-2 text-xs font-bold text-ink-primary hover:border-lime/40"
            >
              Editar
            </button>
            <button
              onClick={sendProposal}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-lime px-4 py-2 text-xs font-bold text-bg-base hover:bg-lime-dark disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Enviar propuesta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Comparación "Propuesta anterior" vs "Nueva propuesta" — solo resalta lo que
 * realmente cambió, como pide 54. */
function ProposalDiff({ previous, next }: { previous: ProposalBundle | null; next: ProposalBundle | null }) {
  if (!next) return null;
  const keys: (keyof ProposalBundle)[] = ['price', 'duration_hours', 'start_time', 'equipment'];
  return (
    <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div>
        <p className="text-[11px] font-semibold text-ink-muted">Propuesta anterior</p>
        <ul className="mt-0.5 space-y-0.5 text-xs text-ink-muted">
          {keys.map((k) => (
            <li key={k}>
              {BUNDLE_LABELS[k]}: {previous ? fmtField(k, previous[k]) : '—'}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-ink-muted">Nueva propuesta</p>
        <ul className="mt-0.5 space-y-0.5 text-xs">
          {keys.map((k) => {
            const changed = !previous || previous[k] !== next[k];
            return (
              <li key={k} className={changed ? 'font-bold text-lime' : 'text-ink-primary'}>
                {BUNDLE_LABELS[k]}: {fmtField(k, next[k])}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

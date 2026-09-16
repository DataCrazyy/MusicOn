import { useEffect, useState } from 'react';
import { Loader2, HandCoins, Check, X, ChevronDown, ChevronUp, History } from 'lucide-react';
import { formatPrice, computeEndTime } from '@/lib/format';
import {
  listNegotiationEvents,
  proposeChange,
  acceptNegotiationEvent,
  rejectNegotiationEvent,
  FIELD_LABELS,
  type NegotiationEvent,
  type NegotiableField,
  type NegotiationRole,
} from '@/lib/negotiation';

type CurrentValues = {
  eventDate: string;
  startTime: string | null;
  durationHours: number | null;
  venue: string | null;
  venueReference: string | null;
  guestRange: string | null;
  total: number;
  notes: string | null;
};

type Props = {
  bookingId: string;
  userId: string;
  myRole: NegotiationRole;
  otherPartyName: string;
  current: CurrentValues;
  onUpdated: () => void;
};

function fieldToValueString(field: NegotiableField, current: CurrentValues): string {
  switch (field) {
    case 'price':
      return String(current.total);
    case 'event_date':
      return current.eventDate;
    case 'start_time':
      return current.startTime ?? '';
    case 'duration_hours':
      return current.durationHours != null ? String(current.durationHours) : '';
    case 'venue':
      return current.venue ?? '';
    case 'guest_range':
      return current.guestRange ?? '';
    case 'notes':
      return current.notes ?? '';
  }
}

function displayValue(field: NegotiableField, value: string): string {
  if (!value) return '—';
  if (field === 'price') return formatPrice(Number(value));
  if (field === 'duration_hours') return `${value} horas`;
  return value;
}

function historyLine(e: NegotiationEvent, myRole: NegotiationRole): string {
  const time = new Date(e.created_at).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const who = e.proposed_role === 'client' ? 'El cliente' : 'El artista';
  const field = FIELD_LABELS[e.field].toLowerCase();
  const from = displayValue(e.field, e.old_value ?? '');
  const to = displayValue(e.field, e.new_value);
  let action = `${who} propuso cambiar ${field} de ${from} a ${to}`;
  if (e.status === 'accepted') action = `${who} propuso ${field}: ${to} — aceptado`;
  if (e.status === 'rejected') action = `${who} propuso ${field}: ${to} — rechazado`;
  if (e.status === 'superseded') action = `${who} propuso ${field}: ${to} — reemplazado por otra propuesta`;
  return `${time} — ${action}`;
}

/**
 * Panel de negociación estructurada: la fuente de verdad de la reserva nunca es el
 * chat, siempre son las columnas de bookings + esta tabla de eventos. El chat de al
 * lado sirve solo para conversar; este panel es el único lugar donde se cambian
 * precio, fecha, hora, duración, lugar, cantidad de personas o condiciones.
 */
export default function NegotiationPanel({ bookingId, userId, myRole, otherPartyName, current, onUpdated }: Props) {
  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formField, setFormField] = useState<NegotiableField>('price');
  const [formValue, setFormValue] = useState('');
  const [formMessage, setFormMessage] = useState('');
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

  const pending = events.find((e) => e.status === 'pending') ?? null;
  const history = events.filter((e) => e.status !== 'pending').slice().reverse();
  const endTime = computeEndTime(current.startTime, current.durationHours);

  function openForm(field: NegotiableField, prefill?: string) {
    setFormField(field);
    setFormValue(prefill ?? fieldToValueString(field, current));
    setFormMessage('');
    setShowForm(true);
  }

  async function submitProposal() {
    if (!formValue.trim()) return;
    setSaving(true);
    try {
      await proposeChange({
        bookingId,
        field: formField,
        oldValue: fieldToValueString(formField, current),
        newValue: formValue.trim(),
        message: formMessage.trim() || undefined,
        proposedBy: userId,
        proposedRole: myRole,
      });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleAccept(event: NegotiationEvent) {
    setSaving(true);
    try {
      await acceptNegotiationEvent(event);
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

  return (
    <div className="mt-4 rounded-lg border border-line bg-bg-surface p-3">
      {/* Resumen actual — siempre viene de bookings, nunca del historial de chat */}
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
          <p className="text-ink-primary">{current.durationHours ? `${current.durationHours} horas` : '—'}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="font-semibold text-ink-muted">Ubicación</p>
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
      </div>

      {history.length > 0 && (
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-ink-primary"
        >
          <History className="h-3 w-3" />
          Ver historial de cambios
          {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      )}

      {showHistory && (
        <ul className="mt-2 space-y-1 rounded-lg bg-bg-base p-2 text-[11px] text-ink-muted">
          {history.map((e) => (
            <li key={e.id}>{historyLine(e, myRole)}</li>
          ))}
        </ul>
      )}

      {/* Propuesta pendiente */}
      {pending && (
        <div className="mt-3 rounded-lg border border-amber/30 bg-amber/10 p-3">
          <p className="text-xs font-bold text-ink-primary">
            Propuesta de {FIELD_LABELS[pending.field].toLowerCase()}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Actual: <span className="text-ink-primary">{displayValue(pending.field, pending.old_value ?? '')}</span>
            {'  →  '}
            Propuesto: <span className="font-bold text-ink-primary">{displayValue(pending.field, pending.new_value)}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            Propuesto por {pending.proposed_role === 'client' ? 'el cliente' : 'el artista'}
          </p>
          {pending.message && <p className="mt-1 text-xs italic text-ink-primary">"{pending.message}"</p>}

          {pending.proposed_by === userId ? (
            <p className="mt-2 text-xs text-ink-muted">Esperando respuesta de {otherPartyName}...</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => handleAccept(pending)}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-pill bg-lime px-3 py-1.5 text-xs font-bold text-bg-base hover:bg-lime-dark disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" /> Aceptar
              </button>
              <button
                onClick={() => openForm(pending.field, pending.new_value)}
                disabled={saving}
                className="rounded-pill border border-line px-3 py-1.5 text-xs font-bold text-ink-primary hover:border-lime/40"
              >
                Contraoferta
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

      {/* Proponer cambio */}
      {!pending && !showForm && !loading && (
        <button
          type="button"
          onClick={() => openForm('price')}
          className="mt-3 flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-lime/40"
        >
          <HandCoins className="h-3.5 w-3.5" /> Negociar condiciones
        </button>
      )}

      {showForm && (
        <div className="mt-3 rounded-lg border border-line bg-bg-base p-3">
          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Campo a modificar</label>
          <select
            value={formField}
            onChange={(e) => {
              const f = e.target.value as NegotiableField;
              setFormField(f);
              setFormValue(fieldToValueString(f, current));
            }}
            className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
          >
            {(Object.keys(FIELD_LABELS) as NegotiableField[]).map((f) => (
              <option key={f} value={f}>
                {FIELD_LABELS[f]}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Nuevo valor</label>
          {formField === 'price' || formField === 'duration_hours' ? (
            <input
              type="number"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
            />
          ) : formField === 'event_date' ? (
            <input
              type="date"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
            />
          ) : formField === 'start_time' ? (
            <input
              type="time"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
            />
          ) : (
            <input
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
            />
          )}

          <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Mensaje (opcional)</label>
          <textarea
            value={formMessage}
            onChange={(e) => setFormMessage(e.target.value)}
            rows={2}
            className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
            placeholder='Ej: "Me gustaría contratar el servicio por Bs 1.300 considerando una duración de 3 horas."'
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-pill border border-line px-4 py-2 text-xs font-bold text-ink-primary hover:border-lime/40"
            >
              Cancelar
            </button>
            <button
              onClick={submitProposal}
              disabled={saving || !formValue.trim()}
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

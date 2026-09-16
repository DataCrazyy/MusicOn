import { useState } from 'react';
import { Loader2, HandCoins } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { proposeNewPrice } from '@/lib/bookings';

type Props = {
  bookingId: string;
  /** Precio de referencia original del artista, con el que se creó la solicitud. */
  subtotal: number;
  /** Precio actual (puede ya venir negociado por cualquiera de las dos partes). */
  total: number;
  onUpdated: () => void;
};

/**
 * Negociación de precio dentro de la conversación, estilo Airbnb: muestra el
 * precio inicial vs. el negociado y permite proponer un nuevo precio con
 * slider o campo numérico. Disponible para cliente y artista mientras la
 * solicitud está pendiente de aprobación.
 */
export default function PriceNegotiation({ bookingId, subtotal, total, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(total);
  const [saving, setSaving] = useState(false);

  const min = Math.round(subtotal * 0.5);
  const max = Math.round(subtotal * 1.5);
  const negotiated = total !== subtotal;

  function startEditing() {
    setValue(total);
    setEditing(true);
  }

  async function confirm() {
    setSaving(true);
    try {
      await proposeNewPrice(bookingId, value);
      setEditing(false);
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-line bg-bg-surface p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-ink-muted">Precio inicial</p>
          <p className={`text-sm ${negotiated ? 'text-ink-muted line-through' : 'font-bold text-ink-primary'}`}>
            {formatPrice(subtotal)}
          </p>
        </div>
        {negotiated && (
          <div className="text-right">
            <p className="text-xs font-semibold text-ink-muted">Precio negociado</p>
            <p className="text-sm font-bold text-lime">{formatPrice(total)}</p>
          </div>
        )}
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-lime/40"
          >
            <HandCoins className="h-3.5 w-3.5" /> Proponer precio
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3">
          <input
            type="range"
            min={min}
            max={max}
            step={10}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-lime"
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-ink-muted">Bs</span>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-28 rounded-lg border border-line bg-bg-base px-2 py-1.5 text-sm text-ink-primary outline-none focus:border-lime"
            />
            <span className="ml-auto text-sm font-bold text-ink-primary">{formatPrice(value)}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-pill border border-line px-4 py-2 text-xs font-bold text-ink-primary hover:border-lime/40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
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

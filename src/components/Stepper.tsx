import { Check } from 'lucide-react';

export type Step = {
  key: string;
  label: string;
};

type Props = {
  steps: Step[];
  /** Índice (0-based) del paso actual. Los anteriores se muestran como completados. */
  currentIndex: number;
};

/**
 * Indicador de progreso reutilizable (barra + círculos numerados) — mismo lenguaje
 * visual en todo el flujo de reserva: negociación → firma del artista → firma del
 * cliente → pago, y también en el buscador guiado de Explorar.
 */
export default function Stepper({ steps, currentIndex }: Props) {
  const total = steps.length;
  const progressPct = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;

  return (
    <div className="w-full">
      <div className="relative mb-3 h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-lime transition-all"
          style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
        />
      </div>
      <div className="flex items-start justify-between gap-1">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center sm:flex-row sm:justify-start sm:text-left">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  done
                    ? 'bg-lime text-bg-base'
                    : active
                      ? 'border-2 border-lime text-lime'
                      : 'border border-line text-ink-muted'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`truncate text-[11px] font-semibold sm:text-xs ${
                  done || active ? 'text-ink-primary' : 'text-ink-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

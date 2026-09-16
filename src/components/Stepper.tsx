import { Check } from 'lucide-react';

export type StepStatus = 'done' | 'active' | 'pending';

export type Step = {
  key: string;
  label: string;
  /** Estado explícito del paso. Si no se da, se calcula a partir de currentIndex
   * (compatibilidad con el buscador guiado de Explorar, que solo maneja un índice). */
  status?: StepStatus;
};

type Props = {
  steps: Step[];
  currentIndex?: number;
};

function statusFor(step: Step, index: number, currentIndex: number | undefined): StepStatus {
  if (step.status) return step.status;
  if (currentIndex == null) return 'pending';
  if (index < currentIndex) return 'done';
  if (index === currentIndex) return 'active';
  return 'pending';
}

const STATUS_WORD: Record<StepStatus, string> = {
  done: 'Completado',
  active: 'En proceso',
  pending: 'Pendiente',
};

/**
 * Indicador de progreso reutilizable. En mobile se muestra como lista vertical, para
 * que ningún texto quede cortado sin importar cuántos pasos haya o qué tan largo sea
 * el nombre de cada uno (60). En escritorio/tablet se muestra como barra horizontal
 * con la etiqueta completa debajo de cada círculo — sin truncar ni reducir la fuente
 * para forzar que quepa todo.
 */
export default function Stepper({ steps, currentIndex }: Props) {
  const total = steps.length;
  const doneCount = steps.filter((s, i) => statusFor(s, i, currentIndex) === 'done').length;
  const progressPct = total > 1 ? (doneCount / (total - 1)) * 100 : 0;

  return (
    <div className="w-full">
      {/* Escritorio / tablet */}
      <div className="hidden sm:block">
        <div className="relative mb-3 h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-lime transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
          />
        </div>
        <div className="flex items-start justify-between gap-2">
          {steps.map((step, i) => {
            const status = statusFor(step, i, currentIndex);
            return (
              <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    status === 'done'
                      ? 'bg-lime text-bg-base'
                      : status === 'active'
                        ? 'border-2 border-lime text-lime'
                        : 'border border-line text-ink-muted'
                  }`}
                >
                  {status === 'done' ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={`whitespace-normal break-words text-[11px] font-semibold leading-tight ${
                    status === 'pending' ? 'text-ink-muted' : 'text-ink-primary'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: lista vertical con número, etiqueta completa y glifo + palabra de
          estado — formato explícito pedido para que el texto nunca se corte. */}
      <ul className="space-y-2.5 sm:hidden">
        {steps.map((step, i) => {
          const status = statusFor(step, i, currentIndex);
          const glyph = status === 'done' ? '✓' : status === 'active' ? '●' : '○';
          return (
            <li key={step.key} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  status === 'done'
                    ? 'bg-lime text-bg-base'
                    : status === 'active'
                      ? 'border-2 border-lime text-lime'
                      : 'border border-line text-ink-muted'
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-snug ${status === 'pending' ? 'text-ink-muted' : 'text-ink-primary'}`}>
                  {step.label}
                </p>
                <p
                  className={`text-xs ${
                    status === 'done' ? 'text-lime' : status === 'active' ? 'text-amber' : 'text-ink-muted'
                  }`}
                >
                  {glyph} {STATUS_WORD[status]}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

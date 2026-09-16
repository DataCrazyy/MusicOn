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
  /** 'timeline' (por defecto): lista vertical detallada en mobile, pensada para
   * flujos con estado por paso (reserva/negociacion/contrato). 'compact': en
   * mobile muestra solo una barra de progreso + "Paso X de N", pensado para
   * wizards lineales simples (ej. el buscador guiado de Explorar) donde una
   * lista completa de todos los pasos es ruido innecesario. */
  variant?: 'timeline' | 'compact';
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
 * Indicador de progreso reutilizable. En escritorio/tablet siempre se muestra como
 * barra horizontal con la etiqueta completa debajo de cada círculo — sin truncar ni
 * reducir la fuente para forzar que quepa todo. En mobile hay dos variantes: 'timeline'
 * (lista vertical con estado por paso, para que ningún texto quede cortado sin importar
 * cuántos pasos haya) y 'compact' (barra de progreso + "Paso X de N", para wizards
 * lineales donde listar todos los pasos es ruido).
 */
export default function Stepper({ steps, currentIndex, variant = 'timeline' }: Props) {
  const total = steps.length;
  const doneCount = steps.filter((s, i) => statusFor(s, i, currentIndex) === 'done').length;
  const progressPct = total > 1 ? (doneCount / (total - 1)) * 100 : 0;
  const activeStepIndex = Math.max(
    0,
    currentIndex ?? steps.findIndex((s, i) => statusFor(s, i, currentIndex) === 'active')
  );

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

      {/* Mobile compacto: barra de progreso + "Paso X de N" y la etiqueta del paso
          activo — evita la lista larga en wizards lineales simples. */}
      {variant === 'compact' && (
        <div className="sm:hidden">
          <div className="relative mb-2 h-1 w-full overflow-hidden rounded-full bg-line">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-lime transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
            />
          </div>
          <p className="text-center text-xs font-semibold text-ink-muted">
            Paso {activeStepIndex + 1} de {total} ·{' '}
            <span className="text-ink-primary">{steps[activeStepIndex]?.label}</span>
          </p>
        </div>
      )}

      {/* Mobile detallado: lista vertical con número, etiqueta completa y glifo + palabra
          de estado — formato explícito pedido para que el texto nunca se corte. */}
      {variant === 'timeline' && (
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
      )}
    </div>
  );
}

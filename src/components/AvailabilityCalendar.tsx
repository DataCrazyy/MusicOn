import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type Props = {
  blockedDates: string[];
  weeklyOffDays?: number[];
  /** Modo edición (artista): tocar un día libre lo marca ocupado y viceversa. */
  onToggle?: (dateStr: string) => void;
  /** Modo selección (cliente): solo se pueden tocar días libres, para elegir la fecha del evento. */
  onSelect?: (dateStr: string) => void;
  selectedDate?: string;
  readOnly?: boolean;
};

export default function AvailabilityCalendar({
  blockedDates,
  weeklyOffDays = [],
  onToggle,
  onSelect,
  selectedDate,
  readOnly = false,
}: Props) {
  const today = startOfToday();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const blockedSet = new Set(blockedDates);
  const offDaysSet = new Set(weeklyOffDays);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=domingo..6=sábado → convertimos a lunes=0..domingo=6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function goPrev() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function goNext() {
    setViewDate(new Date(year, month + 1, 1));
  }

  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="rounded-lg border border-line bg-bg-raised p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-bg-surface disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-ink-primary">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          type="button"
          onClick={goNext}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-bg-surface"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-xs font-semibold text-ink-muted">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const iso = toISODate(date);
          const isPast = date < today;
          const isBlocked = blockedSet.has(iso);
          const isWeeklyOff = !isBlocked && offDaysSet.has(date.getDay());
          const isSelected = selectedDate === iso;

          const canToggle = !readOnly && !isPast && !isWeeklyOff && !!onToggle;
          const canSelect = !isPast && !isWeeklyOff && !isBlocked && !!onSelect;
          const interactive = canToggle || canSelect;

          let cellClass = '';
          if (isPast) {
            cellClass = 'text-ink-muted/30';
          } else if (isBlocked) {
            cellClass = 'bg-red-500/20 text-red-400';
          } else if (isWeeklyOff) {
            cellClass = 'bg-bg-surface text-ink-muted/60';
          } else {
            cellClass = interactive
              ? 'bg-lime/10 text-lime hover:bg-lime/20'
              : 'bg-lime/10 text-lime';
          }

          if (isSelected) {
            cellClass += ' ring-2 ring-lime ring-offset-1 ring-offset-bg-raised';
          }

          function handleClick() {
            if (!interactive) return;
            if (canSelect) onSelect?.(iso);
            else if (canToggle) onToggle?.(iso);
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={!interactive}
              onClick={handleClick}
              className={`aspect-square rounded-lg text-xs font-semibold transition ${cellClass}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-lime/30" /> Libre
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500/40" /> Ocupado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-muted/30" /> No atiende
        </span>
        {onToggle && !readOnly && <span>Tocá un día libre para marcarlo como ocupado</span>}
        {onSelect && <span>Tocá un día libre para elegir la fecha</span>}
      </div>
    </div>
  );
}

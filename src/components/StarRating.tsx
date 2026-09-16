import { Star } from 'lucide-react';

type Props = {
  value: number;
  size?: number;
  /** Si se pasa, las estrellas son clickeables y editables. */
  onChange?: (value: number) => void;
};

/** Fila de estrellas para mostrar (y opcionalmente elegir) una calificación de 1 a 5. */
export default function StarRating({ value, size = 16, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} estrellas`}
        >
          <Star
            width={size}
            height={size}
            className={n <= Math.round(value) ? 'fill-amber text-amber' : 'fill-transparent text-ink-muted'}
          />
        </button>
      ))}
    </div>
  );
}

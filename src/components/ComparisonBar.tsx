import { Link } from 'react-router-dom';
import { X, ArrowRight, GitCompare } from 'lucide-react';
import { useCompare, MAX_COMPARE } from '@/components/CompareContext';

export default function ComparisonBar() {
  const { selected, remove, clear } = useCompare();

  if (selected.length === 0) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-lime/30 bg-bg-surface/95 backdrop-blur-xl md:bottom-0">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:px-6">
        {/* Left: selected avatars */}
        <div className="flex items-center gap-2">
          {selected.map((a) => (
            <div key={a.id} className="group relative">
              <img
                src={a.photo}
                alt={a.name}
                className="h-10 w-10 rounded-full border-2 border-lime object-cover"
              />
              <button
                onClick={() => remove(a.id)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-white transition hover:scale-110"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {Array.from({ length: MAX_COMPARE - selected.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-line"
            >
              <GitCompare className="h-4 w-4 text-ink-muted" />
            </div>
          ))}
        </div>

        {/* Center: count */}
        <div className="flex-1 text-center sm:text-left">
          <span className="text-sm font-medium text-ink-primary">
            Comparando <span className="font-bold text-lime">{selected.length}</span> de {MAX_COMPARE} artistas
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={clear}
            className="text-xs font-medium text-ink-muted transition hover:text-coral"
          >
            Limpiar selección
          </button>
          <Link
            to="/comparar"
            className={`flex items-center gap-2 rounded-pill px-5 py-2.5 text-sm font-bold transition ${
              selected.length >= 2
                ? 'bg-lime text-bg-base hover:bg-lime-dark'
                : 'cursor-not-allowed bg-bg-raised text-ink-muted'
            }`}
            onClick={(e) => {
              if (selected.length < 2) e.preventDefault();
            }}
          >
            Ver comparación <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

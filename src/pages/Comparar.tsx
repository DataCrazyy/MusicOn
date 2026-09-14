import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, X, Star, Zap, Check, Minus, Sparkles, BadgeCheck,
} from 'lucide-react';
import { useCompare } from '@/components/CompareContext';
import type { Artist } from '@/data';

// Extended comparison data (deterministic per artist)
function getComparisonData(a: Artist) {
  const seed = a.id.charCodeAt(1) || 1;
  return {
    basePrice: a.priceFrom,
    rating: a.rating,
    reviews: a.reviews,
    eventsDone: Math.round(a.reviews * 1.8) + (seed % 10),
    verified: a.verified,
    proTier: a.proTier,
    responseTime: seed % 3 === 0 ? '<1h' : '<2h',
    confirmationRate: 95 + (seed % 5),
    packages: (seed % 3) + 2,
    minPrice: a.priceFrom,
    maxPrice: a.priceFrom + (seed % 5) * 150 + 300,
    bookedDays: Array.from({ length: 8 }, (_, i) => (seed + i * 3) % 28 + 1),
  };
}

const SEP_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

const ROWS: { icon: string; label: string; render: (a: Artist, data: ReturnType<typeof getComparisonData>) => React.ReactNode }[] = [
  { icon: '💰', label: 'Precio base', render: (_a, d) => <span className="font-display text-base font-bold text-ink-primary">USD {d.basePrice.toLocaleString()}</span> },
  { icon: '⭐', label: 'Calificación', render: (_a, d) => <span className="flex items-center gap-1 text-sm font-semibold text-ink-primary"><Star className="h-4 w-4 text-amber" fill="currentColor" /> {d.rating}</span> },
  { icon: '💬', label: 'Reseñas', render: (_a, d) => <span className="text-sm font-semibold text-ink-primary">{d.reviews}</span> },
  { icon: '🎉', label: 'Eventos realizados', render: (_a, d) => <span className="text-sm font-semibold text-ink-primary">{d.eventsDone}</span> },
  { icon: '✔', label: 'Verificado', render: (_a, d) => d.verified ? <Check className="h-5 w-5 text-teal" /> : <Minus className="h-5 w-5 text-ink-muted" /> },
  { icon: '✦', label: 'Plan Pro', render: (_a, d) => d.proTier ? <span className="flex items-center gap-1 text-xs font-bold text-amber"><Zap className="h-3.5 w-3.5" /> Pro</span> : <Minus className="h-5 w-5 text-ink-muted" /> },
  { icon: '⚡', label: 'Tiempo de respuesta', render: (_a, d) => <span className="text-sm font-semibold text-ink-primary">{d.responseTime}</span> },
  { icon: '📋', label: 'Tasa de confirmación', render: (_a, d) => <span className="text-sm font-semibold text-ink-primary">{d.confirmationRate}%</span> },
  { icon: '📦', label: 'Paquetes disponibles', render: (_a, d) => <span className="text-sm font-semibold text-ink-primary">{d.packages}</span> },
  { icon: '💵', label: 'Precio mínimo', render: (_a, d) => <span className="text-sm font-semibold text-ink-primary">USD {d.minPrice.toLocaleString()}</span> },
  { icon: '💲', label: 'Precio máximo', render: (_a, d) => <span className="text-sm font-semibold text-ink-primary">USD {d.maxPrice.toLocaleString()}</span> },
];

export default function Comparar() {
  const { selected, remove, clear } = useCompare();
  const navigate = useNavigate();

  if (selected.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <div className="text-center">
          <p className="font-display text-xl font-bold text-ink-primary">No hay artistas para comparar</p>
          <p className="mt-2 text-sm text-ink-muted">Seleccioná al menos 2 artistas desde la página de exploración.</p>
          <Link to="/explore" className="mt-6 inline-flex items-center gap-2 rounded-pill bg-lime px-5 py-3 font-bold text-bg-base transition hover:bg-lime-dark">
            <ArrowLeft className="h-4 w-4" /> Explorar artistas
          </Link>
        </div>
      </div>
    );
  }

  const dataMap = selected.map((a) => ({ artist: a, data: getComparisonData(a) }));

  // Best value calculations
  const cheapestIdx = dataMap.reduce((minI, curr, i, arr) => curr.data.basePrice < arr[minI].data.basePrice ? i : minI, 0);
  const bestRatingIdx = dataMap.reduce((maxI, curr, i, arr) => curr.data.rating > arr[maxI].data.rating ? i : maxI, 0);
  const mostEventsIdx = dataMap.reduce((maxI, curr, i, arr) => curr.data.eventsDone > arr[maxI].data.eventsDone ? i : maxI, 0);

  // AI recommendation: best balance of price, rating, and availability
  const aiRecommendedIdx = dataMap.reduce((bestI, curr, i) => {
    const score = (5 - curr.data.basePrice / 400) + curr.data.rating + (curr.data.verified ? 1 : 0) - (curr.data.bookedDays.length * 0.05);
    const bestScore = (5 - dataMap[bestI].data.basePrice / 400) + dataMap[bestI].data.rating + (dataMap[bestI].data.verified ? 1 : 0) - (dataMap[bestI].data.bookedDays.length * 0.05);
    return score > bestScore ? i : bestI;
  }, 0);

  const recommended = selected[aiRecommendedIdx];

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/explore" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Volver a explorar
        </Link>

        <h1 className="mb-2 font-display text-3xl font-bold text-ink-primary">Comparar artistas</h1>
        <p className="mb-8 text-sm text-ink-muted">Compará hasta 3 artistas lado a lado para encontrar el mejor para tu evento.</p>

        {selected.length < 2 && (
          <div className="mb-6 flex items-center gap-3 rounded-card border border-amber/30 bg-amber/5 p-4">
            <span className="text-amber">⚠</span>
            <p className="text-sm text-ink-muted">Seleccioná al menos 2 artistas para una comparación completa. <Link to="/explore" className="font-medium text-lime hover:underline">Agregar más →</Link></p>
          </div>
        )}

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-card border border-line bg-bg-surface">
          <div className="min-w-[700px]">
            {/* Header row: artist columns */}
            <div className="grid border-b border-line" style={{ gridTemplateColumns: `160px repeat(${selected.length}, 1fr)` }}>
              <div className="flex items-end p-4">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Criterio</span>
              </div>
              {selected.map((a, i) => (
                <div key={a.id} className="relative border-l border-line p-4 text-center">
                  <button
                    onClick={() => remove(a.id)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:bg-coral hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {/* Large emoji on gradient bg */}
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-bg-raised to-bg-elevated text-4xl">
                    {a.genre === 'Rock' ? '🎸' : a.genre === 'Jazz' ? '🎷' : a.genre === 'Electronic' ? '🎧' : a.genre === 'Classical' ? '🎻' : a.genre === 'Folk' ? '🪕' : a.genre === 'Pop' ? '🎤' : a.genre === 'Hip-Hop' ? '🎤' : a.genre === 'Latin' ? '🥁' : a.genre === 'Blues' ? '🎺' : a.genre === 'Reggae' ? '🎶' : '🎵'}
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-ink-primary">{a.name}</h3>
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    {a.verified && <BadgeCheck className="h-4 w-4 text-lime" />}
                    {a.proTier && (
                      <span className="flex items-center gap-0.5 rounded-pill bg-amber/15 px-1.5 py-0.5 text-[10px] font-bold text-amber">
                        <Zap className="h-2.5 w-2.5" /> PRO
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-ink-muted">
                    <Star className="h-3.5 w-3.5 text-amber" fill="currentColor" /> {a.rating}
                  </div>
                  <button
                    onClick={() => navigate(`/booking?id=${a.id}`)}
                    className="mt-3 w-full rounded-pill bg-lime py-2 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
                  >
                    Reservar
                  </button>
                </div>
              ))}
            </div>

            {/* Comparison rows */}
            {ROWS.map((row, rowIdx) => (
              <div
                key={row.label}
                className="grid border-b border-line/50 last:border-0"
                style={{ gridTemplateColumns: `160px repeat(${selected.length}, 1fr)` }}
              >
                <div className={`flex items-center gap-2 p-4 text-sm font-medium text-ink-muted ${rowIdx % 2 === 1 ? 'bg-bg-raised/30' : ''}`}>
                  <span className="text-base">{row.icon}</span>
                  <span className="text-xs">{row.label}</span>
                </div>
                {dataMap.map(({ artist, data }) => (
                  <div key={artist.id} className={`flex flex-col items-center justify-center p-4 text-center ${rowIdx % 2 === 1 ? 'bg-bg-raised/30' : ''} border-l border-line/50`}>
                    {row.render(artist, data)}
                    {/* Best value badges */}
                    {row.label === 'Precio base' && dataMap[cheapestIdx].artist.id === artist.id && (
                      <span className="mt-1.5 rounded-pill bg-lime/15 px-2 py-0.5 text-[10px] font-bold text-lime">✓ Mejor precio</span>
                    )}
                    {row.label === 'Calificación' && dataMap[bestRatingIdx].artist.id === artist.id && (
                      <span className="mt-1.5 rounded-pill bg-lime/15 px-2 py-0.5 text-[10px] font-bold text-lime">✓ Mejor rating</span>
                    )}
                    {row.label === 'Eventos realizados' && dataMap[mostEventsIdx].artist.id === artist.id && (
                      <span className="mt-1.5 rounded-pill bg-lime/15 px-2 py-0.5 text-[10px] font-bold text-lime">✓ Más experiencia</span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Availability row */}
            <div className="grid" style={{ gridTemplateColumns: `160px repeat(${selected.length}, 1fr)` }}>
              <div className="flex items-center gap-2 bg-bg-raised/30 p-4 text-sm font-medium text-ink-muted">
                <span className="text-base">📅</span>
                <span className="text-xs">Disponibilidad Sept</span>
              </div>
              {dataMap.map(({ artist, data }) => (
                <div key={artist.id} className="border-l border-line/50 bg-bg-raised/30 p-3">
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {SEP_DAYS.map((day) => {
                      const isBooked = data.bookedDays.includes(day);
                      return (
                        <div
                          key={day}
                          title={`Día ${day}: ${isBooked ? 'Reservado' : 'Disponible'}`}
                          className={`h-2 w-2 rounded-full ${isBooked ? 'bg-coral/60' : 'bg-lime/60'}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-ink-muted">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lime/60" /> Libre</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-coral/60" /> Reservado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="mt-8 rounded-card border border-lime/30 bg-lime/5 p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-lime" />
            <h2 className="font-display text-lg font-bold text-lime">Recomendación MusicOn</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-primary">
            Basado en precio, rating y disponibilidad, recomendamos a <span className="font-bold text-lime">{recommended.name}</span> para tu evento. Tiene el mejor balance entre calidad y precio.
          </p>
          <button
            onClick={() => navigate(`/booking?id=${recommended.id}`)}
            className="mt-4 flex items-center gap-2 rounded-pill bg-lime px-5 py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
          >
            Reservar {recommended.name} <ArrowLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>

        {/* Clear selection */}
        <div className="mt-6 text-center">
          <button onClick={clear} className="text-sm font-medium text-ink-muted transition hover:text-coral">
            Limpiar selección
          </button>
        </div>
      </div>
    </div>
  );
}

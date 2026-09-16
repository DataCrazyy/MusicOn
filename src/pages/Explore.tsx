import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import ArtistCardLite from '@/components/ArtistCardLite';
import { listArtists, type DbArtist } from '@/lib/artists';

type SortBy = 'price_asc' | 'price_desc' | 'recent';

const BUDGETS = [
  { label: 'Cualquier presupuesto', value: Infinity },
  { label: 'Hasta Bs 500', value: 500 },
  { label: 'Hasta Bs 1.000', value: 1000 },
  { label: 'Hasta Bs 2.000', value: 2000 },
  { label: 'Hasta Bs 5.000', value: 5000 },
];

export default function Explore() {
  const [artists, setArtists] = useState<DbArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');
  const [genre, setGenre] = useState('All');
  const [maxBudget, setMaxBudget] = useState(Infinity);
  const [sort, setSort] = useState<SortBy>('recent');

  useEffect(() => {
    listArtists()
      .then(setArtists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => ['All', ...Array.from(new Set(artists.map((a) => a.genre)))], [artists]);
  const cities = useMemo(() => ['All', ...Array.from(new Set(artists.map((a) => a.city)))], [artists]);

  function applySort(list: DbArtist[]) {
    if (sort === 'price_asc') return [...list].sort((a, b) => a.price_from - b.price_from);
    if (sort === 'price_desc') return [...list].sort((a, b) => b.price_from - a.price_from);
    return list;
  }

  const filtered = useMemo(() => {
    const result = artists.filter((a) => {
      const matchesQuery =
        query.trim() === '' ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase());
      const matchesCity = city === 'All' || a.city === city;
      const matchesGenre = genre === 'All' || a.genre === genre;
      const matchesBudget = a.price_from <= maxBudget;
      return matchesQuery && matchesCity && matchesGenre && matchesBudget;
    });

    return applySort(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artists, query, city, genre, maxBudget, sort]);

  // Si los filtros no dan resultados, sugerimos los artistas más cercanos posible
  // (relajando primero el presupuesto y el género, para no dejar al cliente sin nada que ver).
  const suggestions = useMemo(() => {
    if (filtered.length > 0) return [];
    const relaxed = artists.filter((a) => {
      const matchesQuery =
        query.trim() === '' ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase());
      const matchesCity = city === 'All' || a.city === city;
      return matchesQuery && matchesCity;
    });
    const pool = relaxed.length > 0 ? relaxed : artists;
    return applySort(pool).slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, artists, query, city, sort]);

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-1 font-display text-3xl font-bold text-ink-primary">Explorar artistas</h1>
        <p className="mb-6 text-sm text-ink-muted">Cuéntanos qué buscas y te mostramos las mejores opciones.</p>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-pill border border-line bg-bg-surface py-2.5 pl-9 pr-4 text-sm text-ink-primary outline-none focus:border-lime"
            />
          </div>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-pill border border-line bg-bg-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'Todas las ciudades' : c}
              </option>
            ))}
          </select>

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="rounded-pill border border-line bg-bg-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g === 'All' ? 'Todos los géneros' : g}
              </option>
            ))}
          </select>

          <select
            value={maxBudget}
            onChange={(e) => setMaxBudget(Number(e.target.value))}
            className="rounded-pill border border-line bg-bg-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
          >
            {BUDGETS.map((b) => (
              <option key={b.label} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortBy)}
            className="rounded-pill border border-line bg-bg-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
          >
            <option value="recent">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando artistas...
          </div>
        )}

        {error && (
          <div className="rounded-card border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            No pudimos cargar los artistas: {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div>
            <p className="mb-6 text-sm text-ink-muted">No encontramos artistas con esos filtros exactos.</p>
            {suggestions.length > 0 && (
              <>
                <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-primary">
                  <Sparkles className="h-4 w-4 text-lime" /> Puede que te interesen estos artistas
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((artist) => (
                    <ArtistCardLite key={artist.id} artist={artist} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink-muted">{filtered.length} artistas encontrados</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((artist) => (
                <ArtistCardLite key={artist.id} artist={artist} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

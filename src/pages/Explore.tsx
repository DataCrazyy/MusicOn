import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import ArtistCardLite from '@/components/ArtistCardLite';
import { listArtists, type DbArtist } from '@/lib/artists';

type SortBy = 'price_asc' | 'price_desc' | 'recent';

export default function Explore() {
  const [artists, setArtists] = useState<DbArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState<SortBy>('recent');

  useEffect(() => {
    listArtists()
      .then(setArtists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(
    () => ['All', ...Array.from(new Set(artists.map((a) => a.genre)))],
    [artists]
  );

  const filtered = useMemo(() => {
    let result = artists.filter((a) => {
      const matchesQuery =
        query.trim() === '' ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase());
      const matchesGenre = genre === 'All' || a.genre === genre;
      return matchesQuery && matchesGenre;
    });

    if (sort === 'price_asc') result = [...result].sort((a, b) => a.price_from - b.price_from);
    if (sort === 'price_desc') result = [...result].sort((a, b) => b.price_from - a.price_from);

    return result;
  }, [artists, query, genre, sort]);

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink-primary">Explorar artistas</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="w-full rounded-pill border border-line bg-bg-surface py-2.5 pl-9 pr-4 text-sm text-ink-primary outline-none focus:border-lime"
            />
          </div>

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
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-ink-muted">
            No encontramos artistas con esos filtros.
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

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, MapPin, Star, X, ShieldCheck, FileText, Lock, Clock, Sparkles, Loader2 } from 'lucide-react';
import { ARTISTS, GENRES, CITIES, type Genre, type Artist } from '@/data';
import { hasActiveCampaign } from '@/campaigns';
import ArtistCard from '@/components/ArtistCard';
import ComboBuilder from '@/components/ComboBuilder';
import ComparisonBar from '@/components/ComparisonBar';

type ViewMode = 'grid' | 'list' | 'map';
type SortBy = 'rating' | 'price-low' | 'price-high' | 'reviews';

const SUGGESTION_CHIPS = [
  'DJ para boda',
  'Chef privado',
  'Fotógrafo con drone',
  'Animador fiesta',
];

const GENRE_PRIORITY_MAP: Record<string, Genre[]> = {
  wedding: ['Rock', 'Jazz', 'Classical', 'Folk', 'Acoustic', 'Pop'],
  dj: ['Electronic', 'Hip-Hop'],
  chef: [],
  photo: [],
};

function parseAISearch(text: string): {
  filtered: Artist[];
  budget: number | null;
  intent: 'wedding' | 'dj' | 'chef' | 'photo' | 'general';
} {
  const lower = text.toLowerCase();
  const budgetMatch = lower.match(/\$(\d+)|presupuesto\s*(?:de)?\s*(\d+)|(\d{3,})/);
  const budget = budgetMatch
    ? parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3], 10)
    : null;

  let intent: 'wedding' | 'dj' | 'chef' | 'photo' | 'general' = 'general';

  if (/(boda|matrimonio|casamiento|casarse|novios|quincea|quinceañera)/.test(lower)) {
    intent = 'wedding';
  } else if (/(dj|electr[oó]nica|house|techno|electronica|bailable|baile|discoteca|fiesta)/.test(lower)) {
    intent = 'dj';
  } else if (/(chef|comida|cena|gastronom|cocina|catering|banquete)/.test(lower)) {
    intent = 'chef';
  } else if (/(foto|fotograf|drone|c[aá]mara|sesi[oó]n de fotos|cobertura)/.test(lower)) {
    intent = 'photo';
  }

  let result = ARTISTS.filter((a) => {
    if (budget !== null && a.priceFrom > budget) return false;
    return true;
  });

  const priorityGenres = GENRE_PRIORITY_MAP[intent] || [];

  if (intent === 'wedding') {
    result = [...result].sort((a, b) => {
      const aScore = (a.tags.some((t) => /wedding|boda|ceremon/i.test(t)) ? 3 : 0)
        + (priorityGenres.includes(a.genre) ? 2 : 0)
        + (a.verified ? 1 : 0);
      const bScore = (b.tags.some((t) => /wedding|boda|ceremon/i.test(t)) ? 3 : 0)
        + (priorityGenres.includes(b.genre) ? 2 : 0)
        + (b.verified ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return b.rating - a.rating;
    });
  } else if (intent === 'dj') {
    result = [...result].sort((a, b) => {
      const aScore = (a.genre === 'Electronic' || a.genre === 'Hip-Hop' ? 3 : 0)
        + (a.tags.some((t) => /club|party|dj|electr/i.test(t)) ? 2 : 0)
        + (a.verified ? 1 : 0);
      const bScore = (b.genre === 'Electronic' || b.genre === 'Hip-Hop' ? 3 : 0)
        + (b.tags.some((t) => /club|party|dj|electr/i.test(t)) ? 2 : 0)
        + (b.verified ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return b.rating - a.rating;
    });
  } else if (intent === 'chef') {
    result = [...result].sort((a, b) => {
      if (a.priceFrom !== b.priceFrom) return a.priceFrom - b.priceFrom;
      return b.rating - a.rating;
    });
  } else if (intent === 'photo') {
    result = [...result].sort((a, b) => {
      const aScore = a.verified ? 1 : 0;
      const bScore = b.verified ? 1 : 0;
      if (bScore !== aScore) return bScore - aScore;
      return b.reviews - a.reviews;
    });
  } else {
    result = [...result].sort((a, b) => b.rating - a.rating);
  }

  return { filtered: result, budget, intent };
}

export default function Explore() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | 'All'>('All');
  const [city, setCity] = useState('All');
  const [view, setView] = useState<ViewMode>('grid');
  const [sort, setSort] = useState<SortBy>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [onlyCampaigns, setOnlyCampaigns] = useState(false);

  // AI search state — unified with the single search bar
  const [aiActive, setAiActive] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<Artist[] | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAISearch = (text: string) => {
    if (!text.trim() || text.trim().length < 2) {
      setAiActive(false);
      setAiResults(null);
      setAiSearching(false);
      return;
    }
    setAiActive(true);
    setAiSearching(false);
    setAiResults(null);

    // Show "Buscando con IA..." indicator after 400ms debounce
    if (searchingTimerRef.current) clearTimeout(searchingTimerRef.current);
    searchingTimerRef.current = setTimeout(() => {
      setAiSearching(true);
    }, 400);

    // Show results after 800ms
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const { filtered } = parseAISearch(text);
      setAiResults(filtered);
      setAiSearching(false);
      if (searchingTimerRef.current) clearTimeout(searchingTimerRef.current);
    }, 800);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    runAISearch(val);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    runAISearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setAiActive(false);
    setAiResults(null);
    setAiSearching(false);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (searchingTimerRef.current) clearTimeout(searchingTimerRef.current);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (searchingTimerRef.current) clearTimeout(searchingTimerRef.current);
    };
  }, []);

  // Normal filter (used when AI search is not active)
  const filtered = useMemo(() => {
    let result = ARTISTS.filter((a) => {
      if (query) {
        const q = query.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.genre.toLowerCase().includes(q) && !a.city.toLowerCase().includes(q))
          return false;
      }
      if (genre !== 'All' && a.genre !== genre) return false;
      if (city !== 'All' && a.city !== city) return false;
      if (a.priceFrom > maxPrice) return false;
      if (onlyCampaigns && !hasActiveCampaign(a.id)) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price-low') return a.priceFrom - b.priceFrom;
      if (sort === 'price-high') return b.priceFrom - a.priceFrom;
      return b.reviews - a.reviews;
    });

    return result;
  }, [query, genre, city, maxPrice, sort]);

  const activeFilters = (genre !== 'All' ? 1 : 0) + (city !== 'All' ? 1 : 0) + (maxPrice < 5000 ? 1 : 0);

  const clearFilters = () => {
    setGenre('All');
    setCity('All');
    setMaxPrice(5000);
  };

  const isAISearchActive = aiActive && query.trim().length >= 2;
  const aiRecommendedIds = aiResults ? new Set(aiResults.slice(0, 2).map((a) => a.id)) : new Set<string>();
  const displayResults = isAISearchActive && aiResults !== null ? aiResults : filtered;

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Unified search bar */}
      <div className="sticky top-[3.5rem] z-30 border-b border-line bg-bg-base/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Single search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Describí tu evento o buscá por nombre, género, ciudad..."
                className="w-full rounded-pill border border-line bg-bg-surface py-3 pl-11 pr-20 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime/30"
              />
              {/* AI indicator on right side */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {aiSearching && (
                  <span className="flex items-center gap-1 text-xs font-medium text-lime">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Buscando con IA...
                  </span>
                )}
                {query && !aiSearching && (
                  <button
                    onClick={clearSearch}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-coral"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative flex items-center gap-2 rounded-pill border border-line bg-bg-surface px-4 py-3 text-sm font-medium text-ink-primary transition hover:border-lime/30"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilters > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-xs font-bold text-bg-base">
                    {activeFilters}
                  </span>
                )}
              </button>
              <div className="flex rounded-pill border border-line bg-bg-surface p-1">
                {(['grid', 'list', 'map'] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`flex h-8 w-8 items-center justify-center rounded-pill transition ${
                      view === v ? 'bg-lime text-bg-base' : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    {v === 'grid' && <LayoutGrid className="h-4 w-4" />}
                    {v === 'list' && <List className="h-4 w-4" />}
                    {v === 'map' && <MapPin className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestion chips */}
          {!isAISearchActive && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
              <button
                onClick={() => setOnlyCampaigns(!onlyCampaigns)}
                className={`flex-shrink-0 whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-medium transition ${
                  onlyCampaigns
                    ? 'bg-violet/20 border border-violet/40 text-violet'
                    : 'border border-line bg-bg-raised text-ink-muted hover:border-violet/40 hover:text-violet'
                }`}
              >
                🎵 Con campaña activa
              </button>
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSuggestionClick(chip)}
                  className="flex-shrink-0 whitespace-nowrap rounded-pill border border-line bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-lime/40 hover:text-lime"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {showFilters && (
            <div className="mt-4 animate-slide-up rounded-card border border-line bg-bg-surface p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink-primary">Filters</h3>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-ink-muted hover:text-lime">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-ink-muted">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as Genre | 'All')}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2 text-sm text-ink-primary focus:border-lime/50 focus:outline-none"
                  >
                    <option value="All">All genres</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-ink-muted">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-input border border-line bg-bg-raised px-3 py-2 text-sm text-ink-primary focus:border-lime/50 focus:outline-none"
                  >
                    <option value="All">All cities</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-ink-muted">
                    Max price: ${maxPrice.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min={200}
                    max={5000}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">
            <span className="font-bold text-ink-primary">{displayResults.length}</span> artists found
            {isAISearchActive && !aiSearching && aiResults !== null && aiResults.length > 0 && (
              <span className="ml-2 text-lime">· Top 2 con ✨ Recomendado</span>
            )}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortBy)}
            className="rounded-pill border border-line bg-bg-surface px-4 py-2 text-sm font-medium text-ink-primary focus:border-lime/50 focus:outline-none"
          >
            <option value="rating">Highest rated</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="reviews">Most reviewed</option>
          </select>
        </div>

        {/* AI loading state */}
        {isAISearchActive && aiSearching && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-card border border-lime/20 bg-lime/5 px-4 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-lime" />
            <span className="text-sm font-medium text-ink-primary">Buscando con IA...</span>
          </div>
        )}

        {/* Results grid */}
        {isAISearchActive ? (
          !aiSearching && aiResults !== null && (
            <>
              {view === 'grid' && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {aiResults.map((a) => (
                    <ArtistCard key={a.id} artist={a} aiRecommended={aiRecommendedIds.has(a.id)} />
                  ))}
                </div>
              )}
              {view === 'list' && (
                <div className="space-y-3">
                  {aiResults.map((a) => (
                    <ArtistCard key={a.id} artist={a} view="list" aiRecommended={aiRecommendedIds.has(a.id)} />
                  ))}
                </div>
              )}
              {view === 'map' && (
                <div className="relative overflow-hidden rounded-card border border-line bg-bg-surface" style={{ height: '600px' }}>
                  <MapView artists={aiResults} />
                </div>
              )}
              {aiResults.length === 0 && (
                <div className="rounded-card border border-line bg-bg-surface p-12 text-center">
                  <p className="text-lg font-medium text-ink-primary">No encontramos artistas para tu búsqueda</p>
                  <button onClick={clearSearch} className="mt-4 rounded-pill bg-lime px-5 py-2 text-sm font-bold text-bg-base transition hover:bg-lime-dark">
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          <>
            {view === 'grid' && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((a) => <ArtistCard key={a.id} artist={a} />)}
              </div>
            )}
            {view === 'list' && (
              <div className="space-y-3">
                {filtered.map((a) => <ArtistCard key={a.id} artist={a} view="list" />)}
              </div>
            )}
            {view === 'map' && (
              <div className="relative overflow-hidden rounded-card border border-line bg-bg-surface" style={{ height: '600px' }}>
                <MapView artists={filtered} />
              </div>
            )}
            {filtered.length === 0 && (
              <div className="rounded-card border border-line bg-bg-surface p-12 text-center">
                <p className="text-lg font-medium text-ink-primary">No artists found</p>
                <p className="mt-1 text-sm text-ink-muted">Try adjusting your search or filters.</p>
                <button onClick={clearFilters} className="mt-4 rounded-pill bg-lime px-5 py-2 text-sm font-bold text-bg-base">
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Combo builder */}
      <ComboBuilder />

      {/* Trust section */}
      <TrustSection />

      {/* Floating comparison bar */}
      <ComparisonBar />
    </div>
  );
}

function TrustSection() {
  const cards = [
    { icon: FileText, title: 'Contratos digitales', desc: 'Cada reserva genera un contrato vinculante con términos claros y firmas digitales.' },
    { icon: Lock, title: 'Pago en escrow', desc: 'Tu dinero se retiene de forma segura hasta que el evento se completa con éxito.' },
    { icon: ShieldCheck, title: 'Reseñas verificadas', desc: 'Solo clientes que realmente reservaron pueden dejar reseñas. Cero reseñas falsas.' },
    { icon: Clock, title: 'Soporte 24/7', desc: 'Nuestro equipo está disponible en cualquier momento ante cualquier imprevisto.' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-card border border-line bg-bg-surface p-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-pill bg-lime/10 px-4 py-1.5">
            <ShieldCheck className="h-4 w-4 text-lime" />
            <span className="text-sm font-bold text-lime">Artistas verificados por MusicOn</span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-ink-primary">Reservá con total confianza</h2>
          <p className="mt-2 text-sm text-ink-muted">Cada artista verificado pasa por nuestro proceso de revisión de identidad, calidad y profesionalismo.</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.title} className="group rounded-xl border border-line bg-bg-raised p-5 transition hover:border-lime/30 glow-lime-hover">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10 transition group-hover:bg-lime/20">
                <card.icon className="h-6 w-6 text-lime" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-ink-primary">{card.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapView({ artists }: { artists: typeof ARTISTS }) {
  const cityCoords: Record<string, { x: number; y: number }> = {
    'Austin, TX': { x: 52, y: 68 },
    'New Orleans, LA': { x: 56, y: 72 },
    'Los Angeles, CA': { x: 18, y: 58 },
    'San Francisco, CA': { x: 16, y: 42 },
    'Chicago, IL': { x: 60, y: 42 },
    'Portland, OR': { x: 14, y: 28 },
    'Atlanta, GA': { x: 64, y: 64 },
    'Nashville, TN': { x: 58, y: 56 },
    'Denver, CO': { x: 42, y: 52 },
    'Miami, FL': { x: 68, y: 78 },
    'Memphis, TN': { x: 56, y: 56 },
    'Brooklyn, NY': { x: 76, y: 38 },
  };

  return (
    <div className="relative h-full w-full bg-bg-base">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #2A2A38 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <path d="M 0 350 Q 200 320 400 340 T 800 330" stroke="#1A1A22" strokeWidth="2" fill="none" />
        <path d="M 100 0 Q 120 200 100 400 T 120 600" stroke="#1A1A22" strokeWidth="2" fill="none" />
      </svg>
      {artists.map((a) => {
        const coords = cityCoords[a.city] || { x: 50, y: 50 };
        return (
          <a
            key={a.id}
            href={`/profile/${a.id}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime ring-4 ring-lime/20 transition group-hover:scale-125">
              <MapPin className="h-5 w-5 text-bg-base" fill="currentColor" />
            </div>
            <div className="absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs font-medium text-ink-primary group-hover:block">
              <div className="font-bold">{a.name}</div>
              <div className="flex items-center gap-1 text-ink-muted">
                <Star className="h-3 w-3 text-amber" fill="currentColor" /> {a.rating} · ${a.priceFrom}
              </div>
            </div>
          </a>
        );
      })}
      <div className="absolute bottom-4 left-4 rounded-card border border-line bg-bg-elevated/90 p-3 backdrop-blur">
        <p className="text-xs font-bold text-ink-primary">{artists.length} artists on map</p>
        <p className="text-xs text-ink-muted">Hover pins for details</p>
      </div>
    </div>
  );
}

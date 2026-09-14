import { Link } from 'react-router-dom';
import { Star, BadgeCheck, MapPin, Users, Zap, Sparkles, GitCompare } from 'lucide-react';
import type { Artist } from '@/data';
import { useCompare } from '@/components/CompareContext';
import { hasActiveCampaign } from '@/campaigns';
import { useToast } from '@/components/Toast';

type Props = {
  artist: Artist;
  view?: 'grid' | 'list';
  aiRecommended?: boolean;
};

export default function ArtistCard({ artist, view = 'grid', aiRecommended = false }: Props) {
  const { isSelected, toggle, canAdd } = useCompare();
  const { showToast } = useToast();
  const selected = isSelected(artist.id);
  const hasCampaign = hasActiveCampaign(artist.id);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(artist);
    if (!added && !selected) {
      showToast('Máximo 3 artistas para comparar');
    }
  };

  const compareButton = (
    <button
      onClick={handleCompareClick}
      className={`flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium transition ${
        selected
          ? 'bg-lime/15 text-lime'
          : 'text-ink-muted hover:text-lime'
      }`}
    >
      <GitCompare className="h-3.5 w-3.5" />
      {selected ? '✓ Comparando' : '+ Comparar'}
    </button>
  );

  if (view === 'list') {
    return (
      <div
        className={`glow-lime-hover group relative flex gap-4 rounded-card border bg-bg-surface p-4 transition hover:border-lime/40 hover:bg-bg-raised ${
          selected ? 'border-lime/50 ring-1 ring-lime/30' : 'border-line'
        }`}
      >
        <Link to={`/profile/${artist.id}`} className="flex flex-1 gap-4">
          <img
            src={artist.photo}
            alt={artist.name}
            className="h-20 w-28 flex-shrink-0 rounded-lg object-cover"
          />
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold text-ink-primary group-hover:text-lime">
                {artist.name}
              </h3>
              {artist.verified && <BadgeCheck className="h-4 w-4 text-lime" />}
              {aiRecommended && (
                <span className="flex items-center gap-1 rounded-pill bg-gradient-to-r from-lime to-lime-dark px-2 py-0.5 text-xs font-bold text-bg-base">
                  <Sparkles className="h-3 w-3" /> IA
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {artist.city}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber" fill="currentColor" /> {artist.rating} ({artist.reviews})
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {artist.members} member{artist.members > 1 ? 's' : ''}
              </span>
            </div>
            <p className="mt-2 line-clamp-1 text-sm text-ink-muted">{artist.bio}</p>
          </div>
          <div className="flex flex-col items-end justify-center">
            <span className="font-display text-lg font-bold text-lime">
              ${artist.priceFrom}
            </span>
            <span className="text-xs text-ink-muted">per {artist.pricePer}</span>
            {artist.proTier && (
              <span className="mt-1 flex items-center gap-1 rounded-pill bg-violet/15 px-2 py-0.5 text-xs font-medium text-violet">
                <Zap className="h-3 w-3" /> Pro
              </span>
            )}
          </div>
        </Link>
        <div className="flex flex-col items-end justify-end">
          {compareButton}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glow-lime-hover group relative overflow-hidden rounded-card border bg-bg-surface transition hover:border-lime/40 hover:bg-bg-raised ${
        selected ? 'border-lime/50 ring-1 ring-lime/30' : 'border-line'
      }`}
    >
      <Link to={`/profile/${artist.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={artist.photo}
            alt={artist.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-pill bg-bg-base/70 px-2.5 py-1 text-xs font-medium text-ink-primary backdrop-blur">
              {artist.genre}
            </span>
            {artist.verified && (
              <span className="flex items-center gap-1 rounded-pill bg-lime/90 px-2 py-1 text-xs font-bold text-bg-base backdrop-blur">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
            {hasCampaign && (
              <span className="flex items-center gap-1 rounded-pill bg-violet/90 px-2 py-1 text-xs font-bold text-white backdrop-blur">
                💜 Apoyar
              </span>
            )}
            {aiRecommended && (
              <span className="flex items-center gap-1 rounded-pill bg-gradient-to-r from-lime to-lime-dark px-2.5 py-1 text-xs font-bold text-bg-base shadow-lg shadow-lime/20">
                <Sparkles className="h-3 w-3" /> Recomendado por IA
              </span>
            )}
          </div>
          {artist.proTier && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-pill bg-violet px-2 py-1 text-xs font-bold text-white">
              <Zap className="h-3 w-3" /> Pro
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-display text-lg font-bold text-ink-primary group-hover:text-lime">
            {artist.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-ink-muted">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {artist.city.split(',')[0]}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber" fill="currentColor" /> {artist.rating}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{artist.bio}</p>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <div>
              <span className="font-display text-lg font-bold text-lime">
                ${artist.priceFrom}
              </span>
              <span className="text-xs text-ink-muted"> /{artist.pricePer}</span>
            </div>
            <span className="text-xs text-ink-muted">
              {artist.reviews} reviews
            </span>
          </div>
        </div>
      </Link>
      {/* Compare checkbox at bottom */}
      <div className="border-t border-line/50 px-4 py-2">
        {compareButton}
      </div>
    </div>
  );
}

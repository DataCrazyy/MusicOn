import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Users } from 'lucide-react';
import type { DbArtist } from '@/lib/artists';
import { formatPrice } from '@/lib/format';

export default function ArtistCard({ artist }: { artist: DbArtist }) {
  return (
    <Link
      to={`/profile/${artist.id}`}
      className="glow-lime-hover group relative flex flex-col overflow-hidden rounded-card border border-line bg-bg-surface transition hover:border-lime/40 hover:bg-bg-raised"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={artist.photo_url ?? undefined}
          alt={artist.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {artist.verified && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-pill bg-bg-base/90 px-2.5 py-1 text-xs font-semibold text-lime backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5" /> Verificado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-ink-primary group-hover:text-lime">
            {artist.name}
          </h3>
          <span className="whitespace-nowrap text-sm font-bold text-ink-primary">
            {formatPrice(artist.price_from)}
            <span className="text-xs font-normal text-ink-muted">
              /{artist.price_per === 'hour' ? 'hora' : 'evento'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="rounded-pill bg-bg-raised px-2 py-0.5">{artist.genre}</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {artist.city}
          </span>
          {artist.members > 1 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {artist.members}
            </span>
          )}
        </div>

        {artist.bio && (
          <p className="line-clamp-2 text-sm text-ink-muted">{artist.bio}</p>
        )}
      </div>
    </Link>
  );
}

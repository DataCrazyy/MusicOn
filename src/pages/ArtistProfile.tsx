import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, MapPin, Users, Loader2, Instagram, Facebook, Music2, Wrench } from 'lucide-react';
import { getArtistById, type DbArtist } from '@/lib/artists';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/lib/AuthContext';
import { toSpotifyEmbedUrl, spotifyEmbedHeight, toYouTubeEmbedUrl } from '@/lib/embeds';
import ShareButton from '@/components/ShareButton';

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [artist, setArtist] = useState<DbArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getArtistById(id)
      .then(setArtist)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-ink-muted">
        <p>No encontramos este artista.</p>
        <Link to="/explore" className="text-lime hover:underline">
          Volver a explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/explore" className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <ShareButton
            title={artist.name}
            text={`Mira a ${artist.name} en MusicOn`}
            url={window.location.href}
            label="Compartir"
          />
        </div>

        <div className="overflow-hidden rounded-card border border-line bg-bg-surface">
          <div className="aspect-[16/9] w-full overflow-hidden">
            <img src={artist.photo_url ?? undefined} alt={artist.name} className="h-full w-full object-cover" />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl font-bold text-ink-primary">{artist.name}</h1>
                  {artist.verified && (
                    <span className="flex items-center gap-1 rounded-pill bg-lime/10 px-2.5 py-1 text-xs font-semibold text-lime">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verificado
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                  <span className="rounded-pill bg-bg-raised px-2.5 py-1">{artist.genre}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {artist.city}
                  </span>
                  {artist.members > 1 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {artist.members} integrantes
                    </span>
                  )}
                </div>
                {(artist.instagram_url || artist.tiktok_url || artist.facebook_url) && (
                  <div className="mt-3 flex items-center gap-3">
                    {artist.instagram_url && (
                      <a
                        href={artist.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-muted transition hover:text-lime"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {artist.tiktok_url && (
                      <a
                        href={artist.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-muted transition hover:text-lime"
                        aria-label="TikTok"
                      >
                        <Music2 className="h-5 w-5" />
                      </a>
                    )}
                    {artist.facebook_url && (
                      <a
                        href={artist.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-muted transition hover:text-lime"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="font-display text-2xl font-bold text-ink-primary">
                  {formatPrice(artist.price_from)}
                  <span className="text-sm font-normal text-ink-muted">
                    /{artist.price_per === 'hour' ? 'hora' : 'evento'}
                  </span>
                </p>
                {artist.price_per === 'hour' && artist.duration_hours && (
                  <p className="text-xs text-ink-muted">Show de ~{artist.duration_hours}h</p>
                )}
              </div>
            </div>

            {artist.bio && <p className="mt-6 leading-relaxed text-ink-muted">{artist.bio}</p>}

            {artist.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {artist.tags.map((tag) => (
                  <span key={tag} className="rounded-pill bg-bg-raised px-3 py-1 text-xs text-ink-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {artist.equipment?.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 flex items-center gap-1.5 font-display text-sm font-bold text-ink-primary">
                  <Wrench className="h-4 w-4" /> Equipamiento incluido
                </h2>
                <div className="flex flex-wrap gap-2">
                  {artist.equipment.map((item) => (
                    <span
                      key={item}
                      className="rounded-pill border border-line px-3 py-1 text-xs text-ink-muted"
                    >
                      {item === 'Otro' && artist.equipment_other ? artist.equipment_other : item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {artist.gallery_urls?.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 font-display text-lg font-bold text-ink-primary">Galería</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {artist.gallery_urls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt={`Foto de ${artist.name}`}
                      className="h-32 w-32 flex-shrink-0 rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {(artist.spotify_url || artist.youtube_url) && (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {artist.spotify_url && toSpotifyEmbedUrl(artist.spotify_url) && (
                  <iframe
                    title="Spotify"
                    src={toSpotifyEmbedUrl(artist.spotify_url)!}
                    width="100%"
                    height={spotifyEmbedHeight(artist.spotify_url)}
                    style={{ borderRadius: 12, border: 'none' }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                )}
                {artist.youtube_url && toYouTubeEmbedUrl(artist.youtube_url) && (
                  <iframe
                    title="YouTube"
                    src={toYouTubeEmbedUrl(artist.youtube_url)!}
                    width="100%"
                    height={200}
                    style={{ borderRadius: 12, border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                )}
              </div>
            )}

            {user && artist.owner_id === user.id ? (
              <div className="mt-8 rounded-pill border border-line px-6 py-3.5 text-center text-sm font-semibold text-ink-muted">
                Este es tu perfil de artista
              </div>
            ) : (
              <Link
                to={`/reservar/${artist.id}`}
                className="mt-8 block w-full rounded-pill bg-lime px-6 py-3.5 text-center font-bold text-bg-base transition hover:bg-lime-dark"
              >
                Reservar
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

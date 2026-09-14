import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Star, BadgeCheck, MapPin, Users, Zap, Play, Pause, Heart, Share2,
  ArrowLeft, Shield, Clock, Music, TrendingUp, Award, DollarSign,
  ChevronRight, Headphones, X, Eye, Flame, AlertTriangle,
} from 'lucide-react';
import { getArtist, ARTISTS, PLEDGE_TIERS } from '@/data';
import { hasActiveCampaign } from '@/campaigns';
import { useToast } from '@/components/Toast';

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const artist = id ? getArtist(id) : undefined;
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  if (!artist) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-ink-primary">Artist not found</p>
          <Link to="/explore" className="mt-3 inline-block text-lime hover:underline">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const tracks = [
    { title: artist.topTrack.title, plays: artist.topTrack.plays, duration: '3:42' },
    { title: 'Late Night Drive', plays: Math.floor(artist.topTrack.plays * 0.6), duration: '4:15' },
    { title: 'Echoes', plays: Math.floor(artist.topTrack.plays * 0.4), duration: '3:08' },
  ];

  const reviews = [
    { name: 'Sarah M.', event: 'Wedding', rating: 5, text: 'Absolutely incredible. They read the room perfectly and kept everyone dancing all night.' },
    { name: 'David K.', event: 'Corporate Gala', rating: 5, text: 'Professional from start to finish. Easy communication and a stellar performance.' },
    { name: 'Jenny L.', event: 'Private Party', rating: 4, text: 'Great set and very accommodating with last-minute requests. Would book again.' },
  ];

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <div className="relative h-[400px] overflow-hidden">
        <img src={artist.photo} alt={artist.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-base/60 to-transparent" />

        <div className="absolute left-4 top-20 sm:left-6 lg:left-8">
          <Link
            to="/explore"
            className="flex items-center gap-2 rounded-pill bg-bg-base/60 px-4 py-2 text-sm font-medium text-ink-primary backdrop-blur transition hover:bg-bg-base/80"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="absolute right-4 top-20 flex gap-2 sm:right-6 lg:right-8">
          <button
            onClick={() => setLiked(!liked)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-base/60 backdrop-blur transition hover:bg-bg-base/80"
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-coral text-coral' : 'text-ink-primary'}`} />
          </button>
          <button
            onClick={() => showToast('Profile link copied')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-base/60 backdrop-blur transition hover:bg-bg-base/80"
          >
            <Share2 className="h-5 w-5 text-ink-primary" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="-mt-32 relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl font-extrabold text-ink-primary sm:text-5xl">
                {artist.name}
              </h1>
              {artist.verified && (
                <BadgeCheck className="h-7 w-7 text-lime" />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {artist.city}</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber" fill="currentColor" /> {artist.rating} ({artist.reviews} reviews)</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {artist.members} member{artist.members > 1 ? 's' : ''}</span>
              <span className="rounded-pill bg-bg-raised px-3 py-1 font-medium text-lime">{artist.genre}</span>
              {artist.proTier && (
                <span className="flex items-center gap-1 rounded-pill bg-violet/15 px-3 py-1 font-medium text-violet">
                  <Zap className="h-3.5 w-3.5" /> Pro
                </span>
              )}
            </div>
            {/* Social proof signals */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Eye className="h-3.5 w-3.5 text-ink-muted" />
                {profileViews(artist.id)} personas vieron este perfil hoy
              </span>
              <span className="flex items-center gap-1.5 rounded-pill bg-coral/10 px-3 py-1 text-xs font-medium text-coral">
                <Flame className="h-3.5 w-3.5" />
                {weeklyRequests(artist.id)} solicitudes esta semana
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/booking?id=${artist.id}`)}
              className="flex items-center gap-2 rounded-pill bg-lime px-6 py-3 font-bold text-bg-base transition hover:bg-lime-dark"
            >
              <DollarSign className="h-5 w-5" />
              Book Now
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 rounded-pill border border-line bg-bg-surface px-6 py-3 font-bold text-ink-primary transition hover:border-lime/40"
            >
              <MessageIcon />
              Message
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left: Bio, tracks, calendar */}
          <div className="space-y-6 lg:col-span-2">
            {/* Bio */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">About</h2>
              <p className="mt-3 leading-relaxed text-ink-muted">{artist.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {artist.tags.map((tag) => (
                  <span key={tag} className="rounded-pill bg-bg-raised px-3 py-1 text-xs font-medium text-ink-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Gallery — horizontal scroll on mobile, grid on desktop */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">Gallery</h2>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                {[artist.photo, ...ARTISTS.slice(1, 5).map((a) => a.photo)].slice(0, 6).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(img)}
                    className="group relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg md:h-auto md:w-auto md:aspect-square"
                  >
                    <img
                      src={img}
                      alt={`Gallery ${i + 1}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-bg-base/0 transition group-hover:bg-bg-base/30" />
                  </button>
                ))}
              </div>
            </section>

            {/* Top tracks */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">Top Tracks</h2>
              <div className="mt-4 space-y-2">
                {tracks.map((track, i) => (
                  <div
                    key={track.title}
                    className="group flex items-center gap-4 rounded-xl bg-bg-raised p-3 transition hover:bg-bg-elevated"
                  >
                    <button
                      onClick={() => setPlaying(!playing)}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime transition group-hover:bg-lime group-hover:text-bg-base"
                    >
                      {playing && i === 0 ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-primary">{track.title}</p>
                      <p className="text-xs text-ink-muted">{track.plays.toLocaleString()} plays</p>
                      {/* Pulsing progress bar when playing */}
                      {playing && i === 0 && (
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                          <div className="pulse-lime-glow h-full rounded-full bg-lime transition-all duration-1000" style={{ width: '45%' }} />
                        </div>
                      )}
                    </div>
                    {/* Mini equalizer */}
                    {playing && i === 0 && (
                      <div className="flex items-end gap-0.5 h-6">
                        {[0.4, 0.7, 0.3, 0.9, 0.5].map((h, idx) => (
                          <span
                            key={idx}
                            className="w-1 rounded-full bg-lime"
                            style={{
                              height: `${h * 100}%`,
                              animation: `growBar 0.${4 + idx}s ease infinite alternate`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-ink-muted">{track.duration}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Availability calendar */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink-primary">Availability</h2>
                <span className="flex items-center gap-1 text-xs text-ink-muted"><Clock className="h-3.5 w-3.5" /> Replies in ~2h</span>
              </div>
              <CalendarMini />
            </section>

            {/* Reviews */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink-primary">Reviews</h2>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-amber" fill="currentColor" />
                  <span className="font-display text-lg font-bold text-ink-primary">{artist.rating}</span>
                  <span className="text-sm text-ink-muted">/ 5</span>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.name} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-sm font-bold text-ink-primary">
                          {rev.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-primary">{rev.name}</p>
                          <p className="text-xs text-ink-muted">{rev.event}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 text-amber" fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-ink-muted">{rev.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Stats, pricing, escrow, pledge — below content on mobile */}
          <div className="space-y-6 md:mt-0">
            {/* Stats card */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Streaming Stats</h3>
              <div className="mt-4 space-y-3">
                <StatRow icon={Headphones} label="Spotify monthly" value={artist.spotifyMonthly.toLocaleString()} />
                <StatRow icon={TrendingUp} label="SoundCloud plays" value={artist.soundCloudPlays.toLocaleString()} />
                <StatRow icon={Music} label="Top track plays" value={artist.topTrack.plays.toLocaleString()} />
                <StatRow icon={Award} label="Endorsements" value={artist.endorsements.length > 0 ? artist.endorsements.join(', ') : 'None'} />
              </div>
            </section>

            {/* Pricing */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Pricing</h3>
              <div className="mt-3">
                <span className="font-display text-3xl font-bold text-lime">${artist.priceFrom}</span>
                <span className="text-sm text-ink-muted"> /{artist.pricePer}</span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">Travel radius: {artist.travelRadiusKm}km</p>
              {/* High demand warning */}
              {weeklyRequests(artist.id) >= 3 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber/10 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber" />
                  <p className="text-xs font-medium text-amber">
                    Alta demanda — solo 2 fechas libres en septiembre
                  </p>
                </div>
              )}
              <button
                onClick={() => navigate(`/booking?id=${artist.id}`)}
                className="mt-4 w-full rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark"
              >
                Request Booking
              </button>
            </section>

            {/* Escrow badge */}
            <section className="rounded-card border border-lime/20 bg-lime/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/15">
                  <Shield className="h-5 w-5 text-lime" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-ink-primary">Escrow Protected</p>
                  <p className="text-xs text-ink-muted">Your payment is held safely until the gig is done.</p>
                </div>
              </div>
            </section>

            {/* Support campaign */}
            {hasActiveCampaign(artist.id) && (
              <Link
                to={`/artista/${artist.id}/apoyar`}
                className="block rounded-card border border-violet/30 bg-gradient-to-br from-violet/10 to-lime/5 p-6 transition hover:border-violet/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💜</span>
                  <div>
                    <p className="font-display text-sm font-bold text-ink-primary">Apoyar proyecto</p>
                    <p className="text-xs text-ink-muted">Campaña activa de {artist.name}</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Pledge / Fan funding */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
                Become a Patron
              </h3>
              <p className="mt-1 text-xs text-ink-muted">{artist.activePledges} active pledges</p>
              <div className="mt-4 space-y-3">
                {PLEDGE_TIERS.map((tier) => (
                  <button
                    key={tier.amount}
                    onClick={() => showToast(`Pledged $${tier.amount}/mo to ${artist.name}!`)}
                    className="w-full rounded-xl border border-line bg-bg-raised p-3 text-left transition hover:border-lime/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg font-bold text-lime">${tier.amount}<span className="text-xs text-ink-muted">/mo</span></span>
                      <span className="text-xs text-ink-muted">{tier.backers} backers</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{tier.perks}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA bar on mobile */}
      <div className="fixed bottom-16 left-0 right-0 z-40 flex items-center gap-3 border-t border-line bg-bg-surface/95 p-3 backdrop-blur-xl md:hidden">
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-lime">${artist.priceFrom}<span className="text-sm text-ink-muted"> /{artist.pricePer}</span></p>
        </div>
        <button
          onClick={() => navigate(`/booking?id=${artist.id}`)}
          className="flex-1 rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark"
        >
          Reservar
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="animate-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-bg-base/90 backdrop-blur-md"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated text-ink-primary transition hover:bg-bg-raised"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightbox}
            alt="Gallery full view"
            className="max-h-[85vh] max-w-[90vw] rounded-card object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function StatRow({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-ink-muted">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="text-sm font-semibold text-ink-primary">{value}</span>
    </div>
  );
}

function MessageIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function profileViews(id: string): number {
  const num = parseInt(id.replace(/\D/g, ''), 10) || 1;
  return 8 + (num % 15);
}

function weeklyRequests(id: string): number {
  const num = parseInt(id.replace(/\D/g, ''), 10) || 1;
  return 2 + (num % 4);
}

function CalendarMini() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const booked = [3, 9, 14, 15, 21, 27];
  const today = 5;
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-primary">September 2026</span>
        <div className="flex gap-2">
          <button className="rounded-lg bg-bg-raised px-2 py-1 text-xs text-ink-muted hover:text-ink-primary">‹</button>
          <button className="rounded-lg bg-bg-raised px-2 py-1 text-xs text-ink-muted hover:text-ink-primary">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="py-1 text-xs font-medium text-ink-muted">{d}</span>
        ))}
        {days.map((day) => {
          if (day < 1 || day > 30) return <span key={day} />;
          const isBooked = booked.includes(day);
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`flex h-9 items-center justify-center rounded-lg text-sm transition ${
                isToday ? 'bg-lime font-bold text-bg-base'
                : isBooked ? 'bg-bg-raised text-coral line-through'
                : 'text-ink-primary hover:bg-bg-raised'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-lime" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-bg-raised" /> Booked</span>
      </div>
    </div>
  );
}

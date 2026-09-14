import { Link, useNavigate } from 'react-router-dom';
import { Music2, CalendarHeart, ArrowRight, Sparkles, Play, Star, Users } from 'lucide-react';
import { ARTISTS } from '@/data';
import { useState } from 'react';
import OnboardingModal, { isOnboardingComplete } from '@/components/OnboardingModal';

export default function Entry() {
  const featured = ARTISTS.slice(0, 4);
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleArtistClick = () => {
    if (isOnboardingComplete()) {
      navigate('/dashboard');
    } else {
      setShowOnboarding(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Split hero */}
      <section className="grid min-h-screen lg:grid-cols-2">
        {/* Left — Client */}
        <div className="animate-fade-in-up relative flex flex-col justify-between p-8 sm:p-12 lg:p-16" style={{ animationDelay: '0s' }}>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime">
              <Music2 className="h-6 w-6 text-bg-base" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-ink-primary">
              Music<span className="text-lime">On</span>
            </span>
          </div>

          <div className="py-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-pill bg-bg-raised px-3 py-1.5 text-sm text-ink-muted">
              <Sparkles className="h-4 w-4 text-lime" /> Find your perfect live music
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-ink-primary sm:text-6xl lg:text-7xl">
              Book live music
              <br />
              <span className="text-lime">in minutes.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
              Browse verified artists, compare quotes, and pay securely with
              escrow protection. From weddings to warehouse parties — the right
              sound is one click away.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="group flex items-center gap-2 rounded-pill bg-lime px-6 py-3.5 font-bold text-bg-base transition hover:bg-lime-dark"
              >
                Find Artists
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/wizard"
                className="flex items-center gap-2 rounded-pill border border-line bg-bg-surface px-6 py-3.5 font-bold text-ink-primary transition hover:border-lime/40"
              >
                <CalendarHeart className="h-5 w-5 text-lime" />
                Guided Booking
              </Link>
            </div>
            <div className="mt-10 flex gap-8">
              <div>
                <div className="font-display text-3xl font-bold text-ink-primary">12K+</div>
                <div className="text-sm text-ink-muted">Artists</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-ink-primary">48K+</div>
                <div className="text-sm text-ink-muted">Gigs booked</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-ink-primary">$2.1M</div>
                <div className="text-sm text-ink-muted">In escrow</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-ink-muted">© 2026 MusicOn. All rights reserved.</p>
        </div>

        {/* Right — Artist showcase */}
        <div className="animate-fade-in-up relative hidden overflow-hidden bg-bg-surface lg:block" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet/10 via-transparent to-lime/10" />
          <div className="relative grid h-full grid-cols-2 gap-4 p-8">
            {featured.map((artist, i) => (
              <div
                key={artist.id}
                className={`group relative overflow-hidden rounded-card ${i % 2 === 1 ? 'mt-12' : ''}`}
              >
                <img
                  src={artist.photo}
                  alt={artist.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-pill bg-lime px-2 py-0.5 text-xs font-bold text-bg-base">
                      {artist.genre}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-ink-primary">
                    {artist.name}
                  </h3>
                  <p className="text-sm text-ink-muted">{artist.city}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating player */}
          <div className="absolute bottom-8 left-8 right-8 flex items-center gap-3 rounded-card border border-line bg-bg-elevated/80 p-4 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime">
              <Play className="h-5 w-5 fill-bg-base text-bg-base" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-primary">Neon Dawn</p>
              <p className="text-xs text-ink-muted">The Midnight Set · 142K plays</p>
            </div>
            <div className="flex gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber" fill="currentColor" /> 4.9</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 4 pc</span>
            </div>
          </div>
        </div>
      </section>

      {/* Artist CTA banner */}
      <section className="border-t border-line bg-bg-surface px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink-primary">
              Are you an artist?
            </h2>
            <p className="mt-2 text-lg text-ink-muted">
              List your act, manage bookings, and get paid with built-in escrow.
              Join 12,000+ musicians already on MusicOn.
            </p>
          </div>
          <button
            onClick={handleArtistClick}
            className="flex flex-shrink-0 items-center gap-2 rounded-pill bg-violet px-6 py-3.5 font-bold text-white transition hover:bg-violet-dark"
          >
            List Your Act
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

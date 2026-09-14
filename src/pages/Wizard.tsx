import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, MapPin, Calendar, Users, DollarSign, Music, Sparkles } from 'lucide-react';
import { GENRES, CITIES, ARTISTS, type Genre } from '@/data';
import ArtistCard from '@/components/ArtistCard';
import { useToast } from '@/components/Toast';

const STEPS = ['Event', 'Location', 'Music', 'Budget', 'Match'] as const;

export default function Wizard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [displayStep, setDisplayStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eventType, setEventType] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState<Genre | ''>('');
  const [budget, setBudget] = useState(1500);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    const handleTouchEnd = () => {
      const delta = touchEndX.current - touchStartX.current;
      if (Math.abs(delta) < 50) return;
      if (delta > 0 && step > 0) {
        goToStep(step - 1, 'backward');
      } else if (delta < 0 && step < STEPS.length - 1 && canAdvance()) {
        goToStep(step + 1, 'forward');
      }
    };
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener('touchstart', (e) => { touchStartX.current = e.touches[0].clientX; });
    el.addEventListener('touchend', (e) => { touchEndX.current = e.changedTouches[0].clientX; handleTouchEnd(); });
    return () => {};
  }, [step]);

  const contentRef = useRef<HTMLDivElement>(null);

  const eventTypes = ['Wedding', 'Corporate Event', 'Private Party', 'Club Night', 'Festival', 'Ceremony'];

  const filtered = ARTISTS.filter((a) => {
    if (genre && a.genre !== genre) return false;
    if (city && a.city !== city) return false;
    return a.priceFrom <= budget;
  });

  const canAdvance = () => {
    if (step === 0) return eventType !== '';
    if (step === 1) return city !== '';
    if (step === 2) return genre !== '';
    return true;
  };

  const goToStep = (newStep: number, dir: 'forward' | 'backward') => {
    if (newStep === step || transitioning) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDirection(dir);
    setTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setDisplayStep(newStep);
      setStep(newStep);
      setTransitioning(false);
    }, 300);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      goToStep(step + 1, 'forward');
    } else {
      showToast('Match complete — sending you to results');
      navigate('/explore');
    }
  };

  const back = () => {
    if (step === 0) {
      navigate('/');
    } else {
      goToStep(step - 1, 'backward');
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const animationClass = transitioning
    ? direction === 'forward' ? 'animate-step-exit-left' : 'animate-step-exit-right'
    : 'animate-step-enter';

  const renderStep = (s: number) => {
    switch (s) {
      case 0:
        return (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
              <Calendar className="h-6 w-6 text-lime" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-primary">What type of event?</h2>
              <p className="text-sm text-ink-muted">We will tailor the recommendations.</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
              <MapPin className="h-6 w-6 text-lime" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-primary">Where is the event?</h2>
              <p className="text-sm text-ink-muted">Pick a city to find nearby artists.</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
              <Music className="h-6 w-6 text-lime" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-primary">What genre?</h2>
              <p className="text-sm text-ink-muted">Choose the vibe you want.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
              <DollarSign className="h-6 w-6 text-lime" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-primary">What is your budget?</h2>
              <p className="text-sm text-ink-muted">We will show artists within range.</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
              <Sparkles className="h-6 w-6 text-lime" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-primary">Your matches</h2>
              <p className="text-sm text-ink-muted">
                {filtered.length} artist{filtered.length !== 1 ? 's' : ''} found for {genre || 'any genre'} in {city || 'any city'}.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-ink-primary">
              Find your artist
            </h1>
            <span className="text-sm text-ink-muted">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-pill bg-bg-raised">
            <div
              className="h-full rounded-pill bg-lime transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between">
            {STEPS.map((label, i) => (
              <button
                key={label}
                onClick={() => i < step && goToStep(i, 'backward')}
                className={`flex items-center gap-1.5 text-xs font-medium transition ${
                  i <= step ? 'text-lime' : 'text-ink-muted'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  i < step ? 'bg-lime text-bg-base' : i === step ? 'bg-lime/20 text-lime ring-1 ring-lime' : 'bg-bg-raised'
                }`}>
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div ref={contentRef} className="overflow-hidden rounded-card border border-line bg-bg-surface p-6 sm:p-8">
          <div key={displayStep} className={animationClass}>
            {renderStep(displayStep)}

            {displayStep === 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setEventType(type)}
                    className={`flex min-h-[60px] items-center rounded-xl border p-4 text-left transition md:min-h-0 ${
                      eventType === type ? 'border-lime bg-lime/10' : 'border-line bg-bg-raised hover:border-lime/30'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${eventType === type ? 'text-lime' : 'text-ink-primary'}`}>
                      {type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {displayStep === 1 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`flex min-h-[60px] items-center rounded-xl border p-3 text-left text-sm font-medium transition md:min-h-0 ${
                      city === c ? 'border-lime bg-lime/10 text-lime' : 'border-line bg-bg-raised text-ink-primary hover:border-lime/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {displayStep === 2 && (
              <div className="flex flex-wrap gap-3">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`rounded-pill border px-4 py-2.5 text-sm font-semibold transition ${
                      genre === g
                        ? 'border-lime bg-lime text-bg-base'
                        : 'border-line bg-bg-raised text-ink-primary hover:border-lime/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            {displayStep === 3 && (
              <div className="py-8">
                <div className="mb-4 text-center">
                  <span className="font-display text-4xl font-bold text-lime">
                    ${budget.toLocaleString()}
                  </span>
                  <span className="text-ink-muted"> / event</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={5000}
                  step={100}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-xs text-ink-muted">
                  <span>$200</span>
                  <span>$5,000+</span>
                </div>
              </div>
            )}

            {displayStep === 4 && (
              <div>
                {filtered.length > 0 ? (
                  <div className="space-y-3">
                    {filtered.slice(0, 4).map((a) => (
                      <ArtistCard key={a.id} artist={a} view="list" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-line bg-bg-raised p-8 text-center">
                    <p className="text-ink-muted">
                      No matches for those filters. Try widening your budget or city.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={back}
            className="flex items-center gap-2 rounded-pill border border-line px-5 py-2.5 text-sm font-medium text-ink-muted transition hover:text-ink-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? 'Home' : 'Back'}
          </button>
          <button
            onClick={next}
            disabled={!canAdvance() || transitioning}
            className="flex items-center gap-2 rounded-pill bg-lime px-6 py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:opacity-30"
          >
            {step === STEPS.length - 1 ? 'See All Results' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

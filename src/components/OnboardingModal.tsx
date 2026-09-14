import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Music2, Headphones, UtensilsCrossed, Camera, PartyPopper, PersonStanding } from 'lucide-react';
import { ARTIST_CATEGORIES, type ArtistCategory } from '@/data';

const STORAGE_KEY = 'musicon_onboarding_complete';

const CATEGORY_ICONS: Record<ArtistCategory, typeof Music2> = {
  DJ: Headphones,
  Músico: Music2,
  Chef: UtensilsCrossed,
  Fotógrafo: Camera,
  Animador: PartyPopper,
  Bailarín: PersonStanding,
};

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export default function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ArtistCategory | ''>('');
  const [artistName, setArtistName] = useState('');
  const [city, setCity] = useState('');
  const [basePrice, setBasePrice] = useState('');

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onComplete();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-bg-base/95 p-4 backdrop-blur-md">
      <div className="animate-slide-up w-full max-w-md rounded-card border border-line bg-bg-surface p-6 shadow-2xl sm:p-8">
        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-lime' : i < step ? 'w-2 bg-lime/50' : 'w-2 bg-bg-elevated'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center">
            <div className="mb-4 text-5xl">🎧</div>
            <h2 className="font-display text-2xl font-extrabold text-ink-primary">Bienvenido a MusicOn</h2>
            <p className="mt-2 text-sm text-ink-muted">La plataforma que se preocupa por los artistas</p>
            <div className="mt-6 flex flex-col gap-2">
              {['✓ Bookings digitales', '✓ Pago protegido', '✓ Crecé con Pro'].map((pill) => (
                <div key={pill} className="flex items-center justify-center gap-2 rounded-pill bg-lime/10 px-4 py-2.5 text-sm font-medium text-lime">
                  {pill}
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-6 w-full rounded-pill bg-lime py-3.5 font-bold text-bg-base transition hover:bg-lime-dark"
            >
              Empezar
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-xl font-bold text-ink-primary">¿Qué tipo de artista sos?</h2>
            <p className="mt-1 text-sm text-ink-muted">Elegí tu categoría principal</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {ARTIST_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                      isSelected
                        ? 'border-lime bg-lime/10'
                        : 'border-line bg-bg-raised hover:border-lime/30'
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isSelected ? 'bg-lime/20 text-lime' : 'bg-bg-elevated text-ink-muted'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-sm font-semibold ${isSelected ? 'text-lime' : 'text-ink-primary'}`}>{cat}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!category}
              className="mt-6 w-full rounded-pill bg-lime py-3.5 font-bold text-bg-base transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-ink-muted"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-bold text-ink-primary">Tu perfil en 30 segundos</h2>
            <p className="mt-1 text-sm text-ink-muted">Con estos datos creamos tu perfil</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Nombre artístico</label>
                <input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Ej: DJ Mateo Rivera"
                  className="w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Ciudad</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Santa Cruz, Bolivia"
                  className="w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Precio base por evento (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-input border border-line bg-bg-raised py-3 pl-8 pr-4 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={finish}
              disabled={!artistName.trim() || !city.trim() || !basePrice.trim()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-pill bg-lime py-3.5 font-bold text-bg-base transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-ink-muted"
            >
              Crear mi perfil <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Music, DollarSign, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import Stepper, { type Step } from './Stepper';

type Props = {
  cities: string[];
  genres: string[];
  matchCount: number;
  eventType: string | null;
  onEventTypeChange: (v: string | null) => void;
  city: string;
  onCityChange: (v: string) => void;
  genre: string;
  onGenreChange: (v: string) => void;
  /** Presupuesto en Bs, Infinity representa "sin tope" (equivale al máximo del slider). */
  maxBudget: number;
  onMaxBudgetChange: (v: number) => void;
  onFinish: () => void;
  onSkip: () => void;
};

const EVENT_TYPES = ['Boda', 'Evento corporativo', 'Fiesta privada', 'Noche de club', 'Festival', 'Ceremonia'];
const MIN_BUDGET = 200;
const MAX_BUDGET = 5000;
const STEPS: Step[] = [
  { key: 'event', label: 'Evento' },
  { key: 'location', label: 'Ubicación' },
  { key: 'music', label: 'Música' },
  { key: 'budget', label: 'Presupuesto' },
  { key: 'match', label: 'Resultados' },
];

/**
 * Buscador guiado de Explorar: en vez de lanzar directo al listado completo, hace
 * preguntas paso a paso (evento, ubicación, género, presupuesto) para ir armando los
 * filtros progresivamente y mostrar cuántos artistas calzan antes de ver todo.
 */
export default function ExploreWizard({
  cities,
  genres,
  matchCount,
  eventType,
  onEventTypeChange,
  city,
  onCityChange,
  genre,
  onGenreChange,
  maxBudget,
  onMaxBudgetChange,
  onFinish,
  onSkip,
}: Props) {
  const [step, setStep] = useState(0);
  const budget = maxBudget === Infinity ? MAX_BUDGET : maxBudget;

  function next() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Stepper steps={STEPS} currentIndex={step} variant="compact" />
      </div>

      <div className="rounded-card border border-line bg-bg-surface p-6 sm:p-8">
        {step === 0 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-lime/15">
                <Calendar className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-primary">¿Qué tipo de evento es?</h2>
                <p className="text-sm text-ink-muted">Vamos a adaptar las recomendaciones.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onEventTypeChange(t);
                    next();
                  }}
                  className={`rounded-lg border px-4 py-3.5 text-left text-sm font-semibold transition ${
                    eventType === t
                      ? 'border-lime bg-lime/10 text-ink-primary'
                      : 'border-line text-ink-primary hover:border-lime/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-lime/15">
                <MapPin className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-primary">¿Dónde es el evento?</h2>
                <p className="text-sm text-ink-muted">Elige una ciudad para encontrar artistas cerca.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  onCityChange('All');
                  next();
                }}
                className={`rounded-lg border px-4 py-3.5 text-left text-sm font-semibold transition ${
                  city === 'All' ? 'border-lime bg-lime/10 text-ink-primary' : 'border-line text-ink-primary hover:border-lime/40'
                }`}
              >
                Cualquier ciudad
              </button>
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onCityChange(c);
                    next();
                  }}
                  className={`rounded-lg border px-4 py-3.5 text-left text-sm font-semibold transition ${
                    city === c ? 'border-lime bg-lime/10 text-ink-primary' : 'border-line text-ink-primary hover:border-lime/40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-lime/15">
                <Music className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-primary">¿Qué género buscas?</h2>
                <p className="text-sm text-ink-muted">Elige el estilo que va con tu evento.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onGenreChange('All');
                  next();
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  genre === 'All' ? 'border-lime bg-lime/10 text-ink-primary' : 'border-line text-ink-primary hover:border-lime/40'
                }`}
              >
                Cualquier género
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    onGenreChange(g);
                    next();
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    genre === g ? 'border-lime bg-lime/10 text-ink-primary' : 'border-line text-ink-primary hover:border-lime/40'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-lime/15">
                <DollarSign className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-primary">¿Cuál es tu presupuesto?</h2>
                <p className="text-sm text-ink-muted">Te mostramos artistas dentro de rango.</p>
              </div>
            </div>
            <div className="py-4 text-center">
              <p className="font-display text-3xl font-bold text-ink-primary">
                Bs {budget.toLocaleString('es-BO')}
                {budget >= MAX_BUDGET ? '+' : ''}
                <span className="text-base font-normal text-ink-muted"> / evento</span>
              </p>
              <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={100}
                value={budget}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onMaxBudgetChange(v >= MAX_BUDGET ? Infinity : v);
                }}
                className="mt-4 w-full accent-lime"
              />
              <div className="mt-1 flex justify-between text-xs text-ink-muted">
                <span>Bs {MIN_BUDGET}</span>
                <span>Bs {MAX_BUDGET.toLocaleString('es-BO')}+</span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-lime/15">
                <Sparkles className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-primary">Tus resultados</h2>
                <p className="text-sm text-ink-muted">
                  {matchCount} artista{matchCount === 1 ? '' : 's'} encontrado{matchCount === 1 ? '' : 's'}
                  {genre !== 'All' ? ` para ${genre}` : ''}
                  {city !== 'All' ? ` en ${city}` : ''}.
                </p>
              </div>
            </div>
            {matchCount === 0 ? (
              <div className="rounded-lg border border-line bg-bg-base p-4 text-center text-sm text-ink-muted">
                No encontramos artistas con esos filtros. Prueba ampliando el presupuesto o la ciudad.
              </div>
            ) : (
              <div className="rounded-lg border border-lime/30 bg-lime/10 p-4 text-center text-sm text-lime">
                Encontramos opciones para ti — mira el listado completo para elegir tu favorito.
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          {step === 0 ? (
            <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink-primary">
              <ArrowLeft className="h-4 w-4" /> Inicio
            </Link>
          ) : (
            <button
              type="button"
              onClick={back}
              className="flex items-center gap-1.5 rounded-pill border border-line px-4 py-2.5 text-sm font-semibold text-ink-primary hover:border-lime/40"
            >
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-pill bg-lime px-6 py-2.5 text-sm font-bold text-bg-base hover:bg-lime-dark"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinish}
              className="flex items-center gap-1.5 rounded-pill bg-lime px-6 py-2.5 text-sm font-bold text-bg-base hover:bg-lime-dark"
            >
              Ver todos los resultados <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mx-auto mt-4 block text-xs font-semibold text-ink-muted underline-offset-2 hover:text-ink-primary hover:underline"
      >
        Prefiero ver todos los artistas sin el asistente
      </button>
    </div>
  );
}

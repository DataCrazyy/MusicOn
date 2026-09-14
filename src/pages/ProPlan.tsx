import { Link } from 'react-router-dom';
import { Zap, Check, ArrowLeft, TrendingUp, Shield, BarChart3, Star, Headphones, Heart, Lock } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    features: ['Basic profile', 'Up to 3 photos', 'Standard search placement', '7% transaction fee', 'Basic analytics'],
    cta: 'Current plan',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 19,
    period: 'month',
    features: ['Everything in Free', 'Unlimited photos & video', 'Priority search placement', '4% transaction fee', 'Advanced analytics', 'Verified badge', 'Custom booking page', 'Escrow badge on profile'],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Pro+',
    price: 49,
    period: 'month',
    features: ['Everything in Pro', 'Featured rotation on Explore', '2% transaction fee', 'API access', 'Dedicated support', 'Fan pledge tools', 'Spotify/SoundCloud sync'],
    cta: 'Go Pro+',
    highlighted: false,
  },
];

const BENEFITS = [
  { icon: TrendingUp, title: '3x more bookings', desc: 'Pro artists get priority placement and the verified badge.' },
  { icon: BarChart3, title: 'Deep analytics', desc: 'Track profile views, conversion rates, and earnings trends.' },
  { icon: Shield, title: 'Lower fees', desc: 'Drop from 7% to 4% transaction fees on every booking.' },
  { icon: Headphones, title: 'Fan funding', desc: 'Enable monthly pledges and unlock a new revenue stream.' },
];

export default function ProPlan() {
  const { showToast } = useToast();
  const [selected, setSelected] = useState('Pro');

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-pill bg-violet/15 px-4 py-2 text-sm font-medium text-violet">
            <Zap className="h-4 w-4" /> MusicOn for Artists
          </div>
          <h1 className="font-display text-4xl font-extrabold text-ink-primary sm:text-5xl">
            Grow your <span className="text-lime">music career</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
            Join 12,000+ artists earning more with Pro tools, lower fees, and priority placement.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-card border border-line bg-bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/10">
                <b.icon className="h-5 w-5 text-lime" />
              </div>
              <h3 className="mt-3 font-semibold text-ink-primary">{b.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-card border p-6 transition ${
                plan.highlighted
                  ? 'border-lime bg-bg-surface ring-2 ring-lime/20'
                  : 'border-line bg-bg-surface'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-lime px-3 py-1 text-xs font-bold text-bg-base">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-2">
                {plan.name === 'Pro+' && <Zap className="h-5 w-5 text-violet" />}
                <h3 className="font-display text-xl font-bold text-ink-primary">{plan.name}</h3>
              </div>
              <div className="mt-3">
                <span className="font-display text-4xl font-extrabold text-ink-primary">${plan.price}</span>
                <span className="text-sm text-ink-muted">/{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                    <span className="text-ink-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (plan.name === 'Free') return;
                  setSelected(plan.name);
                  showToast(`${plan.name} plan selected — checkout coming next`);
                }}
                disabled={plan.name === 'Free'}
                className={`mt-6 w-full rounded-pill py-3 font-bold transition ${
                  plan.highlighted
                    ? 'bg-lime text-bg-base hover:bg-lime-dark'
                    : plan.name === 'Free'
                    ? 'cursor-default bg-bg-raised text-ink-muted'
                    : 'border border-line bg-bg-raised text-ink-primary hover:border-lime/40'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison strip */}
        <div className="mt-12 rounded-card border border-line bg-bg-surface p-6">
          <h2 className="mb-4 font-display text-xl font-bold text-ink-primary">Why artists love MusicOn</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-amber" fill="currentColor" />
                <span className="font-display text-2xl font-bold text-ink-primary">4.9</span>
              </div>
              <p className="text-sm text-ink-muted">Average artist rating</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-lime">$2.1M+</p>
              <p className="text-sm text-ink-muted">Paid out to artists</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-teal">48K+</p>
              <p className="text-sm text-ink-muted">Gigs completed</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Questions? <Link to="/chat" className="text-lime hover:underline">Chat with our team</Link>
        </p>

        {/* Campaign creation — Pro feature */}
        <div className="mt-12 rounded-card border border-violet/30 bg-bg-surface p-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-violet" fill="currentColor" />
            <h2 className="font-display text-xl font-bold text-ink-primary">Crear campaña de financiamiento</h2>
            <span className="flex items-center gap-1 rounded-pill bg-violet/15 px-2 py-0.5 text-xs font-bold text-violet">
              <Zap className="h-3 w-3" /> Pro
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-muted">Tus fans pueden apoyar tus proyectos con donaciones. Creá tu campaña en minutos.</p>
          {selected === 'Free' ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-line bg-bg-raised p-8 text-center">
              <Lock className="h-8 w-8 text-ink-muted" />
              <p className="mt-3 font-display text-lg font-bold text-ink-primary">Disponible solo para Pro</p>
              <p className="mt-1 text-sm text-ink-muted">Upgrade a Pro para desbloquear campañas de financiamiento de fans.</p>
              <button onClick={() => showToast('Upgrade a Pro para desbloquear esta función')} className="mt-4 rounded-pill bg-lime px-5 py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark">
                Upgrade a Pro
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Título de la campaña</label>
                  <input placeholder="Ej: Grabación de mi primer EP" className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Meta (USD)</label>
                  <input type="number" placeholder="2500" className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Descripción del proyecto</label>
                <textarea rows={3} placeholder="Contá sobre tu proyecto, cómo vas a usar los fondos..." className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Duración (días)</label>
                  <input type="number" placeholder="30" className="w-full rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium text-ink-muted">Niveles de donación (3)</p>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="grid grid-cols-[1fr_100px] gap-3">
                    <input placeholder={`Nombre del nivel ${n}`} className="rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none" />
                    <input type="number" placeholder="USD" className="rounded-input border border-line bg-bg-raised px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none" />
                  </div>
                ))}
              </div>
              <button onClick={() => showToast('Campaña creada ✓ — Ya visible para tus fans')} className="w-full rounded-pill bg-violet py-3 font-bold text-white transition hover:bg-violet/80">
                <span className="flex items-center justify-center gap-2"><Heart className="h-5 w-5" /> Crear campaña</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Heart, Users, Clock, Check, Sparkles, Calendar,
} from 'lucide-react';
import { getArtist } from '@/data';
import { getCampaign, type DonationTier } from '@/campaigns';
import { useToast } from '@/components/Toast';

export default function Apoyar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const artist = id ? getArtist(id) : undefined;
  const campaign = id ? getCampaign(id) : undefined;

  const [customAmount, setCustomAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<DonationTier | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [thankYouAmount, setThankYouAmount] = useState(0);

  if (!artist || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <div className="text-center">
          <p className="font-display text-xl font-bold text-ink-primary">Campaña no encontrada</p>
          <Link to="/explore" className="mt-4 inline-flex items-center gap-2 rounded-pill bg-lime px-5 py-3 font-bold text-bg-base">
            <ArrowLeft className="h-4 w-4" /> Explorar artistas
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.round((campaign.raised / campaign.goal) * 100);

  const handleDonate = (amount: number) => {
    setThankYouAmount(amount);
    navigate(`/payment?artist=${artist.id}&apoyo=${amount}&campaign=${encodeURIComponent(campaign.title)}`);
  };

  const handleCustomDonate = () => {
    const amt = parseInt(customAmount, 10);
    if (!amt || amt < 1) {
      showToast('Ingresá un monto válido');
      return;
    }
    handleDonate(amt);
  };

  const selectTier = (tier: DonationTier) => {
    setSelectedTier(tier);
  };

  if (showThankYou) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-lime/10 animate-pulse-ring">
            <Heart className="h-12 w-12 text-lime" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-primary">
            ¡Gracias por apoyar a {artist.name}! 🎉
          </h1>
          <p className="mt-4 text-sm text-ink-muted">
            Tu contribución de <span className="font-bold text-lime">USD {thankYouAmount}</span> ayuda a hacer realidad <span className="font-semibold text-ink-primary">"{campaign.title}"</span>.
          </p>
          <p className="mt-2 text-sm text-ink-muted">Recibirás actualizaciones del proyecto por email.</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to={`/profile/${artist.id}`} className="rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark">
              Volver al perfil del artista
            </Link>
            <Link to="/explore" className="rounded-pill border border-line bg-bg-surface py-3 font-bold text-ink-primary transition hover:border-lime/40">
              Explorar más artistas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to={`/profile/${artist.id}`} className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Volver al perfil de {artist.name}
        </Link>

        {/* HERO */}
        <div className="relative mb-8 h-[400px] overflow-hidden rounded-card">
          <div className="absolute inset-0 bg-gradient-to-br from-violet/30 via-bg-elevated to-lime/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-80">{campaign.coverEmoji}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-base to-transparent p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{campaign.coverEmoji}</span>
              <div>
                <h1 className="font-display text-2xl font-bold text-ink-primary">{artist.name}</h1>
                <p className="text-sm text-ink-muted">Campaña activa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign title + description */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-extrabold text-ink-primary">{campaign.title}</h2>
          <div className="mt-4 space-y-3">
            {campaign.description.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-ink-muted">{p}</p>
            ))}
          </div>
        </div>

        {/* PROGRESS SECTION */}
        <section className="mb-8 rounded-card border border-lime/30 bg-lime/5 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-lime">Meta: USD {campaign.goal.toLocaleString()}</span>
            <span className="text-sm font-bold text-amber">{pct}% completado</span>
          </div>
          <div className="mt-3 h-5 overflow-hidden rounded-full bg-bg-raised">
            <div
              className="animate-bar-grow h-full rounded-full bg-gradient-to-r from-lime to-lime-dark transition-all duration-1000"
              style={{ '--bar-height': `${pct}%`, width: `${pct}%` } as React.CSSProperties}
            >
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="font-display text-2xl font-extrabold text-lime">USD {campaign.raised.toLocaleString()}</p>
              <p className="text-xs text-ink-muted">recaudados</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber" />
              <div>
                <p className="font-display text-lg font-bold text-amber">{campaign.daysLeft} días</p>
                <p className="text-xs text-ink-muted">restantes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-ink-primary" />
              <div>
                <p className="font-display text-lg font-bold text-ink-primary">{campaign.supporterCount}</p>
                <p className="text-xs text-ink-muted">personas apoyaron</p>
              </div>
            </div>
          </div>
        </section>

        {/* DONATION TIERS */}
        <section className="mb-8">
          <h3 className="mb-4 font-display text-xl font-bold text-ink-primary">Elegí cómo apoyar</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {campaign.tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => selectTier(tier)}
                className={`group rounded-card border p-5 text-left transition ${
                  selectedTier?.id === tier.id
                    ? 'border-lime bg-lime/5 ring-2 ring-lime/20'
                    : 'border-line bg-bg-surface hover:border-lime/30'
                }`}
              >
                <div className="text-3xl">{tier.emoji}</div>
                <p className="mt-2 font-display text-lg font-bold text-ink-primary">{tier.name}</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-lime">USD {tier.amount}</p>
                <p className="mt-2 text-xs text-ink-muted">{tier.description}</p>
                <div className="mt-3 space-y-1.5">
                  {tier.perks.map((perk) => (
                    <div key={perk} className="flex items-start gap-1.5 text-xs text-ink-muted">
                      <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-lime" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Selected tier action */}
          {selectedTier && (
            <div className="mt-4 flex items-center justify-between rounded-card border border-lime/30 bg-lime/5 p-4 animate-fade-in-up">
              <span className="text-sm text-ink-primary">
                Seleccionaste: <span className="font-bold text-lime">{selectedTier.emoji} {selectedTier.name}</span> — USD {selectedTier.amount}
              </span>
              <button
                onClick={() => handleDonate(selectedTier.amount)}
                className="rounded-pill bg-lime px-5 py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
              >
                Apoyar con USD {selectedTier.amount} →
              </button>
            </div>
          )}

          {/* Custom amount */}
          <div className="mt-4 flex flex-col gap-3 rounded-card border border-line bg-bg-surface p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">Otro monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted">USD</span>
                <input
                  type="number"
                  min={1}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-input border border-line bg-bg-raised py-2.5 pl-12 pr-4 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCustomDonate}
              disabled={!customAmount || parseInt(customAmount, 10) < 1}
              className="rounded-pill bg-lime px-5 py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-40"
            >
              Apoyar{customAmount && parseInt(customAmount, 10) >= 1 ? ` con USD ${customAmount}` : ''} →
            </button>
          </div>
        </section>

        {/* SUPPORTERS LIST */}
        <section className="mb-8 rounded-card border border-line bg-bg-surface p-6">
          <h3 className="font-display text-xl font-bold text-ink-primary">Personas que ya apoyaron</h3>
          {/* Avatar horizontal scroll */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {campaign.supporters.map((s) => (
              <div
                key={s.id}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.color}`}
                title={`${s.name} — USD ${s.amount}`}
              >
                {s.name.charAt(0)}
              </div>
            ))}
            {campaign.supporterCount > campaign.supporters.length && (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-raised text-xs font-bold text-ink-muted">
                +{campaign.supporterCount - campaign.supporters.length}
              </div>
            )}
          </div>
          {/* Last 5 supporters list */}
          <div className="mt-4 space-y-2">
            {campaign.supporters.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg bg-bg-raised p-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${s.color}`}>
                  {s.name.charAt(0)}
                </div>
                <span className="flex-1 text-sm text-ink-primary">
                  <span className="font-semibold">{s.name}</span> apoyó con <span className="font-bold text-lime">USD {s.amount}</span>
                </span>
                <span className="text-xs text-ink-muted">{s.timeAgo}</span>
              </div>
            ))}
            {campaign.supporters.length < 5 && (
              <div className="rounded-lg border border-dashed border-lime/30 bg-lime/5 p-3 text-center">
                <p className="text-sm text-lime font-medium">Sé el próximo en apoyar 💜</p>
              </div>
            )}
          </div>
        </section>

        {/* PROJECT UPDATES */}
        <section className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-ink-primary">
            <Calendar className="h-5 w-5 text-lime" /> Actualizaciones del proyecto
          </h3>
          <div className="space-y-4">
            {campaign.updates.map((update) => (
              <div key={update.id} className="rounded-card border border-line bg-bg-surface p-5">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <Calendar className="h-3.5 w-3.5" /> {update.date}
                </div>
                <h4 className="mt-2 font-display text-lg font-bold text-ink-primary">{update.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{update.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA at bottom */}
        <div className="mb-4 rounded-card border border-lime/30 bg-gradient-to-br from-violet/10 to-lime/5 p-6 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-lime" />
          <p className="mt-3 font-display text-lg font-bold text-ink-primary">¿Listo para apoyar este proyecto?</p>
          <p className="mt-1 text-sm text-ink-muted">Cada aporte acerca a {artist.name} un paso más a su meta.</p>
          <Link
            to="#tiers"
            onClick={(e) => { e.preventDefault; window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="mt-4 inline-flex items-center gap-2 rounded-pill bg-lime px-6 py-3 font-bold text-bg-base transition hover:bg-lime-dark"
          >
            <Heart className="h-5 w-5" /> Apoyar ahora
          </Link>
        </div>
      </div>
    </div>
  );
}

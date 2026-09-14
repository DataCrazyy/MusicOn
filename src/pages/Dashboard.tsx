import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Calendar, DollarSign, TrendingUp, Clock, CheckCircle2,
  ArrowRight, MessageCircle, Star, MapPin, Zap, X, Gift, Sparkles,
  Info, CalendarDays, Save,
} from 'lucide-react';
import { BOOKINGS, CONVERSATIONS, getArtist, ARTISTS, REVIEW_TAGS, type ReviewTag, type Booking } from '@/data';
import { useToast } from '@/components/Toast';
import { ARTIST_XP, getCurrentLevel } from '@/gamification';
import { DASHBOARD_CAMPAIGN } from '@/campaigns';
import { XpBurst, LevelUpOverlay } from '@/components/XpCelebration';
import { Trophy, Heart, PencilLine, Megaphone } from 'lucide-react';

type ReviewedBookings = Record<string, boolean>;

const TOOLTIP_STORAGE_KEY = 'musicon_tooltips_dismissed';

export default function Dashboard() {
  const { showToast } = useToast();
  const upcoming = BOOKINGS.filter((b) => b.status !== 'Completed');
  const completed = BOOKINGS.filter((b) => b.status === 'Completed');
  const totalSpent = BOOKINGS.reduce((s, b) => s + b.total, 0);
  const unreadCount = CONVERSATIONS.filter((c) => c.unread).length;

  const [reviewed, setReviewed] = useState<ReviewedBookings>({});
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [tooltipStep, setTooltipStep] = useState<number>(-1);
  const [showXpBurst, setShowXpBurst] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [availability, setAvailability] = useState<Record<number, boolean>>({
    0: true, 1: true, 2: false, 3: true, 4: true, 5: false, 6: true,
  });

  const { level } = getCurrentLevel(ARTIST_XP.current);

  // Tooltips: show on first visit
  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem(TOOLTIP_STORAGE_KEY) || '[]');
    if (dismissed.length === 0) {
      setTooltipStep(0);
      const timer = setTimeout(() => {
        if (!dismissed.includes(0)) setTooltipStep(1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissTooltip = (step: number) => {
    const dismissed = JSON.parse(localStorage.getItem(TOOLTIP_STORAGE_KEY) || '[]');
    localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify([...dismissed, step]));
    setTooltipStep(-1);
  };

  const completedWithoutReview = completed.filter((b) => !reviewed[b.id]);

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Profile completion progress bar */}
        <div className="mb-6 rounded-card border border-lime/20 bg-lime/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-primary">
              Tu perfil está al 43% — completalo para recibir más bookings
            </p>
            <span className="font-display text-sm font-bold text-lime">43%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-bg-raised">
            <div className="h-full rounded-full bg-gradient-to-r from-lime to-lime-dark" style={{ width: '43%' }} />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-ink-primary">Welcome back, Jamie</h1>
            <Link
              to="/dashboard/progreso"
              className="flex items-center gap-1.5 rounded-pill border border-lime/30 bg-lime/10 px-3 py-1 text-sm font-bold text-lime transition hover:bg-lime/20"
            >
              <Trophy className="h-4 w-4" />
              {level.name} · {ARTIST_XP.current.toLocaleString()} XP · +{ARTIST_XP.earnedToday} XP hoy
            </Link>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Here is what is happening with your bookings.</p>
        </div>

        {/* Stat cards — 2x2 on mobile */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="relative">
            <StatCard icon={Calendar} label="Upcoming gigs" value={upcoming.length} prefix="" accent="text-lime" />
            {tooltipStep === 0 && (
              <Tooltip
                text="Aquí verás tus ingresos y estadísticas"
                onDismiss={() => dismissTooltip(0)}
              />
            )}
          </div>
          <StatCard icon={DollarSign} label="Total spent" value={totalSpent} prefix="$" accent="text-amber" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed.length} prefix="" accent="text-teal" />
          <StatCard icon={MessageCircle} label="Unread messages" value={unreadCount} prefix="" accent="text-violet" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Bookings timeline + review CTAs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Review CTA banner */}
            {completedWithoutReview.length > 0 && (
              <div className="animate-fade-in-up rounded-card border border-lime/30 bg-lime/5 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-lime/15">
                    <Gift className="h-6 w-6 text-lime" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-bold text-ink-primary">
                      Dejar reseña y ganar $5 de crédito
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      Tenés {completedWithoutReview.length} evento{completedWithoutReview.length > 1 ? 's' : ''} completado{completedWithoutReview.length > 1 ? 's' : ''} sin reseña. Compartí tu experiencia y ganá crédito.
                    </p>
                    <div className="mt-3 space-y-2">
                      {completedWithoutReview.map((booking) => {
                        const artist = getArtist(booking.artistId);
                        if (!artist) return null;
                        return (
                          <button
                            key={booking.id}
                            onClick={() => setReviewBooking(booking)}
                            className="flex w-full items-center gap-3 rounded-xl border border-lime/20 bg-bg-surface p-3 text-left transition hover:border-lime/40 hover:bg-bg-raised"
                          >
                            <img src={artist.photo} alt={artist.name} className="h-10 w-10 rounded-lg object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-ink-primary">{artist.name}</p>
                              <p className="text-xs text-ink-muted">{booking.event} · {booking.date}</p>
                            </div>
                            <span className="flex items-center gap-1.5 rounded-pill bg-lime px-3 py-1.5 text-xs font-bold text-bg-base">
                              <Sparkles className="h-3.5 w-3.5" /> Reseñar
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <section className="relative rounded-card border border-line bg-bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink-primary">Booking Timeline</h2>
                <Link to="/escrow" className="text-sm text-lime hover:underline">View all</Link>
              </div>
              {tooltipStep === 1 && (
                <Tooltip
                  text="Tus próximas reservas aparecen acá"
                  onDismiss={() => dismissTooltip(1)}
                />
              )}
              <div className="mt-6 relative">
                {/* Timeline line — animates fill on mount */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-line" />
                <div
                  className="animate-fill-timeline absolute left-4 top-0 w-px bg-gradient-to-b from-lime via-lime to-amber"
                  style={{ height: '100%' }}
                />
                <div className="space-y-6">
                  {BOOKINGS.map((booking, i) => {
                    const artist = getArtist(booking.artistId);
                    if (!artist) return null;
                    const isDone = booking.status === 'Completed';
                    const isInEscrow = booking.status === 'In Escrow';
                    const hasReview = reviewed[booking.id];
                    return (
                      <div key={booking.id} className="relative flex gap-4 animate-fade-in-up" style={{ animationDelay: `${0.1 * i}s` }}>
                        <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-bg-base ${
                          isDone ? 'bg-lime' : isInEscrow ? 'bg-amber' : 'bg-bg-raised'
                        }`}>
                          {isDone ? <CheckCircle2 className="h-4 w-4 text-bg-base" /> : <Clock className="h-4 w-4 text-ink-muted" />}
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          <Link
                            to={`/profile/${artist.id}`}
                            className="group flex flex-1 items-center gap-3 rounded-xl border border-line bg-bg-raised p-3 transition hover:border-lime/30"
                          >
                            <img src={artist.photo} alt={artist.name} className="h-12 w-12 rounded-lg object-cover" />
                            <div className="flex-1">
                              <p className="font-semibold text-ink-primary group-hover:text-lime">{artist.name}</p>
                              <p className="text-sm text-ink-muted">{booking.event}</p>
                              <p className="text-xs text-ink-muted">{booking.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-display font-bold text-ink-primary">${booking.total.toLocaleString()}</p>
                              <span className={`text-xs font-medium ${
                                isDone ? 'text-lime' : isInEscrow ? 'text-amber' : 'text-ink-muted'
                              }`}>{booking.status}</span>
                            </div>
                          </Link>
                          {isDone && !hasReview && (
                            <button
                              onClick={() => setReviewBooking(booking)}
                              className="flex items-center gap-2 self-start rounded-pill bg-lime px-4 py-2 text-xs font-bold text-bg-base transition hover:bg-lime-dark"
                            >
                              <Gift className="h-3.5 w-3.5" /> Dejar reseña y ganar $5 de crédito
                            </button>
                          )}
                          {isDone && hasReview && (
                            <span className="flex items-center gap-1.5 self-start text-xs font-medium text-lime">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Reseña enviada
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Recent conversations */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink-primary">Recent Messages</h2>
                <Link to="/chat" className="text-sm text-lime hover:underline">Open chat</Link>
              </div>
              <div className="mt-4 space-y-3">
                {CONVERSATIONS.map((conv) => {
                  const artist = getArtist(conv.artistId);
                  if (!artist) return null;
                  return (
                    <Link
                      key={conv.id}
                      to="/chat"
                      className="group flex items-center gap-3 rounded-xl border border-line bg-bg-raised p-3 transition hover:border-lime/30"
                    >
                      <img src={artist.photo} alt={artist.name} className="h-10 w-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink-primary">{artist.name}</p>
                        <p className="truncate text-xs text-ink-muted">{conv.lastMessage}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {conv.unread && <span className="h-2.5 w-2.5 rounded-full bg-lime" />}
                        <span className="text-xs text-ink-muted">{conv.timestamp}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right: Quick actions + bar chart + recommended */}
          <div className="space-y-6">
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">Quick Actions</h2>
              <div className="mt-4 space-y-2">
                <Link to="/wizard" className="flex items-center justify-between rounded-xl bg-bg-raised p-3 transition hover:bg-bg-elevated">
                  <span className="flex items-center gap-3 text-sm font-medium text-ink-primary">
                    <Calendar className="h-5 w-5 text-lime" /> New booking wizard
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-muted" />
                </Link>
                <Link to="/explore" className="flex items-center justify-between rounded-xl bg-bg-raised p-3 transition hover:bg-bg-elevated">
                  <span className="flex items-center gap-3 text-sm font-medium text-ink-primary">
                    <TrendingUp className="h-5 w-5 text-lime" /> Browse artists
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-muted" />
                </Link>
                <Link to="/escrow" className="flex items-center justify-between rounded-xl bg-bg-raised p-3 transition hover:bg-bg-elevated">
                  <span className="flex items-center gap-3 text-sm font-medium text-ink-primary">
                    <DollarSign className="h-5 w-5 text-lime" /> Manage escrow
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-muted" />
                </Link>
                <Link to="/referidos" className="flex items-center justify-between rounded-xl bg-lime/10 p-3 transition hover:bg-lime/15">
                  <span className="flex items-center gap-3 text-sm font-medium text-lime">
                    <Gift className="h-5 w-5" /> Invitar amigos · Ganá $10
                  </span>
                  <ArrowRight className="h-4 w-4 text-lime" />
                </Link>
                <Link to="/dashboard/progreso" className="flex items-center justify-between rounded-xl bg-amber/10 p-3 transition hover:bg-amber/15">
                  <span className="flex items-center gap-3 text-sm font-medium text-amber">
                    <Trophy className="h-5 w-5" /> Mi Progreso · Nivel {level.name}
                  </span>
                  <ArrowRight className="h-4 w-4 text-amber" />
                </Link>
                <Link to="/pro" className="flex items-center justify-between rounded-xl bg-violet/10 p-3 transition hover:bg-violet/15">
                  <span className="flex items-center gap-3 text-sm font-medium text-violet">
                    <Zap className="h-5 w-5" /> Upgrade to Pro
                  </span>
                  <ArrowRight className="h-4 w-4 text-violet" />
                </Link>
              </div>
            </section>

            {/* Mi campaña widget */}
            <section className="rounded-card border border-violet/30 bg-gradient-to-br from-violet/10 to-lime/5 p-6">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-violet" fill="currentColor" />
                <h2 className="font-display text-xl font-bold text-ink-primary">Mi campaña</h2>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink-primary">{DASHBOARD_CAMPAIGN.title}</p>
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-lime">USD {DASHBOARD_CAMPAIGN.raised.toLocaleString()}</span>
                  <span className="text-ink-muted">de USD {DASHBOARD_CAMPAIGN.goal.toLocaleString()}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-bg-raised">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lime to-lime-dark"
                    style={{ width: `${Math.round((DASHBOARD_CAMPAIGN.raised / DASHBOARD_CAMPAIGN.goal) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  {Math.round((DASHBOARD_CAMPAIGN.raised / DASHBOARD_CAMPAIGN.goal) * 100)}% · {DASHBOARD_CAMPAIGN.supporterCount} apoyadores · {DASHBOARD_CAMPAIGN.daysLeft} días restantes
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/artista/a1/apoyar" className="flex items-center gap-1.5 rounded-pill bg-lime px-3 py-2 text-xs font-bold text-bg-base transition hover:bg-lime-dark">
                  <Heart className="h-3.5 w-3.5" /> Ver campaña
                </Link>
                <button onClick={() => setShowCampaignModal(true)} className="flex items-center gap-1.5 rounded-pill border border-line bg-bg-raised px-3 py-2 text-xs font-bold text-ink-primary transition hover:border-lime/40">
                  <PencilLine className="h-3.5 w-3.5" /> Editar
                </button>
                <button onClick={() => setShowUpdateModal(true)} className="flex items-center gap-1.5 rounded-pill border border-line bg-bg-raised px-3 py-2 text-xs font-bold text-ink-primary transition hover:border-lime/40">
                  <Megaphone className="h-3.5 w-3.5" /> Publicar actualización
                </button>
              </div>
            </section>

            {/* Monthly spending bar chart — horizontal scroll on mobile */}
            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">Monthly Spending</h2>
              <div className="mt-6 overflow-x-auto">
                <div className="flex items-end justify-between gap-2" style={{ height: '160px', minWidth: '280px' }}>
                {[
                  { label: 'Apr', value: 40 },
                  { label: 'May', value: 65 },
                  { label: 'Jun', value: 30 },
                  { label: 'Jul', value: 80 },
                  { label: 'Aug', value: 100 },
                  { label: 'Sep', value: 55 },
                ].map((bar, i) => (
                  <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full items-end justify-center" style={{ height: '120px' }}>
                      <div
                        className="animate-bar-grow w-full max-w-[28px] rounded-t bg-gradient-to-t from-lime/40 to-lime"
                        style={{
                          '--bar-height': `${bar.value}%`,
                          animationDelay: `${i * 0.1}s`,
                        } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-xs text-ink-muted">{bar.label}</span>
                  </div>
                ))}
                </div>
              </div>
            </section>

            <section className="rounded-card border border-line bg-bg-surface p-6">
              <h2 className="font-display text-xl font-bold text-ink-primary">Recommended for you</h2>
              <div className="mt-4 space-y-3">
                {ARTISTS.slice(4, 7).map((artist) => (
                  <Link
                    key={artist.id}
                    to={`/profile/${artist.id}`}
                    className="group flex items-center gap-3 rounded-xl bg-bg-raised p-3 transition hover:bg-bg-elevated"
                  >
                    <img src={artist.photo} alt={artist.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-primary group-hover:text-lime">{artist.name}</p>
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {artist.city.split(',')[0]}</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber" fill="currentColor" /> {artist.rating}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-lime">${artist.priceFrom}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Availability toggle */}
            <AvailabilityCard
              availability={availability}
              setAvailability={setAvailability}
              onSave={() => showToast('Disponibilidad guardada')}
            />
          </div>
        </div>
      </div>

      {/* Review modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={(rating, text, tags) => {
            setReviewed((prev) => ({ ...prev, [reviewBooking.id]: true }));
            setReviewBooking(null);
            showToast(`Reseña enviada · +$5 de crédito ganado`);
            setShowXpBurst(true);
          }}
        />
      )}

      {/* XP celebration */}
      {showXpBurst && (
        <XpBurst amount={50} onDone={() => setShowXpBurst(false)} />
      )}
      {showLevelUp && (
        <LevelUpOverlay
          levelName="ORO"
          levelEmoji="🥇"
          rewards={[
            'Sesión fotográfica profesional',
            'Aparecer en homepage de MusicOn',
            'Workshop de marca personal gratuito',
            'Reducción de comisión a 12%',
          ]}
          onClose={() => setShowLevelUp(false)}
        />
      )}

      {/* Campaign update modal */}
      {showUpdateModal && (
        <div
          className="animate-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-bg-base/90 p-4 backdrop-blur-md"
          onClick={() => setShowUpdateModal(false)}
        >
          <div
            className="animate-slide-up w-full max-w-lg rounded-card border border-line bg-bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-lime" />
                <h2 className="font-display text-lg font-bold text-ink-primary">Publicar actualización</h2>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-ink-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-ink-primary">Título</label>
              <input
                placeholder="Ej: ¡Llegamos al 60%!"
                className="mt-2 w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-ink-primary">Mensaje</label>
              <textarea
                rows={4}
                placeholder="Contá a tus apoyadores sobre el progreso..."
                className="mt-2 w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setShowUpdateModal(false); showToast('Actualización publicada ✓'); }}
              className="mt-5 w-full rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark"
            >
              Publicar actualización
            </button>
          </div>
        </div>
      )}

      {/* Campaign edit modal */}
      {showCampaignModal && (
        <div
          className="animate-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-bg-base/90 p-4 backdrop-blur-md"
          onClick={() => setShowCampaignModal(false)}
        >
          <div
            className="animate-slide-up w-full max-w-lg rounded-card border border-line bg-bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <PencilLine className="h-5 w-5 text-lime" />
                <h2 className="font-display text-lg font-bold text-ink-primary">Editar campaña</h2>
              </div>
              <button onClick={() => setShowCampaignModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-ink-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-primary">Título de la campaña</label>
                <input defaultValue={DASHBOARD_CAMPAIGN.title} className="mt-2 w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary focus:border-lime/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-primary">Meta (USD)</label>
                <input type="number" defaultValue={DASHBOARD_CAMPAIGN.goal} className="mt-2 w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary focus:border-lime/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-primary">Descripción</label>
                <textarea rows={3} defaultValue={DASHBOARD_CAMPAIGN.description[0]} className="mt-2 w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary focus:border-lime/50 focus:outline-none" />
              </div>
            </div>
            <button
              onClick={() => { setShowCampaignModal(false); showToast('Campaña actualizada ✓'); }}
              className="mt-5 w-full rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewModal({ booking, onClose, onSubmit }: {
  booking: Booking;
  onClose: () => void;
  onSubmit: (rating: number, text: string, tags: ReviewTag[]) => void;
}) {
  const artist = getArtist(booking.artistId);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);

  if (!artist) return null;

  const toggleTag = (tag: ReviewTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canSubmit = rating > 0 && text.trim().length > 0;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-bg-base/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-lg rounded-card border border-line bg-bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={artist.photo} alt={artist.name} className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <h2 className="font-display text-lg font-bold text-ink-primary">Dejar reseña</h2>
              <p className="text-sm text-ink-muted">{artist.name} · {booking.event}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-raised text-ink-muted transition hover:text-ink-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Credit reward badge */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-lime/10 px-4 py-2.5">
          <Gift className="h-4 w-4 text-lime" />
          <span className="text-sm font-medium text-lime">Al enviar tu reseña, ganás $5 de crédito</span>
        </div>

        {/* Star rating */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-ink-primary">Tu calificación</label>
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition"
              >
                <Star
                  className={`h-8 w-8 transition ${(hoverRating || rating) >= star ? 'text-amber' : 'text-bg-elevated'}`}
                  fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Quick tags */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-ink-primary">Etiquetas rápidas</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-pill px-3 py-1.5 text-xs font-medium transition ${
                  selectedTags.includes(tag)
                    ? 'bg-lime text-bg-base'
                    : 'bg-bg-raised text-ink-muted hover:text-ink-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-ink-primary">Tu reseña</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Contá sobre tu experiencia con este artista..."
            className="mt-2 w-full rounded-input border border-line bg-bg-raised px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-lime/50 focus:outline-none focus:ring-1 focus:ring-lime/30"
          />
        </div>

        {/* Submit */}
        <button
          onClick={() => canSubmit && onSubmit(rating, text, selectedTags)}
          disabled={!canSubmit}
          className="mt-5 w-full rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-ink-muted"
        >
          {canSubmit ? 'Enviar reseña y ganar $5' : 'Escribí una reseña y elegí estrellas'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, prefix, accent }: { icon: typeof Star; label: string; value: number; prefix: string; accent: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <div className="rounded-card border border-line bg-bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-bg-raised`}>
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink-primary">
        {prefix}{displayValue.toLocaleString()}
      </p>
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}

function Tooltip({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <div className="absolute -top-2 left-1/2 z-[100] -translate-x-1/2 -translate-y-full">
      <div className="animate-slide-up whitespace-nowrap rounded-lg border border-lime/40 bg-bg-elevated px-4 py-2.5 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-lime">{text}</span>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 rounded-pill bg-lime px-2.5 py-1 text-xs font-bold text-bg-base"
          >
            Entendido
          </button>
        </div>
        <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-lime/40 bg-bg-elevated" />
      </div>
    </div>
  );
}

function AvailabilityCard({
  availability,
  setAvailability,
  onSave,
}: {
  availability: Record<number, boolean>;
  setAvailability: (v: Record<number, boolean>) => void;
  onSave: () => void;
}) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <section className="rounded-card border border-line bg-bg-surface p-6">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-lime" />
        <h2 className="font-display text-xl font-bold text-ink-primary">Configurar disponibilidad</h2>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Tocá un día para alternar disponible / no disponible</p>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((day, i) => (
          <button
            key={day}
            onClick={() => setAvailability({ ...availability, [i]: !availability[i] })}
            className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-xs font-bold transition ${
              availability[i]
                ? 'border-lime bg-lime/15 text-lime'
                : 'border-line bg-bg-raised text-ink-muted'
            }`}
          >
            {day}
            <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${availability[i] ? 'bg-lime' : 'bg-bg-elevated'}`} />
          </button>
        ))}
      </div>
      <button
        onClick={onSave}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-lime py-2.5 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
      >
        <Save className="h-4 w-4" /> Guardar disponibilidad
      </button>
    </section>
  );
}

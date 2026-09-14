import { Link } from 'react-router-dom';
import { Shield, Lock, CheckCircle2, Clock, ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import { BOOKINGS, getArtist } from '@/data';
import { useToast } from '@/components/Toast';

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  'In Escrow': { color: 'text-amber', bg: 'bg-amber/15', label: 'In Escrow' },
  'Confirmed': { color: 'text-teal', bg: 'bg-teal/15', label: 'Confirmed' },
  'Pending': { color: 'text-ink-muted', bg: 'bg-bg-raised', label: 'Pending' },
  'Completed': { color: 'text-lime', bg: 'bg-lime/15', label: 'Completed' },
};

export default function Escrow() {
  const { showToast } = useToast();
  const inEscrow = BOOKINGS.filter((b) => b.status === 'In Escrow');
  const totalEscrow = inEscrow.reduce((sum, b) => sum + b.total, 0);
  const totalReleased = BOOKINGS.filter((b) => b.status === 'Completed').reduce((s, b) => s + b.total, 0);

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
            <Shield className="h-6 w-6 text-lime" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-primary">Escrow Center</h1>
            <p className="text-sm text-ink-muted">Your payments are protected until the gig is done.</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-card border border-line bg-bg-surface p-5">
            <div className="flex items-center justify-between">
              <Lock className="h-5 w-5 text-amber" />
              <span className="text-xs text-ink-muted">Held</span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-ink-primary">${totalEscrow.toLocaleString()}</p>
            <p className="text-sm text-ink-muted">In escrow now</p>
          </div>
          <div className="rounded-card border border-line bg-bg-surface p-5">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-lime" />
              <span className="text-xs text-ink-muted">Released</span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-ink-primary">${totalReleased.toLocaleString()}</p>
            <p className="text-sm text-ink-muted">Paid to artists</p>
          </div>
          <div className="rounded-card border border-line bg-bg-surface p-5">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-teal" />
              <span className="text-xs text-ink-muted">Total</span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-ink-primary">${(totalEscrow + totalReleased).toLocaleString()}</p>
            <p className="text-sm text-ink-muted">All-time volume</p>
          </div>
        </div>

        {/* How escrow works */}
        <section className="mb-8 rounded-card border border-lime/20 bg-lime/5 p-6">
          <h2 className="font-display text-lg font-bold text-ink-primary">How escrow works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            {[
              { icon: DollarSign, title: 'You fund', desc: 'Payment is charged and held safely.' },
              { icon: Shield, title: 'We hold', desc: 'Funds locked until the gig is complete.' },
              { icon: CheckCircle2, title: 'Artist plays', desc: 'Show happens as agreed.' },
              { icon: ArrowRight, title: 'Auto-release', desc: 'Funds released 48h after the gig.' },
            ].map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/10">
                  <step.icon className="h-5 w-5 text-lime" />
                </div>
                <p className="mt-2 text-sm font-semibold text-ink-primary">{i + 1}. {step.title}</p>
                <p className="text-xs text-ink-muted">{step.desc}</p>
                {i < 3 && (
                  <div className="absolute right-0 top-5 hidden text-ink-muted sm:block">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Transactions */}
        <section>
          <h2 className="mb-4 font-display text-xl font-bold text-ink-primary">Transactions</h2>
          <div className="space-y-3">
            {BOOKINGS.map((booking) => {
              const artist = getArtist(booking.artistId);
              const style = STATUS_STYLES[booking.status];
              if (!artist) return null;
              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 rounded-card border border-line bg-bg-surface p-4"
                >
                  <img src={artist.photo} alt={artist.name} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-primary">{artist.name}</h3>
                      <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.color}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-sm text-ink-muted">{booking.event}</p>
                    <p className="text-xs text-ink-muted">{booking.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-ink-primary">${booking.total.toLocaleString()}</p>
                    {booking.status === 'In Escrow' && (
                      <button
                        onClick={() => showToast('Release requested — funds will transfer in 48h')}
                        className="mt-1 text-xs font-medium text-lime hover:underline"
                      >
                        Release funds
                      </button>
                    )}
                    {booking.status === 'Pending' && (
                      <button
                        onClick={() => showToast('Payment submitted to escrow')}
                        className="mt-1 rounded-pill bg-lime px-3 py-1 text-xs font-bold text-bg-base"
                      >
                        Fund escrow
                      </button>
                    )}
                    {booking.status === 'Completed' && (
                      <Link to={`/profile/${artist.id}`} className="mt-1 block text-xs font-medium text-lime hover:underline">
                        Book again
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

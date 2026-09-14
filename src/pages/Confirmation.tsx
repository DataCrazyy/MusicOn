import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2, Calendar, DollarSign, Shield, ArrowRight, Home,
  MessageCircle, Download, FileText, CreditCard, Hash, PenLine,
} from 'lucide-react';
import { getArtist, type Artist, BOOKINGS } from '@/data';
import { useToast } from '@/components/Toast';

export default function Confirmation() {
  const [params] = useSearchParams();
  const { showToast } = useToast();

  const comboIds = params.get('combo');
  const singleArtistId = params.get('artist');
  const date = params.get('date');
  const total = params.get('total');
  const deposit = params.get('deposit');
  const txId = params.get('txId');
  const payDate = params.get('payDate');
  const payMethod = params.get('payMethod');

  const artists: Artist[] = comboIds
    ? comboIds.split(',').map((id) => getArtist(id)).filter(Boolean) as Artist[]
    : singleArtistId
      ? [getArtist(singleArtistId)].filter(Boolean) as Artist[]
      : [];

  const isCombo = comboIds !== null && artists.length > 1;

  const contractBookingId = singleArtistId
    ? BOOKINGS.find((b) => b.artistId === singleArtistId)?.id || BOOKINGS[0].id
    : BOOKINGS[0].id;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Success animation */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-lime/10 animate-pulse-ring">
            <CheckCircle2 className="h-12 w-12 text-lime" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-primary">
            {isCombo ? `Combo de ${artists.length} artistas confirmado` : 'Booking Request Sent!'}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {isCombo
              ? 'Tu combo completo fue reservado. Un único contrato cubre todos los artistas.'
              : 'We have notified the artist. You will hear back within 24 hours.'}
          </p>
        </div>

        {/* Artists list */}
        {isCombo && (
          <div className="mb-4 rounded-card border border-line bg-bg-surface p-5">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">Artistas del combo</h2>
            <div className="space-y-3">
              {artists.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <img src={a.photo} alt={a.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-ink-primary">{a.name}</p>
                    <p className="text-xs text-ink-muted">{a.genre}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-pill bg-lime/15 px-2 py-0.5 text-xs font-bold text-lime">
                    <CheckCircle2 className="h-3 w-3" /> Confirmado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipt card */}
        <div className="rounded-card border border-line bg-bg-surface p-6">
          {!isCombo && artists[0] && (
            <div className="flex items-center gap-4 border-b border-line pb-4">
              <img src={artists[0].photo} alt={artists[0].name} className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <h2 className="font-display text-lg font-bold text-ink-primary">{artists[0].name}</h2>
                <p className="text-sm text-ink-muted">{artists[0].genre} · {artists[0].city}</p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <Calendar className="h-4 w-4" /> Event date
              </span>
              <span className="text-sm font-semibold text-ink-primary">{date || 'TBD'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <DollarSign className="h-4 w-4" /> Total{isCombo ? ' del combo' : ''}
              </span>
              <span className="font-display text-lg font-bold text-lime">${total || '0'}</span>
            </div>
            {deposit && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-muted">
                  <CreditCard className="h-4 w-4" /> Anticipo pagado
                </span>
                <span className="text-sm font-semibold text-ink-primary">${deposit}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <Shield className="h-4 w-4" /> Payment
              </span>
              <span className="rounded-pill bg-amber/15 px-2.5 py-0.5 text-xs font-medium text-amber">
                Held in escrow
              </span>
            </div>
          </div>

          {/* Payment receipt details */}
          {txId && (
            <div className="mt-4 rounded-lg bg-bg-raised p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-muted">Recibo de pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <Hash className="h-3.5 w-3.5" /> Transaction ID
                  </span>
                  <span className="font-mono font-semibold text-ink-primary">#{txId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <CreditCard className="h-3.5 w-3.5" /> Método
                  </span>
                  <span className="font-medium text-ink-primary">{payMethod || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <Calendar className="h-3.5 w-3.5" /> Fecha
                  </span>
                  <span className="font-medium text-ink-primary">{payDate || 'N/A'}</span>
                </div>
              </div>
              <button
                onClick={() => showToast('Recibo descargado')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill border border-line bg-bg-surface py-2.5 text-sm font-medium text-ink-primary transition hover:border-lime/40"
              >
                <Download className="h-4 w-4" /> Descargar recibo
              </button>
            </div>
          )}

          {/* Combo contract note */}
          {isCombo && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-lime/5 p-3">
              <FileText className="h-4 w-4 flex-shrink-0 text-lime" />
              <p className="text-xs text-ink-muted">
                Un único contrato cubre a todos los {artists.length} artistas del combo. Si algún artista cancela, recibís reembolso completo.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-lg bg-lime/5 p-3">
            <p className="text-xs text-ink-muted">
              Your payment is safely held in escrow. Funds will only be released
              to the artist 48 hours after the gig is completed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to={`/contrato/${contractBookingId}`}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark"
          >
            <PenLine className="h-5 w-5" /> Firmar contrato
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/chat"
              className="flex flex-1 items-center justify-center gap-2 rounded-pill border border-line bg-bg-surface py-3 font-bold text-ink-primary transition hover:border-lime/40"
            >
              <MessageCircle className="h-5 w-5" />
              {isCombo ? 'Mensaje a artistas' : 'Message Artist'}
            </Link>
            <Link
              to="/dashboard"
              className="flex flex-1 items-center justify-center gap-2 rounded-pill border border-line bg-bg-surface py-3 font-bold text-ink-primary transition hover:border-lime/40"
            >
              <Home className="h-5 w-5" />
              Go to Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/explore" className="text-sm text-ink-muted hover:text-lime">
            Browse more artists <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

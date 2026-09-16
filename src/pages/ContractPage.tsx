import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  FileSignature,
  CheckCircle2,
  Download,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getBookingById, type BookingWithArtist } from '@/lib/bookings';
import { formatPrice } from '@/lib/format';
import {
  buildContractTerms,
  ensureContract,
  signContractAsClient,
  signContractAsArtist,
  markBookingPaidAndConfirmed,
  type Contract,
} from '@/lib/contracts';
import { STATUS_LABELS } from '@/lib/bookingStatus';

export default function ContractPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingWithArtist | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [paying, setPaying] = useState(false);

  const isClient = !!user && !!booking && booking.client_id === user.id;
  const isArtistOwner = !!user && !!booking && booking.artist?.owner_id === user.id;

  async function load() {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const b = await getBookingById(bookingId);
      setBooking(b);
      const clientName = b.client?.full_name || profile?.full_name || 'Cliente';
      const terms = buildContractTerms(b, clientName);
      const c = await ensureContract(bookingId, terms);
      setContract(c);
      setFullName(profile?.full_name ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar el contrato.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function handleSign() {
    if (!contract || !fullName.trim() || !acceptedTerms) return;
    setSigning(true);
    try {
      if (isClient) {
        await signContractAsClient(contract.id, fullName.trim());
      } else if (isArtistOwner) {
        await signContractAsArtist(contract.id, fullName.trim());
      }
      await load();
    } finally {
      setSigning(false);
    }
  }

  async function handlePay() {
    if (!booking) return;
    setPaying(true);
    try {
      await markBookingPaidAndConfirmed(booking.id);
      await load();
    } finally {
      setPaying(false);
    }
  }

  function handleDownloadPdf() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando contrato...
      </div>
    );
  }

  if (error || !booking || !contract) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-ink-muted">
        <p>{error ?? 'No encontramos esta solicitud.'}</p>
        <Link to="/solicitudes" className="text-lime hover:underline">
          Volver a Solicitudes
        </Link>
      </div>
    );
  }

  if (!isClient && !isArtistOwner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-ink-muted">
        <p>No tienes acceso a este contrato.</p>
        <Link to="/solicitudes" className="text-lime hover:underline">
          Volver a Solicitudes
        </Link>
      </div>
    );
  }

  if (booking.status === 'pending') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-ink-muted">
        <p>Todavía no puedes confirmar la contratación — espera a que el artista acepte tu solicitud.</p>
        <Link to="/solicitudes" className="text-lime hover:underline">
          Volver a Solicitudes
        </Link>
      </div>
    );
  }

  if (booking.status === 'cancelled') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-ink-muted">
        <p>Esta solicitud fue rechazada, ya no se puede confirmar la contratación.</p>
        <Link to="/solicitudes" className="text-lime hover:underline">
          Volver a Solicitudes
        </Link>
      </div>
    );
  }

  const mySignedName = isClient ? contract.client_signed_name : contract.artist_signed_name;
  const isPaidAndConfirmed = booking.status === 'in_escrow' || booking.status === 'completed';
  const canSign = !mySignedName && !isPaidAndConfirmed;
  const canPay = isClient && !!contract.client_signed_name && !isPaidAndConfirmed;

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_LABELS[booking.status].className}`}>
            {STATUS_LABELS[booking.status].label}
          </span>
        </div>

        {isPaidAndConfirmed && (
          <div className="mb-6 flex items-center gap-2 rounded-card border border-lime/30 bg-lime/10 p-4 text-sm text-lime print:hidden">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Contratación confirmada. Ya puedes descargar el contrato en PDF.
          </div>
        )}

        <h1 className="mb-1 font-display text-2xl font-bold text-ink-primary">Confirmar contratación</h1>
        <p className="mb-6 text-sm text-ink-muted print:hidden">
          Revisa los datos, firma el contrato digital y confirma para cerrar el acuerdo con {booking.artist?.name}.
        </p>

        {/* Revisión de datos */}
        <div className="mb-6 rounded-card border border-line bg-bg-surface p-5">
          <h2 className="mb-3 text-sm font-bold text-ink-primary">Datos del servicio</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              <dd className="text-ink-primary">{booking.event_date}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              <dd className="text-ink-primary">{booking.start_time ?? '—'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              <dd className="text-ink-primary">{booking.venue ?? '—'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              <dd className="text-ink-primary">{booking.guest_range ?? '—'}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold">
              <dt className="text-ink-primary">Precio acordado</dt>
              <dd className="text-ink-primary">{formatPrice(booking.total)}</dd>
            </div>
          </dl>
        </div>

        {/* Contrato digital */}
        <div className="mb-6 rounded-card border border-line bg-bg-surface p-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-primary">
            <FileSignature className="h-4 w-4" /> Contrato digital
          </h2>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-bg-base p-4 text-xs leading-relaxed text-ink-muted print:max-h-none print:overflow-visible">
            {contract.terms}
          </pre>

          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 text-xs sm:grid-cols-2">
            <div>
              <p className="font-semibold text-ink-muted">Firma del cliente</p>
              <p className="text-ink-primary">
                {contract.client_signed_name ? `${contract.client_signed_name} ✓` : 'Pendiente'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-ink-muted">Firma del artista</p>
              <p className="text-ink-primary">
                {contract.artist_signed_name ? `${contract.artist_signed_name} ✓` : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Firmar */}
        {canSign && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-3 text-sm font-bold text-ink-primary">Firmar contrato</h2>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Nombre completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-lime"
              placeholder="Escribe tu nombre completo"
            />
            <label className="flex items-start gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-lime"
              />
              He leído y acepto los términos del contrato digital descrito arriba.
            </label>
            <button
              onClick={handleSign}
              disabled={signing || !fullName.trim() || !acceptedTerms}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
            >
              {signing && <Loader2 className="h-4 w-4 animate-spin" />}
              Firmar contrato
            </button>
          </div>
        )}

        {/* Pagar (simulado) */}
        {canPay && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-2 text-sm font-bold text-ink-primary">Pago</h2>
            <p className="mb-4 text-xs text-ink-muted">
              Este es un pago simulado (MVP) — todavía no se procesa dinero real. Al confirmar, la
              contratación queda cerrada.
            </p>
            <button
              onClick={handlePay}
              disabled={paying}
              className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Pagar {formatPrice(booking.total)} y confirmar
            </button>
          </div>
        )}

        {isPaidAndConfirmed && (
          <button
            onClick={handleDownloadPdf}
            className="flex w-full items-center justify-center gap-2 rounded-pill border border-line px-4 py-3 text-sm font-bold text-ink-primary transition hover:border-lime/40 print:hidden"
          >
            <Download className="h-4 w-4" /> Descargar contrato en PDF
          </button>
        )}
      </div>
    </div>
  );
}

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
  Check,
  X,
  History,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getBookingById, type BookingWithArtist } from '@/lib/bookings';
import { formatPrice } from '@/lib/format';
import {
  buildContractTerms,
  ensureContract,
  updateContractTerms,
  signContractAsClient,
  signContractAsArtist,
  markBookingPaidAndConfirmed,
  applyPostSignatureChange,
  type Contract,
} from '@/lib/contracts';
import {
  listNegotiationEvents,
  proposeChange,
  acceptNegotiationEvent,
  rejectNegotiationEvent,
  FIELD_LABELS,
  type NegotiationEvent,
  type NegotiableField,
} from '@/lib/negotiation';
import { STATUS_LABELS } from '@/lib/bookingStatus';
import { createNotification } from '@/lib/notifications';
import Stepper from '@/components/Stepper';
import StaticMapPreview from '@/components/StaticMapPreview';
import { computeFlowSteps } from '@/lib/flowSteps';
import ContractDocument from '@/components/ContractDocument';

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

  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [showModForm, setShowModForm] = useState(false);
  const [modField, setModField] = useState<NegotiableField>('price');
  const [modValue, setModValue] = useState('');
  const [modMessage, setModMessage] = useState('');
  const [modSaving, setModSaving] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('Cliente');

  const isClient = !!user && !!booking && booking.client_id === user.id;
  const isArtistOwner = !!user && !!booking && booking.artist?.owner_id === user.id;

  async function load() {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const b = await getBookingById(bookingId);
      setBooking(b);
      const resolvedClientName = b.client?.full_name || profile?.full_name || 'Cliente';
      setClientName(resolvedClientName);
      const terms = buildContractTerms(b, resolvedClientName);
      let c = await ensureContract(bookingId, terms);
      // Antes de la primera firma, mantenemos el contrato sincronizado si la negociación
      // cambió algo (precio, fecha, duración, etc.) desde que se generó por última vez.
      if (!c.artist_signed_name && !c.client_signed_name && c.terms !== terms) {
        c = await updateContractTerms(c.id, terms);
      }
      setContract(c);
      setFullName(profile?.full_name ?? '');
      setEvents(await listNegotiationEvents(bookingId));
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
    if (!contract || !booking || !fullName.trim() || !acceptedTerms) return;
    setSigning(true);
    try {
      if (isClient) {
        await signContractAsClient(contract.id, fullName.trim());
        if (booking.artist?.owner_id) {
          await createNotification({
            userId: booking.artist.owner_id,
            bookingId: booking.id,
            type: 'contract_signed',
            message: 'El cliente firmó el contrato.',
            link: `/contrato/${booking.id}`,
          });
        }
      } else if (isArtistOwner) {
        await signContractAsArtist(contract.id, fullName.trim());
        await createNotification({
          userId: booking.client_id,
          bookingId: booking.id,
          type: 'contract_signed',
          message: 'El artista firmó el contrato. Tu contrato está pendiente de firma.',
          link: `/contrato/${booking.id}`,
        });
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
      if (booking.artist?.owner_id) {
        await createNotification({
          userId: booking.artist.owner_id,
          bookingId: booking.id,
          type: 'booking_confirmed',
          message: 'Tienes una reserva confirmada.',
          link: `/contrato/${booking.id}`,
        });
      }
      await load();
    } finally {
      setPaying(false);
    }
  }

  function handleDownloadPdf() {
    window.print();
  }

  function fieldCurrentValue(field: NegotiableField): string {
    if (!booking) return '';
    switch (field) {
      case 'price':
        return String(booking.total);
      case 'start_time':
        return booking.start_time ?? '';
      case 'duration_hours':
        return booking.duration_hours != null ? String(booking.duration_hours) : '';
      case 'equipment':
        return booking.equipment ?? '';
      case 'notes':
        return booking.notes ?? '';
    }
  }

  async function submitModification() {
    if (!booking || !user || !modValue.trim()) return;
    // 50. La duración nunca puede ser negativa ni cero, tampoco en modificaciones
    // posteriores a la firma.
    if (modField === 'duration_hours' && !(Number(modValue) > 0)) {
      setModError('La duración debe ser mayor a 0 horas.');
      return;
    }
    if (modField === 'price' && !(Number(modValue) > 0)) {
      setModError('El precio debe ser mayor a 0.');
      return;
    }
    setModError(null);
    setModSaving(true);
    try {
      await proposeChange({
        bookingId: booking.id,
        field: modField,
        oldValue: fieldCurrentValue(modField),
        newValue: modValue.trim(),
        message: modMessage.trim() || undefined,
        proposedBy: user.id,
        proposedRole: isClient ? 'client' : 'artist',
        afterSignature: true,
      });
      setShowModForm(false);
      setModValue('');
      setModMessage('');
      await load();
    } catch (err) {
      setModError(err instanceof Error ? err.message : 'No pudimos enviar la solicitud.');
    } finally {
      setModSaving(false);
    }
  }

  /** Al aprobar una modificación después de firmar: se aplica el nuevo valor a la
   * reserva, y el contrato abre una nueva versión sin firmas — nunca se sobrescribe
   * en silencio un contrato ya firmado. */
  async function handleAcceptModification(event: NegotiationEvent) {
    if (!booking || !contract) return;
    setModSaving(true);
    try {
      await acceptNegotiationEvent(event);
      const freshBooking = await getBookingById(booking.id);
      const clientName = freshBooking.client?.full_name || profile?.full_name || 'Cliente';
      await applyPostSignatureChange(contract, freshBooking, clientName);
      await load();
    } finally {
      setModSaving(false);
    }
  }

  async function handleRejectModification(event: NegotiationEvent) {
    setModSaving(true);
    try {
      await rejectNegotiationEvent(event.id);
      await load();
    } finally {
      setModSaving(false);
    }
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

  const artistSigned = !!contract.artist_signed_name;
  const clientSigned = !!contract.client_signed_name;
  const isPaidAndConfirmed = booking.status === 'in_escrow' || booking.status === 'completed';
  // El artista firma primero: el cliente recién ve su propio formulario cuando el artista ya firmó.
  const canSignAsArtist = isArtistOwner && !artistSigned && !isPaidAndConfirmed;
  const canSignAsClient = isClient && artistSigned && !clientSigned && !isPaidAndConfirmed;
  const canSign = canSignAsArtist || canSignAsClient;
  const waitingOnArtistSignature = isClient && !artistSigned && !isPaidAndConfirmed;
  const canPay = isClient && artistSigned && clientSigned && !isPaidAndConfirmed;
  // Una vez que el servicio se realizó, la contratación queda finalizada: ya no se
  // aceptan nuevas modificaciones ni negociaciones sobre ella.
  const canRequestModification = isPaidAndConfirmed && booking.status !== 'completed';
  const pendingModification = events.find((e) => e.status === 'pending' && e.after_signature) ?? null;
  const signatureStatusText = isPaidAndConfirmed
    ? 'Contrato firmado por ambas partes'
    : !artistSigned
      ? 'Pendiente de firma del artista'
      : 'Firmado por el artista — pendiente de firma del cliente';

  // Timeline del flujo completo (7 pasos, ver lib/flowSteps.ts): solicitud →
  // negociación → contrato → firma del artista → firma del cliente → pago → reserva
  // confirmada. Se comparte con Chat.tsx para que el usuario vea siempre la misma
  // numeración de etapas en toda la app.
  const flowSteps = computeFlowSteps({
    bookingStatus: booking.status,
    artistSigned,
    clientSigned,
    isPaidAndConfirmed,
  });

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

        <div className="mb-6 rounded-card border border-line bg-bg-surface p-4 print:hidden">
          <Stepper steps={flowSteps} />
        </div>

        {booking.status === 'completed' && (
          <div className="mb-6 flex items-center gap-2 rounded-card border border-lime/30 bg-lime/10 p-4 text-sm text-lime print:hidden">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Servicio realizado ✓ — Contratación finalizada.
          </div>
        )}
        {isPaidAndConfirmed && booking.status !== 'completed' && (
          <div className="mb-6 flex items-center gap-2 rounded-card border border-lime/30 bg-lime/10 p-4 text-sm text-lime print:hidden">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Contratación confirmada. Ya puedes descargar el contrato en PDF.
          </div>
        )}

        <div className="mb-1 flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink-primary">Confirmar contratación</h1>
          <span className="rounded-pill border border-line px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
            Contrato v{contract.version}.0
          </span>
        </div>
        <p className="mb-1 text-sm font-semibold text-ink-primary print:hidden">{signatureStatusText}</p>
        <p className="mb-6 text-sm text-ink-muted print:hidden">
          Revisa los datos, firma el contrato digital y confirma para cerrar el acuerdo con {booking.artist?.name}.
        </p>

        {/* Revisión de datos — 58: foto del artista, servicio, fecha/hora, duración,
            precio final y un mapa de solo referencia (no editable) de la ubicación. */}
        <div className="mb-6 rounded-card border border-line bg-bg-surface p-5">
          <h2 className="mb-3 text-sm font-bold text-ink-primary">Datos del servicio</h2>
          <div className="mb-4 flex items-center gap-3">
            <img
              src={booking.artist?.photo_url ?? undefined}
              alt={booking.artist?.name}
              className="h-14 w-14 flex-shrink-0 rounded-full object-cover ring-1 ring-line"
            />
            <div>
              <p className="font-display text-base font-bold text-ink-primary">{booking.artist?.name}</p>
              <p className="text-xs text-ink-muted">{booking.event_type}</p>
            </div>
          </div>
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
              <History className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              <dd className="text-ink-primary">
                {booking.duration_hours != null ? `${booking.duration_hours} horas` : 'Duración no especificada'}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              <dd className="text-ink-primary">{booking.guest_range ?? '—'}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold">
              <dt className="text-ink-primary">Precio final</dt>
              <dd className="text-ink-primary">{formatPrice(booking.total)}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <MapPin className="h-3.5 w-3.5" /> Lugar del evento (solo referencia — no editable aquí)
            </p>
            {booking.event_lat != null && booking.event_lng != null ? (
              <StaticMapPreview lat={booking.event_lat} lng={booking.event_lng} />
            ) : null}
            <p className="mt-1.5 text-xs text-ink-primary">
              {booking.venue ?? '—'}
              {booking.venue_reference ? ` (${booking.venue_reference})` : ''}
            </p>
          </div>
        </div>

        {/* Contrato digital — documento visual profesional, con las mismas cláusulas
            configurables (lib/contractClauses.ts) que el texto guardado en contracts.terms */}
        <div className="mb-6 flex items-center gap-1.5 text-sm font-bold text-ink-primary print:hidden">
          <FileSignature className="h-4 w-4" /> Contrato digital
        </div>
        <div className="mb-6 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <ContractDocument booking={booking} clientName={clientName} contract={contract} />
        </div>

        {/* Esperando que el artista firme primero */}
        {waitingOnArtistSignature && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 text-sm text-ink-muted print:hidden">
            Pendiente de firma del artista — cuando {booking.artist?.name} firme el contrato vas a poder revisarlo y firmarlo tú también.
          </div>
        )}

        {/* Firmar — 57/59: siempre hay una acción siguiente clara, y el botón de firma
            queda deshabilitado hasta marcar la casilla de confirmación. */}
        {canSign && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-1 text-sm font-bold text-ink-primary">
              {isArtistOwner ? 'Revisa y confirma los detalles de la contratación' : 'Validar y firmar contrato'}
            </h2>
            <p className="mb-3 text-xs text-ink-muted">
              He revisado los datos de la contratación y confirmo que son correctos.
            </p>
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
              Confirmo que la información de la reserva es correcta.
            </label>
            <button
              onClick={handleSign}
              disabled={signing || !fullName.trim() || !acceptedTerms}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
            >
              {signing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isArtistOwner ? 'Firmar y confirmar' : 'Firmar y enviar contrato'}
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
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-pill border border-line px-4 py-3 text-sm font-bold text-ink-primary transition hover:border-lime/40 print:hidden"
          >
            <Download className="h-4 w-4" /> Descargar contrato en PDF
          </button>
        )}

        {/* Modificaciones después de firmar — nunca se sobrescribe un contrato firmado en
            silencio: todo cambio pasa por aprobación y abre una nueva versión. Se cierran
            en cuanto el servicio se marca como realizado. */}
        {canRequestModification && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink-primary">
              <History className="h-4 w-4" /> Modificaciones del contrato
            </h2>
            {contract.previous_versions?.length > 0 && (
              <p className="mb-3 text-[11px] text-ink-muted">
                Se guardan {contract.previous_versions.length} versión(es) anterior(es) en el historial.
              </p>
            )}

            {pendingModification ? (
              pendingModification.proposed_by === user?.id ? (
                <p className="text-xs text-ink-muted">
                  Esperando aprobación de la otra parte para cambiar{' '}
                  {(FIELD_LABELS[pendingModification.field as keyof typeof FIELD_LABELS] ?? pendingModification.field).toLowerCase()} a "{pendingModification.new_value}".
                </p>
              ) : (
                <div className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-xs">
                  <p className="font-bold text-ink-primary">Solicitud de modificación</p>
                  <p className="mt-1 text-ink-muted">Campo: {FIELD_LABELS[pendingModification.field as keyof typeof FIELD_LABELS] ?? pendingModification.field}</p>
                  <p className="text-ink-muted">
                    Valor anterior: <span className="text-ink-primary">{pendingModification.old_value || '—'}</span>
                  </p>
                  <p className="text-ink-muted">
                    Nuevo valor: <span className="font-bold text-ink-primary">{pendingModification.new_value}</span>
                  </p>
                  {pendingModification.message && (
                    <p className="mt-1 italic text-ink-primary">"{pendingModification.message}"</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleAcceptModification(pendingModification)}
                      disabled={modSaving}
                      className="flex items-center gap-1.5 rounded-pill bg-lime px-3 py-1.5 text-xs font-bold text-bg-base hover:bg-lime-dark disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" /> Aprobar
                    </button>
                    <button
                      onClick={() => handleRejectModification(pendingModification)}
                      disabled={modSaving}
                      className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-bold text-ink-primary hover:border-red-400/40 hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </div>
                </div>
              )
            ) : showModForm ? (
              <div className="rounded-lg border border-line bg-bg-base p-3">
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Campo a modificar</label>
                <select
                  value={modField}
                  onChange={(e) => {
                    const f = e.target.value as NegotiableField;
                    setModField(f);
                    setModValue(fieldCurrentValue(f));
                  }}
                  className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                >
                  {(Object.keys(FIELD_LABELS) as NegotiableField[]).map((f) => (
                    <option key={f} value={f}>
                      {FIELD_LABELS[f]}
                    </option>
                  ))}
                </select>
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Nuevo valor</label>
                <input
                  type={modField === 'price' || modField === 'duration_hours' ? 'number' : modField === 'start_time' ? 'time' : 'text'}
                  min={modField === 'duration_hours' ? '0.5' : modField === 'price' ? '0' : undefined}
                  step={modField === 'duration_hours' ? '0.5' : undefined}
                  value={modValue}
                  onChange={(e) => setModValue(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />
                {modError && <p className="mb-2 text-xs text-red-400">{modError}</p>}
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Motivo</label>
                <textarea
                  value={modMessage}
                  onChange={(e) => setModMessage(e.target.value)}
                  rows={2}
                  className="mb-2 w-full rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                  placeholder='Ej: "El evento comenzará una hora más tarde."'
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModForm(false)}
                    className="flex-1 rounded-pill border border-line px-4 py-2 text-xs font-bold text-ink-primary hover:border-lime/40"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitModification}
                    disabled={modSaving || !modValue.trim()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-lime px-4 py-2 text-xs font-bold text-bg-base hover:bg-lime-dark disabled:opacity-60"
                  >
                    {modSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Solicitar modificación
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setModField('price');
                  setModValue(fieldCurrentValue('price'));
                  setModMessage('');
                  setModError(null);
                  setShowModForm(true);
                }}
                className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-primary transition hover:border-lime/40"
              >
                Solicitar modificación del contrato
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

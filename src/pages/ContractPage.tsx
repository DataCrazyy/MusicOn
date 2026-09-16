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
  Send,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
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
  markContractSentToClient,
  contractNumberFor,
  type Contract,
} from '@/lib/contracts';
import {
  listNegotiationEvents,
  proposeModification,
  acceptNegotiationEvent,
  rejectNegotiationEvent,
  getModificationBundle,
  getPreviousModificationBundle,
  type NegotiationEvent,
  type ModificationBundle,
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
  const [sendingContract, setSendingContract] = useState(false);
  const [notifyingArtist, setNotifyingArtist] = useState(false);
  const [notifiedArtist, setNotifiedArtist] = useState(false);

  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [showModForm, setShowModForm] = useState(false);
  const [modDraft, setModDraft] = useState<ModificationBundle | null>(null);
  const [modMessage, setModMessage] = useState('');
  const [modSaving, setModSaving] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('Cliente');
  // 15: contraer el documento del contrato por defecto para no tener que scrollear
  // todo el texto legal antes de llegar a confirmar/firmar.
  const [showFullContract, setShowFullContract] = useState(false);
  // 74/75: el artista primero revisa y confirma las condiciones, y recien ahi pasa
  // a la pantalla de firma -- nunca un formulario de firma directo sin ese paso.
  const [artistConfirmedConditions, setArtistConfirmedConditions] = useState(false);

  const isClient = !!user && !!booking && booking.client_id === user.id;
  const isArtistOwner = !!user && !!booking && booking.artist?.owner_id === user.id;

  async function load() {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    setArtistConfirmedConditions(false);
    setNotifiedArtist(false);
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
        // El envio al cliente ahora es un paso explicito y separado (ver
        // handleSendContract) -- firmar ya no notifica ni habilita al cliente por si solo.
        await signContractAsArtist(contract.id, fullName.trim());
      }
      await load();
    } finally {
      setSigning(false);
    }
  }

  /** Paso explicito -- el artista firma y recien decide enviar el contrato ya
   * firmado al cliente; hasta entonces el cliente no puede verlo/firmarlo (79). */
  async function handleSendContract() {
    if (!contract || !booking) return;
    setSendingContract(true);
    try {
      await markContractSentToClient(contract.id);
      await createNotification({
        userId: booking.client_id,
        bookingId: booking.id,
        type: 'contract_signed',
        message:
          '🔔 El artista ha firmado el contrato — El contrato de tu reserva está listo para que lo revises y firmes.',
        link: `/contrato/${booking.id}`,
      });
      await load();
    } finally {
      setSendingContract(false);
    }
  }

  /** El cliente, mientras espera que el artista firme, puede avisarle explícitamente
   * que ya revisó todo y está listo -- antes no tenía ninguna acción visible en esta
   * pantalla, solo podía esperar en silencio. */
  async function handleNotifyArtist() {
    if (!booking?.artist?.owner_id) return;
    setNotifyingArtist(true);
    try {
      await createNotification({
        userId: booking.artist.owner_id,
        bookingId: booking.id,
        type: 'contract_ready',
        message: `${clientName} ya revisó la contratación y está listo/a — revisa y firma el contrato.`,
        link: `/contrato/${booking.id}`,
      });
      setNotifiedArtist(true);
    } finally {
      setNotifyingArtist(false);
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

  /** Snapshot de los valores vigentes de la reserva, en el mismo formato que se usa
   * para pedir una modificación en bloque -- todo junto, no campo por campo. */
  function currentModificationBundle(): ModificationBundle {
    return {
      price: booking?.total ?? 0,
      duration_hours: booking?.duration_hours ?? null,
      start_time: booking?.start_time ?? null,
      equipment: booking?.equipment ?? null,
      venue: booking?.venue ?? null,
      venue_reference: booking?.venue_reference ?? null,
      notes: booking?.notes ?? null,
    };
  }

  async function submitModification() {
    if (!booking || !user || !modDraft) return;
    setModError(null);
    setModSaving(true);
    try {
      await proposeModification({
        bookingId: booking.id,
        previous: currentModificationBundle(),
        next: modDraft,
        message: modMessage.trim() || undefined,
        proposedBy: user.id,
        proposedRole: isClient ? 'client' : 'artist',
      });
      setShowModForm(false);
      setModDraft(null);
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
  const contractSent = !!contract.sent_to_client;
  const isPaidAndConfirmed = booking.status === 'in_escrow' || booking.status === 'completed';
  // El artista firma primero y despues decide enviarle el contrato al cliente como
  // paso explicito (handleSendContract) -- el cliente recien puede verlo/firmarlo
  // cuando el artista ya lo envio, no apenas firmo.
  const canSignAsArtist = isArtistOwner && !artistSigned && !isPaidAndConfirmed;
  const canSendContract = isArtistOwner && artistSigned && !contractSent && !isPaidAndConfirmed;
  const canSignAsClient = isClient && artistSigned && contractSent && !clientSigned && !isPaidAndConfirmed;
  const waitingOnArtistSignature = isClient && (!artistSigned || !contractSent) && !isPaidAndConfirmed;
  const canPay = isClient && artistSigned && clientSigned && !isPaidAndConfirmed;
  // Una vez que el servicio se realizó, la contratación queda finalizada: ya no se
  // aceptan nuevas modificaciones ni negociaciones sobre ella.
  const canRequestModification = isPaidAndConfirmed && booking.status !== 'completed';
  const pendingModification = events.find((e) => e.status === 'pending' && e.after_signature) ?? null;
  // 8 (Modificaciones): se recomienda pedir cambios con al menos 48 horas de
  // anticipación -- se avisa, pero no se bloquea la solicitud.
  const hoursUntilEvent = booking.start_time
    ? (new Date(`${booking.event_date}T${booking.start_time}`).getTime() - Date.now()) / 3_600_000
    : (new Date(`${booking.event_date}T00:00:00`).getTime() - Date.now()) / 3_600_000;
  const withinModificationWindow = hoursUntilEvent < 48;
  const signatureStatusText = isPaidAndConfirmed
    ? 'Contrato firmado por ambas partes'
    : !artistSigned
      ? 'Pendiente de firma del artista'
      : !contractSent
        ? 'Firmado por el artista — pendiente de enviar al cliente'
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
          <div className="mb-6 rounded-card border border-lime/30 bg-lime/10 p-5 text-sm text-lime print:hidden">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> Pago confirmado
            </p>
            <div className="mt-3 rounded-lg border border-lime/20 bg-bg-base p-3 text-ink-primary">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Contrato</span>
                <span>{contractNumberFor(booking.id)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm">{booking.artist?.name}</span>
                <span className="text-lg font-bold text-lime">{formatPrice(booking.total)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-muted">
                <span>{booking.event_date} {booking.start_time ?? ''}</span>
                <span>{booking.paid_at ? new Date(booking.paid_at).toLocaleDateString('es-BO') : ''}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-muted">Reserva confirmada — ya puedes descargar el contrato en PDF.</p>
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
            configurables (lib/contractClauses.ts) que el texto guardado en contracts.terms.
            La descarga en PDF está disponible desde que existe el contrato, no solo al
            cerrarse la reserva — sirve para revisarlo/guardarlo en cualquier etapa.
            Contraído por defecto (71) para no tener que scrollear todo el texto legal
            antes de llegar a confirmar/firmar. */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setShowFullContract((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-bold text-ink-primary"
          >
            <FileSignature className="h-4 w-4" /> Contrato digital
            {showFullContract ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-bold text-ink-primary transition hover:border-lime/40"
          >
            <Download className="h-3.5 w-3.5" /> Descargar en PDF
          </button>
        </div>
        {!showFullContract && (
          <button
            type="button"
            onClick={() => setShowFullContract(true)}
            className="mb-6 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-3 text-xs font-semibold text-ink-muted transition hover:border-lime/40 hover:text-ink-primary print:hidden"
          >
            Ver el documento completo del contrato <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        <div
          className={`mb-6 overflow-y-auto print:max-h-none print:overflow-visible ${
            showFullContract ? 'max-h-[70vh]' : 'hidden print:block'
          }`}
        >
          <ContractDocument booking={booking} clientName={clientName} contract={contract} />
        </div>

        {/* Esperando que el artista firme y despues envíe el contrato -- el cliente
            ahora tiene una acción explícita para avisarle que ya revisó todo, en vez de
            solo poder esperar sin hacer nada (ver handleNotifyArtist). Una vez avisado,
            se muestra un recuadro claro de "hay que esperar" con salida al inicio, en
            vez de dejar a la persona sin saber qué hacer en esta pantalla. */}
        {waitingOnArtistSignature && (
          !artistSigned && notifiedArtist ? (
            <div className="mb-6 rounded-card border border-lime/30 bg-lime/10 p-5 text-sm print:hidden">
              <p className="flex items-center gap-2 font-bold text-lime">
                <Check className="h-5 w-5 flex-shrink-0" /> Le avisamos a {booking.artist?.name}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                Ahora hay que esperar a que {booking.artist?.name} revise y firme el contrato. Te vamos
                a notificar apenas lo haga y te lo envíe — no hace falta que te quedes en esta pantalla.
              </p>
              <Link
                to="/explore"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-pill border border-line px-4 py-2.5 text-sm font-bold text-ink-primary transition hover:border-lime/40"
              >
                Volver al inicio
              </Link>
            </div>
          ) : (
            <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 text-sm text-ink-muted print:hidden">
              <p>
                {!artistSigned
                  ? `Pendiente de firma del artista — cuando ${booking.artist?.name} firme el contrato y te lo envíe vas a poder revisarlo y firmarlo tú también.`
                  : `${booking.artist?.name} ya firmó el contrato — todavía no te lo envió. En cuanto lo haga vas a poder revisarlo y firmarlo.`}
              </p>
              {!artistSigned && (
                <button
                  type="button"
                  onClick={handleNotifyArtist}
                  disabled={notifyingArtist || !booking.artist?.owner_id}
                  className="mt-3 flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-bold text-ink-primary transition hover:border-lime/40 disabled:opacity-60"
                >
                  {notifyingArtist ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Avisarle que estoy listo/a para firmar
                </button>
              )}
            </div>
          )
        )}

        {/* 74/77: el artista firmó, pero todavía no decidió enviarlo -- acción
            explícita y siempre visible, nunca se envía solo en silencio. */}
        {canSendContract && (
          <div className="mb-6 rounded-card border border-lime/30 bg-lime/10 p-5 print:hidden">
            <p className="flex items-center gap-2 font-bold text-lime">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> Contrato firmado correctamente
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-primary">✓ Firmado por el artista</p>
            <p className="mt-2 text-xs text-ink-muted">
              Revisa el contrato arriba (y descárgalo en PDF si quieres guardarlo) y, cuando esté todo
              correcto, envíaselo a {clientName} para que lo revise y firme.
            </p>
            <button
              onClick={handleSendContract}
              disabled={sendingContract}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
            >
              {sendingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar contrato al cliente
            </button>
          </div>
        )}

        {/* Firma del cliente — 57/59: acción siempre visible, botón deshabilitado hasta
            marcar la casilla de confirmación. */}
        {canSignAsClient && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-1 text-sm font-bold text-ink-primary">Validar y firmar contrato</h2>
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
              Firmar y enviar contrato
            </button>
          </div>
        )}

        {/* Flujo del artista — 74/75: primero revisar y confirmar las condiciones de
            la contratación como paso explícito, y recién después pasar a la firma. */}
        {canSignAsArtist && !artistConfirmedConditions && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-1 text-sm font-bold text-ink-primary">Confirmar condiciones de la contratación</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Revisa los datos del servicio y el contrato digital arriba antes de continuar.
            </p>
            <label className="flex items-start gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-lime"
              />
              Confirmo que he revisado los datos y acepto las condiciones de esta contratación
            </label>
            <button
              onClick={() => {
                if (!acceptedTerms) return;
                setArtistConfirmedConditions(true);
              }}
              disabled={!acceptedTerms}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
            >
              Confirmar y continuar a firma
            </button>
            <Link
              to={`/chat?b=${booking.id}`}
              className="mt-3 block text-center text-xs font-semibold text-ink-muted hover:text-ink-primary"
            >
              ¿Algo no está correcto? Solicitar cambio
            </Link>
          </div>
        )}

        {/* 76: formulario de firma del artista, equivalente al del cliente — mismo
            contrato, con fecha y hora automáticas. */}
        {canSignAsArtist && artistConfirmedConditions && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-1 text-sm font-bold text-ink-primary">Firma del contrato</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Contrato {contractNumberFor(booking.id)} — al firmar, aceptas las condiciones acordadas para esta
              contratación.
            </p>
            <dl className="mb-3 grid grid-cols-3 gap-2 text-xs">
              <div className="min-w-0">
                <dt className="font-semibold text-ink-muted">Nombre</dt>
                <dd className="truncate text-ink-primary">{fullName || '—'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-ink-muted">Fecha</dt>
                <dd className="text-ink-primary">{new Date().toLocaleDateString('es-BO')}</dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-ink-muted">Hora</dt>
                <dd className="text-ink-primary">
                  {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
            </dl>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Firma (nombre completo)</label>
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
              Acepto las condiciones del contrato
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setArtistConfirmedConditions(false)}
                className="rounded-pill border border-line px-4 py-3 text-xs font-bold text-ink-primary hover:border-lime/40"
              >
                Volver
              </button>
              <button
                onClick={handleSign}
                disabled={signing || !fullName.trim() || !acceptedTerms}
                className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
              >
                {signing && <Loader2 className="h-4 w-4 animate-spin" />}
                Firmar contrato
              </button>
            </div>
          </div>
        )}

        {/* 77: confirmación persistente tras enviar el contrato — nunca vuelve a la
            lista de solicitudes, se queda mostrando el estado hasta que el cliente
            también firme. Antes de enviarlo se muestra el bloque canSendContract de
            arriba en su lugar. */}
        {isArtistOwner && artistSigned && contractSent && !clientSigned && !isPaidAndConfirmed && (
          <div className="mb-6 rounded-card border border-lime/30 bg-lime/10 p-5 text-sm print:hidden">
            <p className="flex items-center gap-2 font-bold text-lime">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> Contrato enviado
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-primary">✓ Firmado por el artista</p>
            <p className="mt-2 text-xs text-ink-muted">
              El contrato ha sido enviado a {clientName} para su revisión y firma.
            </p>
          </div>
        )}

        {/* Pagar (simulado) -- por ahora con un QR de referencia (pago por QR es el
            método más usado en Bolivia); el botón de abajo simula la confirmación del
            banco, ya que todavía no hay una pasarela de pago real integrada. */}
        {canPay && (
          <div className="mb-6 rounded-card border border-line bg-bg-surface p-5 print:hidden">
            <h2 className="mb-2 text-sm font-bold text-ink-primary">Pago</h2>
            <p className="mb-4 text-xs text-ink-muted">
              Este es un pago simulado (MVP) — todavía no se procesa dinero real. Al confirmar, la
              contratación queda cerrada.
            </p>
            <div className="mb-4 flex flex-col items-center gap-2 rounded-lg border border-line bg-bg-base p-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `MusicOn|${contractNumberFor(booking.id)}|${booking.total}`
                )}`}
                alt="Código QR de pago"
                width={180}
                height={180}
                className="h-[180px] w-[180px] max-w-full rounded-lg bg-white p-2"
              />
              <p className="text-center text-xs text-ink-muted">
                Escanea el código QR con tu app bancaria para pagar {formatPrice(booking.total)}
                <br />
                Contrato {contractNumberFor(booking.id)}
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="flex w-full items-center justify-center gap-2 rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark disabled:opacity-60"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Ya pagué — confirmar pago de {formatPrice(booking.total)}
            </button>
          </div>
        )}

        {/* Modificaciones después de firmar — 71: ahora se piden en bloque (precio,
            duración, horario, equipamiento, ubicación, referencia y condiciones juntos),
            no campo por campo. Nunca se sobrescribe un contrato firmado en silencio:
            todo cambio pasa por aprobación y abre una nueva versión. Se cierran en
            cuanto el servicio se marca como realizado. */}
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

            {withinModificationWindow && !pendingModification && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/10 p-3 text-xs text-amber">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                El evento es en menos de 48 horas. La cláusula 8 (Modificaciones) del contrato
                recomienda pedir cambios con esa anticipación — igual puedes solicitarlo, pero
                puede que a la otra parte le cueste más ajustarse.
              </div>
            )}

            {pendingModification ? (
              (() => {
                const nextBundle = getModificationBundle(pendingModification);
                const prevBundle = getPreviousModificationBundle(pendingModification);
                const rows: { label: string; key: keyof ModificationBundle }[] = [
                  { label: 'Precio', key: 'price' },
                  { label: 'Duración', key: 'duration_hours' },
                  { label: 'Horario', key: 'start_time' },
                  { label: 'Equipamiento', key: 'equipment' },
                  { label: 'Ubicación', key: 'venue' },
                  { label: 'Referencia', key: 'venue_reference' },
                  { label: 'Condiciones', key: 'notes' },
                ];
                const fmt = (key: keyof ModificationBundle, v: ModificationBundle[typeof key]) => {
                  if (v == null || v === '') return '—';
                  if (key === 'price') return formatPrice(Number(v));
                  if (key === 'duration_hours') return `${v} horas`;
                  return String(v);
                };
                return pendingModification.proposed_by === user?.id ? (
                  <p className="text-xs text-ink-muted">
                    Esperando aprobación de la otra parte para tu solicitud de modificación.
                    {pendingModification.message && <> Motivo: "{pendingModification.message}"</>}
                  </p>
                ) : (
                  <div className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-xs">
                    <p className="font-bold text-ink-primary">Solicitud de modificación</p>
                    {nextBundle && (
                      <ul className="mt-2 space-y-1">
                        {rows
                          .filter((r) => !prevBundle || prevBundle[r.key] !== nextBundle[r.key])
                          .map((r) => (
                            <li key={r.key} className="text-ink-muted">
                              {r.label}: {fmt(r.key, prevBundle?.[r.key] ?? null)} →{' '}
                              <span className="font-bold text-ink-primary">{fmt(r.key, nextBundle[r.key])}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                    {pendingModification.message && (
                      <p className="mt-2 italic text-ink-primary">"{pendingModification.message}"</p>
                    )}
                    <div className="mt-3 flex gap-2">
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
                );
              })()
            ) : showModForm && modDraft ? (
              <div className="w-full min-w-0 rounded-lg border border-line bg-bg-base p-3">
                <p className="mb-2 text-[11px] text-ink-muted">
                  Edita todos los campos que quieras cambiar y envíalos juntos como una sola solicitud.
                </p>

                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Precio (Bs)</label>
                <input
                  type="number"
                  min="0"
                  value={modDraft.price}
                  onChange={(e) => setModDraft((d) => (d ? { ...d, price: Number(e.target.value) } : d))}
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />

                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Duración (horas)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={modDraft.duration_hours ?? ''}
                  onChange={(e) =>
                    setModDraft((d) => (d ? { ...d, duration_hours: e.target.value ? Number(e.target.value) : null } : d))
                  }
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />

                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Horario</label>
                <input
                  type="time"
                  value={modDraft.start_time ?? ''}
                  onChange={(e) => setModDraft((d) => (d ? { ...d, start_time: e.target.value } : d))}
                  style={{ colorScheme: 'dark' }}
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />

                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Equipamiento</label>
                <input
                  type="text"
                  value={modDraft.equipment ?? ''}
                  onChange={(e) => setModDraft((d) => (d ? { ...d, equipment: e.target.value } : d))}
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />

                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Ubicación del evento</label>
                <input
                  type="text"
                  value={modDraft.venue ?? ''}
                  onChange={(e) => setModDraft((d) => (d ? { ...d, venue: e.target.value } : d))}
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />

                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Referencia adicional</label>
                <input
                  type="text"
                  value={modDraft.venue_reference ?? ''}
                  onChange={(e) => setModDraft((d) => (d ? { ...d, venue_reference: e.target.value } : d))}
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />

                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Condiciones adicionales</label>
                <textarea
                  value={modDraft.notes ?? ''}
                  onChange={(e) => setModDraft((d) => (d ? { ...d, notes: e.target.value } : d))}
                  rows={2}
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                />

                {modError && <p className="mb-2 text-xs text-red-400">{modError}</p>}
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Motivo</label>
                <textarea
                  value={modMessage}
                  onChange={(e) => setModMessage(e.target.value)}
                  rows={2}
                  className="mb-2 w-full min-w-0 rounded-lg border border-line bg-bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-lime"
                  placeholder='Ej: "El evento comenzará una hora más tarde."'
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowModForm(false);
                      setModDraft(null);
                    }}
                    className="flex-1 rounded-pill border border-line px-4 py-2 text-xs font-bold text-ink-primary hover:border-lime/40"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitModification}
                    disabled={modSaving}
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
                  setModDraft(currentModificationBundle());
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

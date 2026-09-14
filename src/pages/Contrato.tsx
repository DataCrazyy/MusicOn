import { useParams, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Download, Check, Loader2, FileText, Clock,
} from 'lucide-react';
import { BOOKINGS, getArtist, type Booking } from '@/data';
import { useToast } from '@/components/Toast';
import SignaturePad from '@/components/SignaturePad';

const CLIENT_NAME = 'Jamie Doe';
const CLIENT_ADDRESS = 'Av. Principal 1234, Austin, TX 78701';

function generateContractNumber(bookingId: string): string {
  const seed = bookingId.charCodeAt(bookingId.length - 1) || 1;
  const digits = String((seed * 37 + 123) % 10000).padStart(4, '0');
  return `MO-2026-${digits}`;
}

function generateFakeIp(bookingId: string): string {
  const seed = bookingId.charCodeAt(0) || 1;
  return `192.168.1.${100 + (seed % 50)}`;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PACKAGE_FEATURES = [
  'Sonido profesional incluido (PA system 1000W)',
  'Iluminación básica de escenario',
  'Repertorio personalizado (hasta 10 canciones)',
  'Setup y soundcheck 1 hora antes del evento',
  'Pausas de 15 minutos cada 90 minutos',
];

export default function Contrato() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { showToast } = useToast();

  const booking: Booking | undefined = BOOKINGS.find((b) => b.id === bookingId) || BOOKINGS[0];
  const artist = booking ? getArtist(booking.artistId) : undefined;
  const contractNumber = booking ? generateContractNumber(booking.id) : 'MO-2026-0000';
  const fakeIp = booking ? generateFakeIp(booking.id) : '192.168.1.100';

  const [hasSignature, setHasSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<Date | null>(null);
  const todayRef = useRef(new Date());

  useEffect(() => {
    todayRef.current = new Date();
  }, []);

  if (!booking || !artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <div className="text-center">
          <p className="font-display text-xl font-bold text-ink-primary">Contrato no encontrado</p>
          <Link to="/documentos" className="mt-4 inline-flex items-center gap-2 rounded-pill bg-lime px-5 py-3 font-bold text-bg-base">
            <ArrowLeft className="h-4 w-4" /> Ver documentos
          </Link>
        </div>
      </div>
    );
  }

  const total = booking.total;
  const anticipo = Math.round(total * 0.3);
  const resto = total - anticipo;

  const handleSign = () => {
    if (!hasSignature || signed) return;
    setSigning(true);
    setTimeout(() => {
      const now = new Date();
      setSignedAt(now);
      setSigned(true);
      setSigning(false);
      showToast('Contrato firmado ✓ — Guardado en tus documentos');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/documentos" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Volver a documentos
        </Link>

        {/* Contract document — light surface */}
        <div className="rounded-card bg-[#F8F8F8] p-8 text-[#1A1A1A] shadow-2xl sm:p-12">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1A1A] text-sm font-bold text-[#CAFF00]">
                  M
                </div>
                <span className="font-display text-xl font-bold">MusicOn</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="font-mono font-bold">#{contractNumber}</p>
              <p className="text-gray-500">{formatDateTime(todayRef.current).split(',')[0]}</p>
            </div>
          </div>

          <h1 className="mt-6 text-center font-display text-xl font-bold uppercase tracking-wide">
            Contrato de Prestación de Servicios
          </h1>

          {/* Body */}
          <p className="mt-6 text-sm leading-relaxed">
            Entre <strong>MusicOn SRL</strong> (en adelante "la Plataforma") actuando como intermediario, el artista <strong>{artist.name}</strong> (en adelante "el Prestador") y <strong>{CLIENT_NAME}</strong> (en adelante "el Contratante"), se establece el presente contrato de prestación de servicios artísticos bajo las siguientes cláusulas:
          </p>

          {/* Clauses */}
          <div className="mt-6 space-y-4 text-sm leading-relaxed">
            <Clause number={1} title="OBJETO DEL CONTRATO">
              El Prestador se compromete a brindar servicios de <strong>{artist.genre}</strong> para el evento <strong>{booking.event}</strong> el día <strong>{booking.date}</strong> a las <strong>20:00 hs</strong> en <strong>{CLIENT_ADDRESS}</strong>.
            </Clause>
            <Clause number={2} title="DURACIÓN">
              El servicio tendrá una duración de <strong>4 horas</strong>, iniciando a las 20:00 hs.
            </Clause>
            <Clause number={3} title="REMUNERACIÓN">
              El monto total acordado es de <strong>USD {total.toLocaleString()}</strong>. El Contratante abonará un anticipo del 30% (USD {anticipo.toLocaleString()}) al momento de la firma. El saldo restante (USD {resto.toLocaleString()}) será liberado 48 horas después del evento.
            </Clause>
            <Clause number={4} title="CONDICIONES DEL SERVICIO">
              El Prestador proveerá los siguientes elementos y servicios:
              <ul className="mt-2 list-inside list-disc space-y-1">
                {PACKAGE_FEATURES.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Clause>
            <Clause number={5} title="CANCELACIONES">
              Cancelación con más de 7 días de antelación → reembolso del 80%. Cancelación con 3 a 7 días → reembolso del 50%. Cancelación con menos de 72 horas → sin reembolso del anticipo.
            </Clause>
            <Clause number={6} title="RESPONSABILIDADES">
              El Prestador se compromete a presentarse puntualmente, mantener conducta profesional, ejecutar el repertorio acordado y velar por la calidad del servicio. El Contratante se compromete a proveer el espacio y condiciones técnicas acordadas.
            </Clause>
            <Clause number={7} title="PROTECCIÓN DEL PAGO">
              El pago queda retenido en el sistema de escrow de MusicOn hasta la confirmación del servicio por ambas partes. MusicOn actúa como garante del cumplimiento de las obligaciones herein pactadas.
            </Clause>
          </div>

          {/* Signature section */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Client */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Contratante</p>
              <p className="mt-1 text-sm font-semibold">{CLIENT_NAME}</p>
              <div className="mt-3">
                {signed ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-teal bg-teal/5">
                    <Check className="h-8 w-8 text-teal" />
                    <p className="mt-2 text-xs font-bold text-teal">Firmado ✓</p>
                    <p className="text-[10px] text-gray-500">{formatDateTime(signedAt!)}</p>
                  </div>
                ) : (
                  <SignaturePad onChange={setHasSignature} disabled={signing} />
                )}
              </div>
            </div>

            {/* Artist */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Prestador de Servicios</p>
              <p className="mt-1 text-sm font-semibold">{artist.name}</p>
              <div className="mt-3">
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber bg-amber/5">
                  <Clock className="h-7 w-7 text-amber" />
                  <p className="mt-2 text-xs font-bold text-amber">Pendiente firma del artista</p>
                </div>
              </div>
            </div>
          </div>

          {/* Signing metadata */}
          <div className="mt-6 border-t border-gray-300 pt-4 text-xs text-gray-500">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Fecha y hora de firma: {signed ? formatDateTime(signedAt!) : 'Pendiente'}</span>
              <span className="font-mono">IP de firma: {fakeIp}</span>
            </div>
          </div>

          {/* MusicOn Seal */}
          <div className="mt-6 flex justify-center">
            <MusicOnSeal />
          </div>
        </div>

        {/* Success banner */}
        {signed && (
          <div className="mt-4 flex items-center gap-3 rounded-card border border-lime/30 bg-lime/5 p-4 animate-fade-in-up">
            <Check className="h-5 w-5 flex-shrink-0 text-lime" />
            <p className="text-sm text-ink-primary">
              Contrato firmado exitosamente. El artista recibirá una copia por email.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleSign}
            disabled={!hasSignature || signing || signed}
            className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-lime py-3 font-bold text-bg-base transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-ink-muted"
          >
            {signing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Firmando...</>
            ) : signed ? (
              <><Check className="h-5 w-5" /> Contrato firmado</>
            ) : (
              <><FileText className="h-5 w-5" /> Firmar contrato</>
            )}
          </button>
          <button
            onClick={() => showToast('Descargando contrato... (demo)')}
            className="flex flex-1 items-center justify-center gap-2 rounded-pill border border-line bg-bg-surface py-3 font-bold text-ink-primary transition hover:border-lime/40"
          >
            <Download className="h-5 w-5" /> Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function Clause({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p>
        <span className="font-bold">CLÁUSULA {number}. {title}:</span>{' '}
        {children}
      </p>
    </div>
  );
}

function MusicOnSeal() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-80">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#1A1A1A" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#1A1A1A" strokeWidth="1" />
      <path
        id="seal-top"
        d="M 50 12 A 38 38 0 0 1 88 50"
        fill="none"
      />
      <path
        id="seal-bottom"
        d="M 12 50 A 38 38 0 0 0 50 88"
        fill="none"
      />
      <text fontSize="9" fontWeight="bold" fill="#1A1A1A" letterSpacing="2">
        <textPath href="#seal-top" startOffset="50%" textAnchor="middle">
          MusicOn SRL
        </textPath>
      </text>
      <text fontSize="7" fill="#1A1A1A" letterSpacing="1">
        <textPath href="#seal-bottom" startOffset="50%" textAnchor="middle">
          CONTRATO DIGITAL
        </textPath>
      </text>
      <text x="50" y="46" fontSize="16" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">M</text>
      <text x="50" y="60" fontSize="6" fill="#1A1A1A" textAnchor="middle">SEAL</text>
    </svg>
  );
}

import { Music2, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { getContractFields, contractNumberFor, type Contract } from '@/lib/contracts';
import { CONTRACT_CLAUSES } from '@/lib/contractClauses';
import type { BookingWithArtist } from '@/lib/bookings';

type Props = {
  booking: BookingWithArtist;
  clientName: string;
  contract: Contract;
};

function SignatureBox({
  role,
  name,
  at,
}: {
  role: string;
  name: string | null;
  at: string | null;
}) {
  const signed = !!name;
  const date = at ? new Date(at) : null;
  return (
    <div className="rounded-lg border border-line p-4 print:border-black/30">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted print:text-black/60">
        Firma del {role}
      </p>
      <p className="mt-2 text-sm font-semibold text-ink-primary print:text-black">
        Nombre: {name ?? '—'}
      </p>
      <p className="text-xs text-ink-muted print:text-black/60">
        Fecha: {date ? date.toLocaleDateString('es-BO') : '—'} &nbsp; Hora:{' '}
        {date ? date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—'}
      </p>
      <p
        className={`mt-2 flex items-center gap-1 text-xs font-bold ${
          signed ? 'text-lime print:text-black' : 'text-ink-muted print:text-black/50'
        }`}
      >
        {signed ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" /> Firmado ✓
          </>
        ) : (
          'Pendiente de firma'
        )}
      </p>
    </div>
  );
}

/**
 * Documento visual del contrato — reemplaza el <pre> de texto plano con un diseño
 * profesional (encabezado con marca, número de contrato, versión, secciones con
 * jerarquía visual, cláusulas y firmas). Las cláusulas nunca están hardcodeadas
 * acá: se recorren desde CONTRACT_CLAUSES, así que agregar o editar una cláusula
 * no requiere tocar este componente.
 */
export default function ContractDocument({ booking, clientName, contract }: Props) {
  const artist = booking.artist;
  const fields = getContractFields(booking);
  const contractNumber = contractNumberFor(booking.id);
  const bothSigned = !!contract.artist_signed_name && !!contract.client_signed_name;
  const generatedAt = new Date(contract.created_at);

  return (
    <div className="rounded-card border border-line bg-bg-surface p-5 text-ink-primary print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-lime pb-4 print:border-b-2 print:border-black">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime print:border print:border-black print:bg-white">
            <Music2 className="h-5 w-5 text-bg-base print:text-black" />
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Music<span className="text-lime print:text-black print:underline">On</span>
          </span>
        </div>
        <div className="text-right text-xs text-ink-muted print:text-black/70">
          <p>
            Contrato N.° <span className="font-semibold text-ink-primary print:text-black">{contractNumber}</span>
          </p>
          <p>
            Versión <span className="font-semibold text-ink-primary print:text-black">{contract.version}.0</span>
          </p>
          <p>Generado: {generatedAt.toLocaleDateString('es-BO')}</p>
        </div>
      </div>

      <h1 className="mt-5 text-center font-display text-lg font-bold uppercase tracking-wide sm:text-xl">
        Contrato de prestación de servicios musicales
      </h1>

      {/* Partes */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-4 print:border-black/30">
          <p className="text-[11px] font-bold uppercase tracking-wide text-lime print:text-black/70">Cliente</p>
          <p className="mt-1 font-semibold">{clientName}</p>
        </div>
        <div className="rounded-lg border border-line p-4 print:border-black/30">
          <p className="text-[11px] font-bold uppercase tracking-wide text-lime print:text-black/70">
            Artista / Prestador
          </p>
          <p className="mt-1 font-semibold">{artist?.name ?? '—'}</p>
          {!!artist?.members && (
            <p className="text-xs text-ink-muted print:text-black/60">{artist.members} integrante(s)</p>
          )}
        </div>
      </div>

      {/* Servicio contratado */}
      <div className="mt-6 rounded-lg bg-bg-raised p-4 print:bg-black/5">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-lime print:text-black/70">
          Servicio contratado
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-muted print:text-black/60">Servicio</dt>
            <dd className="font-semibold">{booking.event_type}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted print:text-black/60">Fecha</dt>
            <dd className="font-semibold">{booking.event_date}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted print:text-black/60">Horario</dt>
            <dd className="font-semibold">
              {booking.start_time ?? '—'}
              {fields.endTime ? ` – ${fields.endTime}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted print:text-black/60">Duración</dt>
            <dd className="font-semibold">{booking.duration_hours ? `${booking.duration_hours} horas` : '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Lugar del evento */}
      <div className="mt-6">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-lime print:text-black/70">
          Lugar del evento
        </h2>
        <p className="text-sm">{booking.venue ?? '—'}</p>
        {booking.venue_reference && (
          <p className="text-xs text-ink-muted print:text-black/60">Referencia: {booking.venue_reference}</p>
        )}
        {booking.event_lat != null && booking.event_lng != null && (
          <p className="text-xs text-ink-muted print:text-black/60">
            Coordenadas: {booking.event_lat.toFixed(5)}, {booking.event_lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Cantidad de personas y equipamiento */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-lime print:text-black/70">
            Cantidad de personas
          </h2>
          <p className="text-sm">Integrantes del artista: {artist?.members ?? '—'}</p>
          <p className="text-sm">Asistentes estimados: {booking.guest_range ?? '—'}</p>
        </div>
        <div>
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-lime print:text-black/70">
            Equipamiento
          </h2>
          <p className="text-sm">{fields.equipmentList}</p>
        </div>
      </div>

      {/* Condiciones económicas */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-lime print:text-black/70">
          Condiciones económicas
        </h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between border-b border-line/60 py-1 print:border-black/10">
            <dt className="text-ink-muted print:text-black/60">Precio publicado</dt>
            <dd>{formatPrice(fields.publishedPrice)}</dd>
          </div>
          <div className="flex justify-between border-b border-line/60 py-1 print:border-black/10">
            <dt className="text-ink-muted print:text-black/60">Precio inicialmente propuesto</dt>
            <dd>{formatPrice(fields.originalProposed)}</dd>
          </div>
          <div className="flex justify-between border-b border-line/60 py-1 print:border-black/10">
            <dt className="text-ink-muted print:text-black/60">Precio final acordado</dt>
            <dd className="font-semibold text-lime print:text-black">{formatPrice(booking.total)}</dd>
          </div>
          <div className="flex justify-between border-b border-line/60 py-1 print:border-black/10">
            <dt className="text-ink-muted print:text-black/60">Otros costos</dt>
            <dd>Bs 0</dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold">
            <dt>TOTAL</dt>
            <dd>{formatPrice(booking.total)}</dd>
          </div>
        </dl>
      </div>

      {booking.notes?.trim() && (
        <div className="mt-6">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-lime print:text-black/70">
            Condiciones adicionales
          </h2>
          <p className="text-sm">{booking.notes.trim()}</p>
        </div>
      )}

      {/* Cláusulas — configurables desde lib/contractClauses.ts, nunca hardcodeadas acá */}
      <div className="mt-8 space-y-4 border-t border-line pt-6 print:border-black/20">
        {CONTRACT_CLAUSES.map((clause) => (
          <div key={clause.number}>
            <h3 className="text-xs font-bold uppercase tracking-wide">
              Cláusula {clause.number} — {clause.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted print:text-black/80">{clause.body}</p>
          </div>
        ))}
      </div>

      {/* Firmas */}
      <div className="mt-8 grid grid-cols-1 gap-4 border-t border-line pt-6 print:border-black/20 sm:grid-cols-2">
        <SignatureBox role="artista" name={contract.artist_signed_name} at={contract.artist_signed_at} />
        <SignatureBox role="cliente" name={contract.client_signed_name} at={contract.client_signed_at} />
      </div>
      <p
        className={`mt-4 text-center text-sm font-bold ${bothSigned ? 'text-lime print:text-black' : 'text-ink-muted'}`}
      >
        {bothSigned ? 'Contrato firmado por ambas partes ✓' : 'Pendiente de firma'}
      </p>

      {/* Pie de página */}
      <div className="mt-8 border-t border-line pt-3 text-center text-[10px] text-ink-muted print:border-black/20 print:text-black/50">
        MusicOn — Documento generado automáticamente por la plataforma · Contrato {contractNumber} · Versión{' '}
        {contract.version}.0
      </div>
    </div>
  );
}

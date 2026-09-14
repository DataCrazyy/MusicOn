import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Download, Eye, Check, Clock, Shield,
} from 'lucide-react';
import { BOOKINGS, getArtist } from '@/data';
import { useToast } from '@/components/Toast';

interface ContractRecord {
  bookingId: string;
  number: string;
  status: 'signed' | 'pending';
}

function generateContractNumber(bookingId: string): string {
  const seed = bookingId.charCodeAt(bookingId.length - 1) || 1;
  const digits = String((seed * 37 + 123) % 10000).padStart(4, '0');
  return `MO-2026-${digits}`;
}

const CONTRACT_STATUSES: Record<string, 'signed' | 'pending'> = {
  b1: 'pending',
  b2: 'signed',
  b3: 'pending',
  b4: 'signed',
};

export default function Documentos() {
  const { showToast } = useToast();

  const contracts: ContractRecord[] = BOOKINGS.map((b) => ({
    bookingId: b.id,
    number: generateContractNumber(b.id),
    status: CONTRACT_STATUSES[b.id] || 'pending',
  }));

  const signedCount = contracts.filter((c) => c.status === 'signed').length;

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/client" className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" /> Volver a mi perfil
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-primary">Mis Documentos</h1>
            <p className="mt-1 text-sm text-ink-muted">Contratos digitales de tus reservas</p>
          </div>
          <div className="flex items-center gap-2 rounded-card border border-line bg-bg-surface px-4 py-2.5">
            <FileText className="h-5 w-5 text-lime" />
            <span className="text-sm font-medium text-ink-primary">
              <span className="font-bold text-lime">{signedCount}</span>/{contracts.length} firmados
            </span>
          </div>
        </div>

        {/* Contract cards */}
        <div className="space-y-4">
          {contracts.map((contract, i) => {
            const booking = BOOKINGS.find((b) => b.id === contract.bookingId);
            const artist = booking ? getArtist(booking.artistId) : undefined;
            if (!booking || !artist) return null;

            return (
              <div
                key={contract.bookingId}
                className="animate-fade-in-up flex flex-col gap-4 rounded-card border border-line bg-bg-surface p-5 transition hover:border-lime/30 sm:flex-row sm:items-center"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Icon */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-bg-raised">
                  <FileText className="h-6 w-6 text-ink-muted" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink-primary">#{contract.number}</span>
                    <span className={`flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-bold ${
                      contract.status === 'signed'
                        ? 'bg-teal/15 text-teal'
                        : 'bg-amber/15 text-amber'
                    }`}>
                      {contract.status === 'signed'
                        ? <><Check className="h-3 w-3" /> Firmado</>
                        : <><Clock className="h-3 w-3" /> Pendiente firma</>
                      }
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink-primary">{artist.name}</p>
                  <p className="text-xs text-ink-muted">{booking.event} · {booking.date}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/contrato/${contract.bookingId}`}
                    className="flex items-center gap-1.5 rounded-pill border border-line bg-bg-raised px-3 py-2 text-xs font-bold text-ink-primary transition hover:border-lime/40"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver contrato
                  </Link>
                  <button
                    onClick={() => showToast('Descargando contrato... (demo)')}
                    className="flex items-center gap-1.5 rounded-pill border border-line bg-bg-raised px-3 py-2 text-xs font-bold text-ink-muted transition hover:border-lime/40 hover:text-lime"
                  >
                    <Download className="h-3.5 w-3.5" /> Descargar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info banner */}
        <div className="mt-6 flex items-start gap-3 rounded-card border border-line bg-bg-surface p-4">
          <Shield className="h-5 w-5 flex-shrink-0 text-lime" />
          <p className="text-xs text-ink-muted">
            Todos los contratos digitales de MusicOn tienen validez legal y están respaldados por nuestra plataforma de escrow. La firma digital queda registrada con fecha, hora y IP para tu seguridad.
          </p>
        </div>
      </div>
    </div>
  );
}

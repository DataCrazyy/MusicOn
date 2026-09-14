import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, Copy, Check, Share2, Users, DollarSign, TrendingUp,
  ArrowRight, ChevronRight, Sparkles,
} from 'lucide-react';
import { REFERRALS, REFERRAL_STATS, type Referral } from '@/data';
import { useToast } from '@/components/Toast';

export default function Referidos() {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://musicon.app/r/jamie-reyes-8f2a';

  const copyLink = () => {
    navigator.clipboard?.writeText(referralLink).catch(() => {});
    setCopied(true);
    showToast('Link de referido copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMsg = encodeURIComponent(
    '¡Te invito a MusicOn! Reservá artistas verificados para tu evento y nosotros dos ganamos $10 de crédito. Registrate con mi link: ' + referralLink,
  );

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
          <Link to="/dashboard" className="hover:text-lime">Dashboard</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-ink-primary">Referidos</span>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-card border border-lime/20 bg-gradient-to-br from-lime/10 via-bg-surface to-bg-surface p-8 sm:p-10">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-lime/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <div className="mb-3 flex items-center gap-2">
                <Gift className="h-6 w-6 text-lime" />
                <span className="text-sm font-bold uppercase tracking-wide text-lime">Programa de referidos</span>
              </div>
              <h1 className="font-display text-3xl font-extrabold text-ink-primary sm:text-4xl">
                Invitá a un artista, ganás $10 de crédito
              </h1>
              <p className="mt-3 text-sm text-ink-muted leading-relaxed">
                Por cada amigo que se registre y complete su primer booking, ambos reciben $10 de crédito para usar en cualquier artista verificado.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-lime/15 ring-4 ring-lime/5">
                <Gift className="h-12 w-12 text-lime" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatPill icon={Users} label="Invitados" value={REFERRAL_STATS.totalInvited} accent="text-lime" />
          <StatPill icon={CheckCircle2Green} label="Registrados" value={REFERRAL_STATS.totalRegistered} accent="text-teal" />
          <StatPill icon={DollarSign} label="Crédito ganado" value={REFERRAL_STATS.totalEarned} prefix="$" accent="text-amber" />
          <StatPill icon={TrendingUp} label="Pendiente" value={REFERRAL_STATS.pendingCredit} prefix="$" accent="text-violet" />
        </div>

        {/* Referral link + share */}
        <div className="mt-6 rounded-card border border-line bg-bg-surface p-6">
          <h2 className="font-display text-xl font-bold text-ink-primary">Tu link de referido</h2>
          <p className="mt-1 text-sm text-ink-muted">Compartí este link. Cuando se registren, se los asocia automáticamente a vos.</p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-input border border-line bg-bg-raised px-4 py-3">
              <Link2 className="h-5 w-5 flex-shrink-0 text-ink-muted" />
              <span className="truncate text-sm text-ink-primary">{referralLink}</span>
            </div>
            <button
              onClick={copyLink}
              className={`flex items-center justify-center gap-2 rounded-pill px-5 py-3 font-bold transition ${
                copied ? 'bg-teal text-bg-base' : 'bg-lime text-bg-base hover:bg-lime-dark'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-pill border border-lime/30 bg-lime/10 px-4 py-2.5 text-sm font-bold text-lime transition hover:bg-lime/20"
            >
              <WhatsappIcon /> Compartir por WhatsApp
            </a>
            <button
              onClick={() => showToast('Compartiendo en redes...')}
              className="flex items-center gap-2 rounded-pill border border-line bg-bg-raised px-4 py-2.5 text-sm font-medium text-ink-primary transition hover:border-lime/30"
            >
              <Share2 className="h-4 w-4" /> Más opciones
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 rounded-card border border-line bg-bg-surface p-6">
          <h2 className="font-display text-xl font-bold text-ink-primary">Cómo funciona</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <Step
              num="1"
              icon={Share2}
              title="Compartís tu link"
              desc="Envíaselo a amigos que necesiten artistas para sus eventos."
            />
            <Step
              num="2"
              icon={Users}
              title="Se registran"
              desc="Crean su cuenta en MusicOn usando tu link de referido."
            />
            <Step
              num="3"
              icon={Sparkles}
              title="Ganan su primer booking"
              desc="Cuando reserven y paguen, vos recibís $10 de crédito automáticamente."
            />
          </div>
        </div>

        {/* Referrals table */}
        <div className="mt-6 rounded-card border border-line bg-bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-primary">Mis referidos</h2>
            <span className="text-sm text-ink-muted">{REFERRALS.length} invitados</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                  <th className="pb-3 pr-4">Nombre</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {REFERRALS.map((ref) => (
                  <tr key={ref.id} className="border-b border-line/50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-raised text-xs font-bold text-ink-primary">
                          {ref.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-primary">{ref.name}</p>
                          <p className="text-xs text-ink-muted">{ref.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{ref.date}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={ref.status} />
                    </td>
                    <td className="py-3 text-right">
                      {ref.amount > 0 ? (
                        <span className="font-bold text-lime">+${ref.amount}</span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 flex items-center justify-between rounded-card border border-line bg-bg-surface p-6">
          <div>
            <p className="font-display text-lg font-bold text-ink-primary">¿Necesitás un artista para tu próximo evento?</p>
            <p className="text-sm text-ink-muted">Explorá más de 200 artistas verificados.</p>
          </div>
          <Link
            to="/explore"
            className="flex items-center gap-2 rounded-pill bg-lime px-5 py-3 font-bold text-bg-base transition hover:bg-lime-dark"
          >
            Explorar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, prefix, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; prefix?: string; accent: string }) {
  return (
    <div className="rounded-card border border-line bg-bg-surface p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-raised">
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink-primary">
        {prefix}{value.toLocaleString()}
      </p>
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}

function Step({ num, icon: Icon, title, desc }: { num: string; icon: typeof Share2; title: string; desc: string }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/15 text-lime">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-display text-3xl font-extrabold text-bg-raised">{num}</span>
      </div>
      <h3 className="mt-3 font-display text-base font-bold text-ink-primary">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted leading-relaxed">{desc}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Referral['status'] }) {
  const styles: Record<Referral['status'], string> = {
    'Registrado': 'bg-bg-raised text-ink-muted',
    'Primer booking': 'bg-amber/15 text-amber',
    'Crédito ganado': 'bg-lime/15 text-lime',
  };
  return (
    <span className={`rounded-pill px-3 py-1 text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}

function CheckCircle2Green(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function Link2(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3M9 17H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

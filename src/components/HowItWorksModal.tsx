import { X, Send, CheckCircle2, FileSignature, CreditCard, Music4, Star } from 'lucide-react';

const STEPS = [
  { icon: Send, title: 'Envías tu solicitud', text: 'Eliges al artista, la fecha, el lugar y los detalles del evento. Todavía no se cobra nada.' },
  { icon: CheckCircle2, title: 'El artista acepta', text: 'El artista revisa tu solicitud y la acepta o la rechaza. Pueden conversar por el chat para ajustar detalles.' },
  { icon: FileSignature, title: 'Se confirma el precio y el contrato', text: 'Acuerdan el precio final y se genera un contrato digital con todos los datos del servicio.' },
  { icon: CreditCard, title: 'Firman y pagas', text: 'Revisas el contrato, lo firmas digitalmente y realizas el pago para confirmar la contratación.' },
  { icon: Music4, title: 'Se realiza el servicio', text: 'El artista se presenta en la fecha y el lugar acordados.' },
  { icon: Star, title: 'Dejas tu reseña', text: 'Una vez finalizado el evento, puedes calificar al artista para ayudar a otros usuarios.' },
];

export default function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg-base/90 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-card border border-line bg-bg-surface p-6 sm:rounded-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-primary">¿Cómo funciona?</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-bg-raised"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="space-y-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-lime/10 text-lime">
                <step.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink-primary">
                  {i + 1}. {step.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-pill bg-lime px-4 py-3 text-sm font-bold text-bg-base transition hover:bg-lime-dark"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

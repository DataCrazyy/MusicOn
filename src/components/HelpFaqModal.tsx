import { useState } from 'react';
import { X, ChevronDown, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

const FAQ_ITEMS = [
  {
    q: '¿Cómo busco un artista?',
    a: 'Desde "Explorar" puedes buscar por nombre o ciudad, y filtrar por género, ubicación, presupuesto y cantidad de personas del artista. También puedes ordenar los resultados por precio o por mejor valorados.',
  },
  {
    q: '¿Qué pasa cuando envío una solicitud de reserva?',
    a: 'Se crea una solicitud en estado "Pendiente de aprobación" — todavía no se confirma nada ni se cobra. El artista la revisa y decide si la acepta o la rechaza. Puedes seguir el estado en "Solicitudes" o en el Chat.',
  },
  {
    q: '¿Puedo negociar el precio?',
    a: 'Sí. Mientras la solicitud está pendiente, tanto tú como el artista pueden proponer un precio distinto al publicado directamente desde el chat de esa solicitud, antes de que el artista decida aceptar.',
  },
  {
    q: '¿Para qué sirve el chat?',
    a: 'Cada solicitud tiene su propia conversación con el artista, donde puedes resolver dudas, negociar el precio y ver el estado actual. El artista también puede aceptar o rechazar la solicitud directamente desde ahí.',
  },
  {
    q: '¿Qué pasa si el artista acepta mi solicitud?',
    a: 'Te avisamos que fue aceptada y se habilita "Confirmar contratación": ahí revisas los datos finales y el precio, ves el contrato digital generado automáticamente, lo firmas y realizas el pago para cerrar el acuerdo.',
  },
  {
    q: '¿Cómo funciona el contrato digital?',
    a: 'Se genera solo, con los datos de tu solicitud (servicio, fecha, horario, dirección, precio acordado, equipamiento y condiciones). Lo firmas escribiendo tu nombre completo y aceptando los términos, y puedes descargarlo en PDF.',
  },
  {
    q: '¿Cómo se paga?',
    a: 'En esta versión el pago se simula dentro de la plataforma para poder probar todo el flujo — todavía no se procesa dinero real. Al confirmar el pago, la contratación queda cerrada.',
  },
  {
    q: '¿Qué pasa si el artista rechaza mi solicitud?',
    a: 'La solicitud pasa a "Rechazada" y puedes ver el motivo si el artista dejó un mensaje. No se realiza ningún cobro. Puedes buscar otro artista desde "Explorar" cuando quieras.',
  },
  {
    q: '¿Puedo cancelar una solicitud o contratación?',
    a: 'Por ahora, coordina cualquier cambio o cancelación directamente con el artista por el chat de la solicitud.',
  },
  {
    q: '¿Cuándo puedo dejar una reseña?',
    a: 'Una vez que el servicio se realizó y el artista lo marca como completado, puedes calificar tu experiencia con estrellas y un comentario desde "Solicitudes". Las reseñas quedan visibles en el perfil del artista.',
  },
];

export default function HelpFaqModal({ onClose }: { onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return createPortal(
    // Fondo semitransparente y clickeable para cerrar — nunca bloquea permanentemente la
    // navegación superior ni el contenido: en desktop el panel es lateral (no un modal
    // centrado que tapa todo), y en mobile es un bottom sheet que respeta el safe-area.
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-bg-base/70 backdrop-blur-[2px] sm:items-stretch sm:justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-card border border-line bg-bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-full sm:max-h-none sm:w-[400px] sm:max-w-[90vw] sm:rounded-none sm:rounded-l-card sm:border-y-0 sm:border-r-0 sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-primary">
            <HelpCircle className="h-5 w-5 text-lime" /> Preguntas frecuentes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-bg-raised"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={item.q} className="overflow-hidden rounded-lg border border-line">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 bg-bg-base px-4 py-3 text-left text-sm font-semibold text-ink-primary"
                  >
                    {item.q}
                    <ChevronDown
                      className={`h-4 w-4 flex-shrink-0 text-ink-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="border-t border-line px-4 py-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

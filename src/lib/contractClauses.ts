export type ContractClause = {
  number: number;
  title: string;
  body: string;
};

/**
 * Cláusulas del contrato como configuración de datos, no como texto embebido dentro
 * de un componente: para editar una cláusula (o agregar una nueva) alcanza con tocar
 * este archivo, sin tener que modificar la lógica de armado ni de renderizado del
 * contrato. Tanto el texto plano guardado en contracts.terms como el documento visual
 * (ContractDocument) leen de esta misma lista — nunca se duplica el contenido.
 */
export const CONTRACT_CLAUSES: ContractClause[] = [
  {
    number: 1,
    title: 'Objeto del contrato',
    body: 'El artista se compromete a prestar un servicio de presentación musical en vivo para el evento del cliente, bajo las condiciones detalladas en la sección "Servicio contratado" de este documento.',
  },
  {
    number: 2,
    title: 'Fecha, horario y duración',
    body: 'La fecha, la hora de inicio, la duración estimada y la hora estimada de finalización son las indicadas en la sección "Servicio contratado", resultado del acuerdo entre las partes.',
  },
  {
    number: 3,
    title: 'Lugar de prestación del servicio',
    body: 'El servicio se prestará en la dirección y ubicación indicadas en la sección "Lugar del evento" de este documento.',
  },
  {
    number: 4,
    title: 'Precio y forma de pago',
    body: 'El precio final a pagar es el indicado como "Precio final acordado" en la sección "Condiciones económicas". El pago se realiza a través de la plataforma MusicOn antes de la fecha del evento.',
  },
  {
    number: 5,
    title: 'Equipamiento incluido',
    body: 'El artista se compromete a proporcionar el equipamiento detallado en la sección "Equipamiento" de este documento.',
  },
  {
    number: 6,
    title: 'Obligaciones del artista',
    body: 'El artista se compromete a presentarse en la fecha, horario y lugar acordados, con el equipamiento indicado, y a prestar el servicio contratado en las condiciones pactadas entre las partes.',
  },
  {
    number: 7,
    title: 'Obligaciones del cliente',
    body: 'El cliente se compromete a facilitar el acceso al lugar del evento y las condiciones necesarias para la correcta prestación del servicio, y a realizar el pago acordado en los plazos establecidos por la plataforma.',
  },
  {
    number: 8,
    title: 'Modificaciones',
    body: 'Una vez firmado por ambas partes, este contrato no puede editarse directamente. Cualquier cambio debe solicitarse formalmente desde la plataforma ("Solicitar modificación del contrato"), requiere la aprobación expresa de la otra parte, y genera una nueva versión de este documento que ambas partes deben volver a firmar. Las versiones anteriores quedan guardadas como historial y nunca se pierden.',
  },
  {
    number: 9,
    title: 'Cancelaciones',
    body: 'La cancelación se rige por las políticas generales de la plataforma MusicOn. Cualquier cancelación debe comunicarse a la otra parte a través del chat de esta solicitud lo antes posible.',
  },
  {
    number: 10,
    title: 'Incumplimiento',
    body: 'En caso de incumplimiento de las condiciones acordadas por cualquiera de las partes, la parte afectada podrá reportarlo a través de la plataforma MusicOn para su revisión.',
  },
  {
    number: 11,
    title: 'Fuerza mayor',
    body: 'Ninguna de las partes será responsable por incumplimientos derivados de circunstancias imprevisibles o inevitables fuera de su control razonable (fuerza mayor).',
  },
  {
    number: 12,
    title: 'Aceptación',
    body: 'Ambas partes declaran haber revisado y aceptado la totalidad de las condiciones descritas en este documento mediante su firma digital dentro de la plataforma, según consta en la sección de firmas.',
  },
];

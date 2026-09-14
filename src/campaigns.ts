import type { Artist } from '@/data';

export interface DonationTier {
  id: string;
  emoji: string;
  name: string;
  amount: number;
  description: string;
  perks: string[];
}

export interface CampaignUpdate {
  id: string;
  date: string;
  title: string;
  text: string;
}

export interface Supporter {
  id: string;
  name: string;
  amount: number;
  timeAgo: string;
  color: string;
}

export interface Campaign {
  artistId: string;
  title: string;
  description: string[];
  goal: number;
  raised: number;
  daysLeft: number;
  supporterCount: number;
  coverEmoji: string;
  tiers: DonationTier[];
  updates: CampaignUpdate[];
  supporters: Supporter[];
}

const SUPPORTER_COLORS = [
  'bg-lime/20 text-lime',
  'bg-teal/20 text-teal',
  'bg-amber/20 text-amber',
  'bg-coral/20 text-coral',
  'bg-violet/20 text-violet',
];

export const CAMPAIGNS: Record<string, Campaign> = {
  a1: {
    artistId: 'a1',
    title: 'Grabación de mi primer EP independiente',
    description: [
      'Después de años tocando en bodas, eventos corporativos y festivales, llegó el momento de grabar nuestro propio material. Este EP tendrá 5 canciones originales que mezclan nuestra energía en vivo con la calidad de un estudio profesional.',
      'Los fondos van a cubrir las 10 horas de estudio en Austin Recording Co., mezcla y masterización profesional, y la producción física de 500 copias en CD + vinilo de edición limitada para nuestros primeros seguidores.',
      'Cada persona que apoye este proyecto se convertirá en parte de la historia de The Midnight Set. Vamos a documentar todo el proceso y compartirlo exclusivamente con quienes hagan esto posible.',
    ],
    goal: 2500,
    raised: 1340,
    daysLeft: 18,
    supporterCount: 23,
    coverEmoji: '🎸',
    tiers: [
      { id: 't1', emoji: '☕', name: 'Café digital', amount: 5, description: 'Tu apoyo ayuda a cubrir costos de producción', perks: ['Agradecimiento digital personalizado'] },
      { id: 't2', emoji: '🎵', name: 'Fan del artista', amount: 15, description: 'Formás parte oficial del proyecto', perks: ['Nombre en los créditos del EP', 'Acceso anticipado a las canciones'] },
      { id: 't3', emoji: '💎', name: 'Productor honorario', amount: 50, description: 'Sos parte fundamental de este sueño', perks: ['Todo lo anterior', 'Invitación al showcase de lanzamiento', 'Meet & greet con el artista'] },
    ],
    updates: [
      { id: 'u1', date: 'Ago 28, 2026', title: '¡Llegamos al 50%! Gracias a todos', text: 'No puedo creer que ya estamos a la mitad de la meta. Cada aporte me acerca más al estudio y me llena de motivación. ¡Vamos por más!' },
      { id: 'u2', date: 'Ago 15, 2026', title: 'Primeras maquetas listas', text: 'Grabé las maquetas de 3 de las 5 canciones que van a formar parte del EP. Estoy emocionadísimo de compartir avances pronto con todos los que apoyaron.' },
    ],
    supporters: [
      { id: 's1', name: 'María V.', amount: 15, timeAgo: 'hace 2h', color: SUPPORTER_COLORS[0] },
      { id: 's2', name: 'Carlos R.', amount: 50, timeAgo: 'hace 5h', color: SUPPORTER_COLORS[1] },
      { id: 's3', name: 'Lucía P.', amount: 5, timeAgo: 'hace 1d', color: SUPPORTER_COLORS[2] },
      { id: 's4', name: 'Diego M.', amount: 15, timeAgo: 'hace 2d', color: SUPPORTER_COLORS[3] },
      { id: 's5', name: 'Ana S.', amount: 5, timeAgo: 'hace 3d', color: SUPPORTER_COLORS[4] },
    ],
  },
  a3: {
    artistId: 'a3',
    title: 'Nuevo equipo de sonido para giras',
    description: [
      'Como DJ, el sonido es todo. Después de 3 años usando el mismo equipo, necesito actualizar mi setup para llevar una experiencia sonora de nivel mundial a cada evento.',
      'Los fondos van a cubrir un nuevo sistema de monitores, interface de audio profesional, y un controlador Pioneer de última generación. Esto me permite ofrecer sets con calidad de festival en cualquier venue.',
    ],
    goal: 1800,
    raised: 890,
    daysLeft: 12,
    supporterCount: 14,
    coverEmoji: '🎧',
    tiers: [
      { id: 't1', emoji: '☕', name: 'Café digital', amount: 5, description: 'Tu apoyo ayuda a cubrir costos', perks: ['Agradecimiento digital'] },
      { id: 't2', emoji: '🎵', name: 'Fan del artista', amount: 15, description: 'Acceso exclusivo a mixes', perks: ['Mix exclusivo para apoyadores', 'Acceso anticipado a nuevos tracks'] },
      { id: 't3', emoji: '💎', name: 'Productor honorario', amount: 50, description: 'VIP total', perks: ['Todo lo anterior', 'Entrada VIP a un set en LA', 'Sesión privada de 30min'] },
    ],
    updates: [
      { id: 'u1', date: 'Ago 30, 2026', title: 'Ya elegí el controlador', text: 'Después de probar varias opciones, me decidí por el Pioneer DDJ-FLX10. ¡Es una bestia! Gracias a todos los que hicieron esto posible.' },
    ],
    supporters: [
      { id: 's1', name: 'Roberto J.', amount: 15, timeAgo: 'hace 1d', color: SUPPORTER_COLORS[0] },
      { id: 's2', name: 'Patricia L.', amount: 5, timeAgo: 'hace 3d', color: SUPPORTER_COLORS[1] },
      { id: 's3', name: 'Fernando K.', amount: 50, timeAgo: 'hace 5d', color: SUPPORTER_COLORS[2] },
    ],
  },
  a7: {
    artistId: 'a7',
    title: 'Videoclip de "Gold Standard"',
    description: [
      '"Gold Standard" es mi track más escuchado y los fans piden un video desde que salió. Es hora de darle la producción que merece.',
      'Vamos a grabar en locaciones de Atlanta con un director profesional, equipo de cámara 4K, y post-producción con efectos visuales. El video será lanzado en YouTube y usado para promoción en todas las plataformas.',
    ],
    goal: 3000,
    raised: 2100,
    daysLeft: 25,
    supporterCount: 31,
    coverEmoji: '🎤',
    tiers: [
      { id: 't1', emoji: '☕', name: 'Café digital', amount: 5, description: 'Apoio simbólico', perks: ['Agradecimiento en redes'] },
      { id: 't2', emoji: '🎵', name: 'Fan del artista', amount: 15, description: 'Extras del video', perks: ['Bloopers del video', 'Download del track'] },
      { id: 't3', emoji: '💎', name: 'Productor honorario', amount: 50, description: 'Aparecés en el video', perks: ['Todo lo anterior', 'Aparición como extra en el video', 'Firma digital del artista'] },
    ],
    updates: [
      { id: 'u1', date: 'Ago 25, 2026', title: '70% y contando', text: 'Ya reservamos las locaciones y el director confirmó. Solo nos falta un empujón para llegar a la meta. ¡Compartan con sus amigos!' },
      { id: 'u2', date: 'Ago 10, 2026', title: 'Storyboard listo', text: 'El director mandó el storyboard y quedó increíble. Cada escena está pensada para mostrar la energía de Atlanta. No veo la hora de grabar.' },
    ],
    supporters: [
      { id: 's1', name: 'Jasmine T.', amount: 50, timeAgo: 'hace 6h', color: SUPPORTER_COLORS[0] },
      { id: 's2', name: 'Mike D.', amount: 15, timeAgo: 'hace 12h', color: SUPPORTER_COLORS[1] },
      { id: 's3', name: 'Rosa C.', amount: 15, timeAgo: 'hace 2d', color: SUPPORTER_COLORS[2] },
      { id: 's4', name: 'Tony V.', amount: 5, timeAgo: 'hace 3d', color: SUPPORTER_COLORS[3] },
      { id: 's5', name: 'Erika N.', amount: 15, timeAgo: 'hace 4d', color: SUPPORTER_COLORS[4] },
    ],
  },
};

export function getCampaign(artistId: string): Campaign | undefined {
  return CAMPAIGNS[artistId];
}

export function hasActiveCampaign(artistId: string): boolean {
  return artistId in CAMPAIGNS;
}

export function getArtistIdsWithCampaigns(): string[] {
  return Object.keys(CAMPAIGNS);
}

// Artist's own campaign for dashboard widget
export const DASHBOARD_CAMPAIGN = CAMPAIGNS.a1;

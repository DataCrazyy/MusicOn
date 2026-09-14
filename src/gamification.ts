export type LevelId = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';

export interface Level {
  id: LevelId;
  name: string;
  emoji: string;
  minXp: number;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
  rewards: string[];
}

export const LEVELS: Level[] = [
  {
    id: 'bronze',
    name: 'BRONCE',
    emoji: '🥉',
    minXp: 0,
    color: '#CD7F32',
    bgClass: 'bg-amber/10',
    textClass: 'text-amber',
    borderClass: 'border-amber/30',
    ringClass: 'ring-amber/30',
    rewards: [
      'Perfil activo en la plataforma',
      'Sistema de reseñas',
      'Badge de nivel',
    ],
  },
  {
    id: 'silver',
    name: 'PLATA',
    emoji: '🥈',
    minXp: 500,
    color: '#C0C0C0',
    bgClass: 'bg-bg-elevated',
    textClass: 'text-ink-primary',
    borderClass: 'border-line',
    ringClass: 'ring-line',
    rewards: [
      '1 grabación de set gratuita',
      'Visibilidad extra en búsquedas',
      'Badge Plata en perfil',
    ],
  },
  {
    id: 'gold',
    name: 'ORO',
    emoji: '🥇',
    minXp: 2000,
    color: '#FFD700',
    bgClass: 'bg-amber/10',
    textClass: 'text-amber',
    borderClass: 'border-amber/40',
    ringClass: 'ring-amber/40',
    rewards: [
      'Sesión fotográfica profesional',
      'Aparecer en homepage de MusicOn',
      'Workshop de marca personal gratuito',
      'Reducción de comisión a 12%',
    ],
  },
  {
    id: 'diamond',
    name: 'DIAMANTE',
    emoji: '💎',
    minXp: 5000,
    color: '#00D9FF',
    bgClass: 'bg-teal/10',
    textClass: 'text-teal',
    borderClass: 'border-teal/40',
    ringClass: 'ring-teal/40',
    rewards: [
      '"En vivo de casa" estilo Acashore',
      'Producción de contenido para RRSS',
      'Comisión reducida al 10%',
      '2 grabaciones de set por mes',
    ],
  },
  {
    id: 'legendary',
    name: 'LEGENDARIO',
    emoji: '👑',
    color: '#CAFF00',
    minXp: 10000,
    bgClass: 'bg-lime/10',
    textClass: 'text-lime',
    borderClass: 'border-lime/40',
    ringClass: 'ring-lime/40',
    rewards: [
      'Portada de MusicOn',
      'Grabación de EP/álbum profesional',
      '0% comisión en 1 booking por mes',
      'Embajador oficial MusicOn',
    ],
  },
];

export interface XpActivity {
  icon: string;
  label: string;
  xp: string;
}

export const XP_ACTIVITIES: XpActivity[] = [
  { icon: '✅', label: 'Completar un evento', xp: '+100 XP' },
  { icon: '⭐', label: 'Recibir reseña de 5 estrellas', xp: '+50 XP' },
  { icon: '📷', label: 'Subir foto de evento', xp: '+20 XP' },
  { icon: '🎵', label: 'Subir muestra de audio', xp: '+30 XP' },
  { icon: '✔', label: 'Verificar identidad', xp: '+200 XP (one time)' },
  { icon: '⚡', label: 'Responder en menos de 1 hora', xp: '+10 XP' },
  { icon: '📅', label: 'Mantener calendario actualizado', xp: '+15 XP/semana' },
  { icon: '🔥', label: 'Racha de 7 días activo', xp: '+75 XP bonus' },
];

export interface Challenge {
  id: string;
  label: string;
  current: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

export const DAILY_CHALLENGES: Challenge[] = [
  { id: 'msg', label: 'Responder 2 mensajes hoy', current: 1, target: 2, xpReward: 15, completed: false },
  { id: 'avail', label: 'Mantener disponibilidad actualizada', current: 1, target: 1, xpReward: 15, completed: true },
  { id: 'photo', label: 'Subir 1 foto de tu último evento', current: 0, target: 1, xpReward: 20, completed: false },
];

export interface Achievement {
  id: string;
  emoji: string;
  label: string;
  description: string;
  status: 'unlocked' | 'progress' | 'locked';
  progress?: { current: number; target: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', emoji: '🎯', label: 'Primer booking', description: 'Tu primer evento reservado', status: 'unlocked' },
  { id: 'fast', emoji: '⚡', label: 'Respuesta relámpago', description: 'Responde en menos de 30min', status: 'unlocked' },
  { id: 'stars', emoji: '🌟', label: '5 estrellas', description: '10 reseñas perfectas', status: 'progress', progress: { current: 7, target: 10 } },
  { id: 'century', emoji: '🎉', label: 'Centenario', description: '100 eventos', status: 'progress', progress: { current: 94, target: 100 } },
  { id: 'profile', emoji: '💎', label: 'Perfil completo', description: 'Completa tu perfil al 100%', status: 'progress', progress: { current: 72, target: 100 } },
  { id: 'streak', emoji: '🔥', label: 'En racha', description: '30 días seguidos', status: 'progress', progress: { current: 12, target: 30 } },
  { id: 'year', emoji: '👑', label: 'Artista del año', description: 'El más reservado del año', status: 'locked' },
];

export const ARTIST_XP = {
  current: 1240,
  streak: 12,
  earnedToday: 100,
  nextReward: 'Sesión de fotos profesional',
};

export function getCurrentLevel(xp: number): { level: Level; index: number; nextLevel: Level | null; xpInLevel: number; xpForNext: number } {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) index = i;
  }
  const level = LEVELS[index];
  const nextLevel = index < LEVELS.length - 1 ? LEVELS[index + 1] : null;
  const xpInLevel = xp - level.minXp;
  const xpForNext = nextLevel ? nextLevel.minXp - level.minXp : 0;
  return { level, index, nextLevel, xpInLevel, xpForNext };
}

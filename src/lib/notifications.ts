import { supabase } from './supabase';

export type AppNotification = {
  id: string;
  user_id: string;
  booking_id: string | null;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

/** Crea una notificación para un usuario. Nunca debe romper el flujo principal si
 * falla — un error acá no debe impedir que se guarde la solicitud, la propuesta, la
 * firma, etc. que la origina. */
export async function createNotification(input: {
  userId: string;
  bookingId?: string | null;
  type: string;
  message: string;
  link?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    booking_id: input.bookingId ?? null,
    type: input.type,
    message: input.message,
    link: input.link ?? null,
  });
  if (error) console.error('No se pudo crear la notificación:', error.message);
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as AppNotification[];
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

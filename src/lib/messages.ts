import { supabase } from './supabase';

export type BookingMessage = {
  id: string;
  booking_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

export async function listMessages(bookingId: string): Promise<BookingMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as BookingMessage[];
}

export async function sendMessage(
  bookingId: string,
  senderId: string,
  recipientId: string,
  body: string
): Promise<BookingMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ booking_id: bookingId, sender_id: senderId, recipient_id: recipientId, body })
    .select()
    .single();

  if (error) throw error;
  return data as BookingMessage;
}

export async function listUnreadBookingIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('messages')
    .select('booking_id')
    .eq('recipient_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return new Set((data as { booking_id: string }[]).map((row) => row.booking_id));
}

export async function markThreadRead(bookingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('booking_id', bookingId)
    .eq('recipient_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

export function subscribeToBookingMessages(
  bookingId: string,
  onInsert: (message: BookingMessage) => void
) {
  const channel = supabase
    .channel(`booking-messages-${bookingId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
      (payload) => onInsert(payload.new as BookingMessage)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

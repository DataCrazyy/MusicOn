import { supabase } from './supabase';

export async function updateProfileName(userId: string, fullName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId);
  if (error) throw error;
}

export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
  if (error) throw error;
}

export async function uploadAvatarPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('artist-photos').upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('artist-photos').getPublicUrl(path);
  return data.publicUrl;
}

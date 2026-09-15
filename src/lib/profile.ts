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

export async function setProfileRole(userId: string, role: 'client' | 'artist'): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export async function completeOnboarding(
  userId: string,
  data: { full_name: string; role: 'client' | 'artist'; avatar_url?: string | null }
): Promise<void> {
  const payload: Record<string, unknown> = {
    full_name: data.full_name,
    role: data.role,
    onboarded: true,
  };
  if (data.avatar_url) payload.avatar_url = data.avatar_url;

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw error;
}

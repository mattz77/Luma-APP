import { supabase } from '@/lib/supabase';
import {
  uploadImageToStorage,
  deleteImageFromStorage,
  getAvatarStorageBucket,
  PROFILE_PHOTOS_FOLDER,
  type UploadImageOptions,
} from '@/lib/storage';

export interface UserUpdate {
  name?: string;
  avatar_url?: string | null;
  phone?: string | null;
  birth_date?: string | null; // ISO YYYY-MM-DD
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  birth_date: string | null; // ISO YYYY-MM-DD
  is_minor: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGameProfile {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  streak_days: number;
  last_activity: string | null;
  badges: string[];
  created_at: string;
  updated_at: string;
}

/** Calcula idade em anos a partir de birth_date ISO (YYYY-MM-DD). */
export function computeAge(birthDateIso: string | null): number | null {
  if (!birthDateIso) return null;
  const b = new Date(birthDateIso + 'T00:00:00');
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** Persiste birth_date em public.users; trigger DB recalcula is_minor. */
export async function setUserBirthDate(userId: string, birthDateIso: string): Promise<User> {
  return updateUser(userId, { birth_date: birthDateIso });
}

/** Cria UserGameProfile do menor (idempotente). No-op se !is_minor. */
export async function ensureGameProfileForMinor(userId: string): Promise<UserGameProfile | null> {
  const user = await getUser(userId);
  if (!user?.is_minor) return null;

  const { data: existing } = await supabase
    .from('user_game_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing as UserGameProfile;

  const { data, error } = await supabase
    .from('user_game_profiles')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as UserGameProfile;
}

export async function getGameProfile(userId: string): Promise<UserGameProfile | null> {
  const { data, error } = await supabase
    .from('user_game_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as UserGameProfile) ?? null;
}

/**
 * Atualiza os dados do usuário
 */
export async function updateUser(userId: string, updates: UserUpdate): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as User;
}

/**
 * Faz upload da foto de perfil do usuário.
 * Passe `imageBytes` com `base64` (e opcionalmente `mimeType`) vindos do `expo-image-picker` com `base64: true` — no RN `fetch(uri)` costuma gerar arquivo vazio no Storage.
 */
export async function uploadProfilePhoto(
  userId: string,
  imageUri: string,
  imageBytes?: UploadImageOptions,
): Promise<string> {
  try {
    const bucket = getAvatarStorageBucket();
    // Caminho por usuário: exige política RLS `profile-photos/{auth.uid()}/...` no Storage
    const uploadResult = await uploadImageToStorage(
      imageUri,
      bucket,
      `${PROFILE_PHOTOS_FOLDER}/${userId}`,
      imageBytes,
    );

    if (uploadResult.error || !uploadResult.url) {
      throw new Error(uploadResult.error || 'Erro ao fazer upload da imagem');
    }

    // Buscar avatar atual para deletar se existir
    const { data: currentUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    // Deletar avatar antigo se existir (URL resolve bucket/caminho automaticamente)
    if (currentUser?.avatar_url) {
      await deleteImageFromStorage(currentUser.avatar_url).catch((err) => {
        console.warn('[UserService] Erro ao deletar avatar antigo:', err);
      });
    }

    // Atualizar avatar_url no banco
    await updateUser(userId, { avatar_url: uploadResult.url });

    return uploadResult.url;
  } catch (error) {
    console.error('[UserService] Erro ao fazer upload da foto de perfil:', error);
    throw error;
  }
}

/**
 * Remove a foto de perfil do usuário
 */
export async function removeProfilePhoto(userId: string): Promise<void> {
  try {
    // Buscar avatar atual
    const { data: currentUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (currentUser?.avatar_url) {
      await deleteImageFromStorage(currentUser.avatar_url);
    }

    // Remover referência no banco
    await updateUser(userId, { avatar_url: null });
  } catch (error) {
    console.error('[UserService] Erro ao remover foto de perfil:', error);
    throw error;
  }
}

/**
 * Busca os dados do usuário
 */
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Usuário não encontrado
      return null;
    }
    throw error;
  }

  return data as User;
}


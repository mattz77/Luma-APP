import type { User } from '@/services/user.service';

/** Snapshot compatível com AuthUser da store (evita import circular com auth.store). */
export interface AuthUserSnapshot {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Mescla dados da tabela `users` sobre o usuário mapeado do JWT.
 * Quando há linha de perfil, `avatar_url` do banco é a fonte de verdade (inclui remoção = null).
 */
export function mergeAuthUserWithDbProfile(
  mapped: AuthUserSnapshot,
  profile: User | null
): AuthUserSnapshot {
  if (!profile) {
    return mapped;
  }
  return {
    ...mapped,
    name: profile.name ?? mapped.name,
    avatarUrl: profile.avatar_url,
  };
}

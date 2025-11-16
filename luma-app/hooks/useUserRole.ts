import { useQuery } from '@tanstack/react-query';

import { houseService } from '@/services/house.service';
import type { HouseMemberRole } from '@/types/models';

export const useUserRole = (houseId: string | null | undefined, userId: string | null | undefined): HouseMemberRole | null => {
  const { data: members } = useQuery({
    queryKey: ['house-members', houseId],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve([]);
      }
      return houseService.getHouseMembers(houseId);
    },
    enabled: Boolean(houseId && userId),
    staleTime: 1000 * 30, // Cache por 30 segundos
  });

  if (!members || !userId) {
    return null;
  }

  const membership = members.find((member) => member.userId === userId);
  return membership?.role ?? null;
};

/**
 * Verifica se o usuário tem permissão para acessar finanças
 * Apenas ADMIN pode ver finanças
 */
export const useCanAccessFinances = (houseId: string | null | undefined, userId: string | null | undefined): boolean => {
  const role = useUserRole(houseId, userId);
  return role === 'ADMIN';
};

/**
 * Verifica se o usuário pode gerenciar membros
 * Apenas ADMIN pode gerenciar membros
 */
export const useCanManageMembers = (houseId: string | null | undefined, userId: string | null | undefined): boolean => {
  const role = useUserRole(houseId, userId);
  return role === 'ADMIN';
};


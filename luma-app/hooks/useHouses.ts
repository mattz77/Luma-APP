import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { houseService } from '@/services/house.service';
import type { CreateHouseInput } from '@/services/house.service';
import type { House, HouseMemberWithUser, UserHouse } from '@/types/models';

export const useUserHouses = (userId: string | undefined | null) => {
  const query = useQuery<UserHouse[]>({
    queryKey: ['houses', userId],
    queryFn: async () => {
      console.log('[useUserHouses] Fetching houses for userId:', userId);
      if (!userId) {
        console.log('[useUserHouses] No userId, returning empty array');
        return Promise.resolve([]);
      }
      try {
        const houses = await houseService.getUserHouses(userId);
        console.log('[useUserHouses] Fetched houses:', houses.length);
        return houses;
      } catch (error) {
        console.error('[useUserHouses] Error fetching houses:', error);
        throw error;
      }
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutos - reduz requisições desnecessárias
    gcTime: 1000 * 60 * 10, // 10 minutos - mantém em cache por mais tempo
  });

  // Debug logs
  useEffect(() => {
    console.log('[useUserHouses] Query state:', {
      userId,
      enabled: Boolean(userId),
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error?.message,
      dataLength: query.data?.length ?? 0,
    });
  }, [userId, query.isLoading, query.isError, query.error, query.data?.length]);

  return query;
};

export const useHouseMembers = (houseId: string | undefined | null) =>
  useQuery<HouseMemberWithUser[]>({
    queryKey: ['house-members', houseId],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve([]);
      }
      return houseService.getHouseMembers(houseId);
    },
    enabled: Boolean(houseId),
  });

export const useCreateHouse = (userId: string | undefined | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHouseInput) => houseService.createHouse(input),
    onSuccess: async (house) => {
      if (userId) {
        // Aguarda um pouco para garantir que o membro foi adicionado ao banco
        await new Promise(resolve => setTimeout(resolve, 300));
        // Invalida e refaz a query para garantir que os dados estão atualizados
        await queryClient.invalidateQueries({ queryKey: ['houses', userId] });
        await queryClient.refetchQueries({ queryKey: ['houses', userId] });
      }
    },
  });
};

export const useJoinHouse = (userId: string | undefined | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inviteCode }: { inviteCode: string }) => {
      if (!userId) {
        throw new Error('Usuário não autenticado.');
      }
      return houseService.joinHouse(userId, inviteCode);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['houses', userId] });
      }
    },
  });
};

export const useRemoveMember = (
  houseId: string | undefined | null,
  userId: string | undefined | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) => houseService.removeMember(membershipId),
    onSuccess: () => {
      if (houseId) {
        queryClient.invalidateQueries({ queryKey: ['house-members', houseId] });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['houses', userId] });
      }
    },
  });
};

export const useLeaveHouse = (
  houseId: string | undefined | null,
  userId: string | undefined | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId || !houseId) {
        throw new Error('Casa ou usuário inválido.');
      }
      return houseService.leaveHouse(userId, houseId);
    },
    onSuccess: () => {
      if (houseId) {
        queryClient.invalidateQueries({ queryKey: ['house-members', houseId] });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['houses', userId] });
      }
    },
  });
};

export const useUpdateHouse = (houseId: string | undefined | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Omit<CreateHouseInput, 'creatorUserId'>>) => {
      if (!houseId) {
        throw new Error('Casa inválida.');
      }
      return houseService.updateHouse(houseId, updates);
    },
    onSuccess: (_data, _variables, context) => {
      if (!houseId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['house-members', houseId] });
      queryClient.invalidateQueries({ queryKey: ['houses'] });
    },
  });
};

export const useUpdateMemberRole = (
  houseId: string | undefined | null,
  userId: string | undefined | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { membershipId: string; role: import('@/types/models').HouseMemberRole }) =>
      houseService.updateMemberRole(input),
    onSuccess: () => {
      if (houseId) {
        queryClient.invalidateQueries({ queryKey: ['house-members', houseId] });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['houses', userId] });
      }
    },
  });
};


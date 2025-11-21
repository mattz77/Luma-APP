import { useQuery } from '@tanstack/react-query';

import { conversationService } from '@/services/conversation.service';

export const useConversations = (houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['conversations', houseId],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve([]);
      }
      return conversationService.getByHouse(houseId);
    },
    enabled: Boolean(houseId),
    refetchInterval: false, // Não usar polling automático, apenas quando necessário
    staleTime: 0, // Sempre considerar os dados como stale para garantir atualização
  });
};


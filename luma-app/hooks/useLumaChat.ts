import { useMutation, useQueryClient } from '@tanstack/react-query';

import { n8nClient } from '@/lib/n8n';

interface SendMessageVariables {
  message: string;
  houseId: string;
  userId: string;
}

export const useLumaChat = (houseId: string | null | undefined, userId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!houseId || !userId) {
        throw new Error('houseId e userId são obrigatórios para enviar mensagens à Luma.');
      }

      const response = await n8nClient.sendMessage({
        house_id: houseId,
        user_id: userId,
        message,
        context: {
          current_month: new Date().toISOString().slice(0, 7),
        },
      });

      // Persistência da conversa é feita pelo próprio workflow no n8n.
      // Aqui apenas disparamos a mensagem e, em seguida, atualizamos o cache.
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', houseId ?? ''] });
    },
  });
};


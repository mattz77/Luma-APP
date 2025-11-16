import { useMutation, useQueryClient } from '@tanstack/react-query';

import { n8nClient } from '@/lib/n8n';
import { conversationService } from '@/services/conversation.service';

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

      await conversationService.create({
        house_id: houseId,
        user_id: userId,
        message,
        response: response.response,
        metadata: response.metadata ?? null,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', houseId ?? ''] });
    },
  });
};


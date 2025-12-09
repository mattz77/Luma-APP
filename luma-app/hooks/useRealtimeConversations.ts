import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook para escutar mudanças em tempo real nas conversas
 * Atualiza automaticamente a query quando há mudanças no banco
 */
export function useRealtimeConversations(houseId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!houseId) return;

    const channel = supabase
      .channel(`conversations:${houseId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversations',
          filter: `house_id=eq.${houseId}`,
        },
        (payload) => {
          console.log('Mudança detectada em conversations:', payload.eventType);
          // Apenas invalidar - o React Query fará refetch automaticamente quando necessário
          // Não fazer refetch imediato para evitar múltiplas atualizações
          queryClient.invalidateQueries({ queryKey: ['conversations', houseId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [houseId, queryClient]);
}


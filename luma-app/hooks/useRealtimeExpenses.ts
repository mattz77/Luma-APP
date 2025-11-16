import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook para escutar mudanças em tempo real nas despesas
 * Atualiza automaticamente a query quando há mudanças no banco
 */
export function useRealtimeExpenses(houseId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!houseId) return;

    const channel = supabase
      .channel(`expenses:${houseId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'expenses',
          filter: `house_id=eq.${houseId}`,
        },
        (payload) => {
          console.log('Mudança detectada em expenses:', payload.eventType);
          // Invalidar a query para forçar refetch
          queryClient.invalidateQueries({ queryKey: ['expenses', houseId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [houseId, queryClient]);
}


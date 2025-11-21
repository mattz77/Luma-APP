import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook para escutar mudanças em tempo real nas tarefas
 * Atualiza automaticamente a query quando há mudanças no banco
 */
export function useRealtimeTasks(houseId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!houseId) return;

    const channel = supabase
      .channel(`tasks:${houseId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `house_id=eq.${houseId}`,
        },
        (payload) => {
          console.log('Mudança detectada em tasks:', payload.eventType);
          // Invalidar a query para forçar refetch
          queryClient.invalidateQueries({ queryKey: ['tasks', houseId] });
          queryClient.invalidateQueries({ queryKey: ['task'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [houseId, queryClient]);
}


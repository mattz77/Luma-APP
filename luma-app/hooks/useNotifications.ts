import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  requestNotificationPermission,
  getPushToken,
  setupNotificationListeners,
  scheduleLocalNotification,
} from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Hook para gerenciar notificações push
 * Inicializa permissões, registra token e configura listeners
 */
export function useNotifications() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const houseId = useAuthStore((state) => state.houseId);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user) return;

      try {
        // Solicitar permissão
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          console.log('[Notifications] Permissão negada pelo usuário');
          return;
        }

        // Obter token de push
        const token = await getPushToken();
        if (token) {
          console.log('[Notifications] Push token obtido:', token.substring(0, 20) + '...');
          // TODO: Salvar token no Supabase para envio de notificações push do servidor
        }

        // Configurar listeners
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          console.log('[Notifications] Notificação recebida:', notification.request.content.title);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          console.log('[Notifications] Notificação tocada:', data);

          // Deep linking baseado no tipo de notificação
          if (data?.type === 'task' && data?.taskId) {
            router.push(`/(tabs)/tasks/${data.taskId}` as any);
          } else if (data?.type === 'expense' && data?.expenseId) {
            router.push(`/(tabs)/finances/${data.expenseId}` as any);
          } else if (data?.type === 'house_invite' && data?.houseId) {
            router.push('/(tabs)/house' as any);
          }
        });
      } catch (error) {
        console.error('[Notifications] Erro ao inicializar:', error);
      }
    };

    initializeNotifications();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, router]);
}

/**
 * Agenda notificação para tarefa próxima do prazo
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  dueDate: Date,
  hoursBefore: number = 24
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    const reminderDate = new Date(dueDate);
    reminderDate.setHours(reminderDate.getHours() - hoursBefore);

    // Só agendar se a data de lembrete for no futuro
    if (reminderDate <= new Date()) {
      return null;
    }

    const notificationId = await scheduleLocalNotification(
      `Tarefa próxima do prazo: ${taskTitle}`,
      `Esta tarefa vence em ${hoursBefore} horas`,
      {
        date: reminderDate,
      }
    );

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Erro ao agendar lembrete de tarefa:', error);
    return null;
  }
}

/**
 * Envia notificação imediata para nova despesa
 */
export async function notifyNewExpense(
  expenseId: string,
  description: string,
  amount: number,
  userId: string
): Promise<void> {
  try {
    await scheduleLocalNotification(
      'Nova despesa adicionada',
      `${description} - R$ ${amount.toFixed(2)}`,
      null, // Imediata
      {
        type: 'expense',
        expenseId,
        userId,
      }
    );
  } catch (error) {
    console.error('[Notifications] Erro ao enviar notificação de despesa:', error);
  }
}

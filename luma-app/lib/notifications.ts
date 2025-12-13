import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permissão para enviar notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Obtém o token de push notification
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    return token.data;
  } catch (error) {
    console.error('Erro ao obter push token:', error);
    return null;
  }
}

/**
 * Agenda uma notificação local
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger?: Notifications.NotificationTriggerInput,
  data?: Record<string, unknown>,
): Promise<string> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    throw new Error('Permissão para notificações não concedida');
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: data || {},
    },
    trigger: trigger || null, // Se null, notifica imediatamente
  });

  return notificationId;
}

/**
 * Cancela uma notificação agendada
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancela todas as notificações agendadas
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Configura listeners para notificações
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void,
) {
  // Listener para quando a notificação é recebida (app em foreground)
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    onNotificationReceived?.(notification);
  });

  // Listener para quando o usuário toca na notificação
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationTapped?.(response);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}


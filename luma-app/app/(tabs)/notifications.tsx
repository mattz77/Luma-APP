import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Check, Trash2 } from 'lucide-react-native';

import { useNotificationsList, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';
import type { Notification } from '@/services/notification.service';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export default function NotificationsScreen() {
  const user = useAuthStore((state) => state.user);
  const houseId = useAuthStore((state) => state.houseId);
  const { top } = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading, isRefetching, refetch } = useNotificationsList(
    user?.id,
    houseId,
    filter === 'unread' ? { isRead: false } : undefined,
  );
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;
    if (!houseId) return;
    try {
      await markAsReadMutation.mutateAsync({ id: notification.id });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || !houseId) return;
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!houseId) return;
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  if (!user) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, styles.centered, { paddingTop: top + 16 }]}
      >
        <Text style={styles.emptyTitle}>Faça login</Text>
        <Text style={styles.emptySubtitle}>Você precisa estar logado para ver notificações.</Text>
      </ScrollView>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1B1725" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Check size={16} color="#1B1725" />
            <Text style={styles.markAllText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterChipText, filter === 'unread' && styles.filterChipTextActive]}>
            Não lidas {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#1B1725" />
          <Text style={styles.helperText}>Carregando notificações...</Text>
        </View>
      ) : notifications && notifications.length > 0 ? (
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                cardShadowStyle,
                !notification.isRead && styles.notificationCardUnread,
              ]}
              onPress={() => handleMarkAsRead(notification)}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Bell size={18} color={notification.isRead ? '#A5A0AE' : '#1B1725'} />
                  <Text style={styles.notificationType}>{notification.type}</Text>
                  <Text style={styles.notificationTime}>{formatDate(notification.createdAt)}</Text>
                </View>
                <Text style={[styles.notificationTitle, !notification.isRead && styles.notificationTitleUnread]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(notification.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={18} color="#D64545" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Bell size={48} color="#A5A0AE" />
          <Text style={styles.emptyTitle}>
            {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'unread'
              ? 'Você está em dia com todas as notificações!'
              : 'Você ainda não recebeu nenhuma notificação.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B1725',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FBEED0',
    borderWidth: 1,
    borderColor: '#1B1725',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B1725',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#EAE6DC',
  },
  filterChipActive: {
    backgroundColor: '#FBEED0',
    borderColor: '#1B1725',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F6A7A',
  },
  filterChipTextActive: {
    color: '#1B1725',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#6F6A7A',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE6DC',
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#1B1725',
    backgroundColor: '#FBEED0',
  },
  notificationContent: {
    flex: 1,
    gap: 6,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6F6A7A',
    textTransform: 'uppercase',
    flex: 1,
  },
  notificationTime: {
    fontSize: 11,
    color: '#A5A0AE',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1725',
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6F6A7A',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1725',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6F6A7A',
    textAlign: 'center',
    marginTop: 4,
  },
});


import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquare, Send, Trash2, X } from 'lucide-react-native';

import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useTaskComments, useCreateTaskComment, useDeleteTaskComment } from '@/hooks/useTaskComments';
import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';
import type { Task, TaskStatus, TaskPriority } from '@/types/models';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  // Se não houver ID ou for "undefined", redirecionar para a lista de tarefas
  if (!id || id === 'undefined') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Tarefa não encontrada</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { data: task, isLoading } = useTask(id);
  const { data: comments, isLoading: isLoadingComments } = useTaskComments(id);
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const createCommentMutation = useCreateTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();

  const [commentInput, setCommentInput] = useState('');

  const handleAddComment = async () => {
    if (!commentInput.trim() || !id || !user) {
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        task_id: id,
        user_id: user.id,
        content: commentInput.trim(),
      });
      setCommentInput('');
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Excluir comentário', 'Deseja realmente excluir este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommentMutation.mutateAsync(commentId);
          } catch (error) {
            Alert.alert('Erro', (error as Error).message);
          }
        },
      },
    ]);
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    Alert.alert('Excluir tarefa', 'Deseja realmente excluir esta tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTaskMutation.mutateAsync({ id: task.id, houseId: task.houseId });
            router.back();
          } catch (error) {
            Alert.alert('Erro', (error as Error).message);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Tarefa não encontrada</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={top}
    >
      <View style={[styles.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Tarefa</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleDeleteTask}>
          <Trash2 size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.taskCard, cardShadowStyle]}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View
              style={[
                styles.priorityBadge,
                task.priority === 'LOW' && styles.priorityBadgeLow,
                task.priority === 'MEDIUM' && styles.priorityBadgeMedium,
                task.priority === 'HIGH' && styles.priorityBadgeHigh,
                task.priority === 'URGENT' && styles.priorityBadgeUrgent,
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  (task.priority === 'HIGH' || task.priority === 'URGENT') && styles.priorityBadgeTextLight,
                ]}
              >
                {PRIORITY_LABELS[task.priority]}
              </Text>
            </View>
          </View>

          <View style={styles.taskMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status:</Text>
              <Text style={styles.metaValue}>{STATUS_LABELS[task.status]}</Text>
            </View>
            {task.assignee?.name && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Responsável:</Text>
                <Text style={styles.metaValue}>{task.assignee.name}</Text>
              </View>
            )}
            {task.dueDate && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Prazo:</Text>
                <Text style={styles.metaValue}>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</Text>
              </View>
            )}
            {task.tags && task.tags.length > 0 && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Tags:</Text>
                <View style={styles.tagsContainer}>
                  {task.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {task.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Descrição</Text>
              <Text style={styles.descriptionText}>{task.description}</Text>
            </View>
          )}

          {task.status === 'COMPLETED' && task.points > 0 && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{task.points} pontos para a casa</Text>
            </View>
          )}
        </View>

        <View style={[styles.commentsSection, cardShadowStyle]}>
          <View style={styles.commentsHeader}>
            <MessageSquare size={20} color="#1d4ed8" />
            <Text style={styles.commentsTitle}>Comentários ({comments?.length ?? 0})</Text>
          </View>

          {isLoadingComments ? (
            <ActivityIndicator size="small" color="#1d4ed8" style={styles.loader} />
          ) : comments && comments.length > 0 ? (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.user?.name ?? 'Usuário'}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                    {comment.userId === user?.id && (
                      <TouchableOpacity
                        style={styles.deleteCommentButton}
                        onPress={() => handleDeleteComment(comment.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={14} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyComments}>Nenhum comentário ainda. Seja o primeiro!</Text>
          )}

          <View style={styles.commentInputContainer}>
            <TextInput
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder="Adicionar comentário..."
              style={styles.commentInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !commentInput.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!commentInput.trim() || createCommentMutation.isPending}
            >
              {createCommentMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityBadgeLow: {
    backgroundColor: '#f1f5f9',
  },
  priorityBadgeMedium: {
    backgroundColor: '#eff6ff',
  },
  priorityBadgeHigh: {
    backgroundColor: '#fffbeb',
  },
  priorityBadgeUrgent: {
    backgroundColor: '#fef2f2',
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748b',
  },
  priorityBadgeTextLight: {
    color: '#0f172a',
  },
  taskMeta: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  metaValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  descriptionSection: {
    gap: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  descriptionText: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 22,
  },
  pointsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  commentsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  loader: {
    marginVertical: 20,
  },
  commentsList: {
    gap: 12,
  },
  commentCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  commentDate: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  deleteCommentButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  emptyComments: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});


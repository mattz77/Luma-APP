import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useAuthStore } from '@/stores/auth.store';
import type { TaskStatus } from '@/types/models';
import { cardShadowStyle } from '@/lib/styles';

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendentes',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluídas',
  CANCELLED: 'Canceladas',
};

export default function TasksScreen() {
  const houseId = useAuthStore((state) => state.houseId);
  const user = useAuthStore((state) => state.user);
  const { top } = useSafeAreaInsets();
  const { data: tasks, isLoading, isRefetching, refetch } = useTasks(houseId);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');

  if (!houseId) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, styles.centered, { paddingTop: top + 16 }]}
      >
        <Text style={styles.emptyTitle}>Selecione uma casa</Text>
        <Text style={styles.emptySubtitle}>
          Associe-se a uma casa para acompanhar o Kanban de tarefas colaborativas.
        </Text>
      </ScrollView>
    );
  }

  const grouped = (tasks ?? []).reduce<Record<TaskStatus, typeof tasks>>(
    (accumulator, task) => {
      const list = accumulator[task.status] ?? [];
      return {
        ...accumulator,
        [task.status]: [...list, task],
      };
    },
    {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
    },
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1d4ed8" />
      }
    >
      <Text style={styles.title}>Tarefas da Casa</Text>
      <Text style={styles.subtitle}>
        Visualize o quadro Kanban, programe recorrências e estimule a gamificação.
      </Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => {
            setTitleInput('');
            setDescriptionInput('');
            setCreateOpen(true);
          }}
        >
          <Text style={styles.primaryActionText}>+ Nova tarefa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kanbanContainer}>
        {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => {
          const columnTasks = grouped[status] ?? [];
          return (
            <View key={status} style={[styles.column, cardShadowStyle]}>
              <Text style={styles.columnTitle}>{STATUS_LABELS[status]}</Text>
              <View style={styles.columnContent}>
                {isLoading ? (
                  <Text style={styles.helperText}>Carregando tarefas...</Text>
                ) : columnTasks.length === 0 ? (
                  <Text style={styles.emptyColumnText}>Nenhuma tarefa {STATUS_LABELS[status].toLowerCase()}.</Text>
                ) : (
                  columnTasks.map((task) => (
                    <View key={task.id} style={styles.taskCard}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      {task.description ? (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      ) : null}
                      <View style={styles.taskMeta}>
                        {task.assignee?.name ? (
                          <Text style={styles.taskMetaText}>Responsável: {task.assignee?.name}</Text>
                        ) : (
                          <Text style={styles.taskMetaText}>Sem responsável</Text>
                        )}
                        {task.dueDate ? (
                          <Text style={styles.taskMetaText}>
                            Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </Text>
                        ) : (
                          <Text style={styles.taskMetaText}>Sem prazo</Text>
                        )}
                      </View>
                      <View style={styles.taskActionsRow}>
                        {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
                          <>
                            {task.status === 'PENDING' && (
                              <TouchableOpacity
                                onPress={() =>
                                  updateTaskMutation.mutateAsync({
                                    id: task.id,
                                    updates: { status: 'IN_PROGRESS' },
                                  }).then(refetch)
                                }
                              >
                                <Text style={styles.taskActionLink}>Em andamento</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() =>
                                updateTaskMutation.mutateAsync({
                                  id: task.id,
                                  updates: { status: 'COMPLETED', completed_at: new Date().toISOString() },
                                }).then(refetch)
                              }
                            >
                              <Text style={styles.taskActionLink}>Concluir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                updateTaskMutation.mutateAsync({
                                  id: task.id,
                                  updates: { status: 'CANCELLED' },
                                }).then(refetch)
                              }
                            >
                              <Text style={styles.taskActionLink}>Cancelar</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        <TouchableOpacity
                          onPress={() => {
                            setEditingTaskId(task.id);
                            setTitleInput(task.title);
                            setDescriptionInput(task.description ?? '');
                            setCreateOpen(true);
                          }}
                        >
                          <Text style={styles.taskActionLink}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            deleteTaskMutation
                              .mutateAsync({ id: task.id, houseId: task.houseId })
                              .then(refetch)
                          }
                        >
                          <Text style={styles.taskActionDanger}>Excluir</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>

      {isCreateOpen && (
        <View style={styles.inlineModalBackdrop}>
          <View style={styles.inlineModal}>
            <Text style={styles.modalTitle}>{editingTaskId ? 'Editar tarefa' : 'Nova tarefa'}</Text>
            <TextInput
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="Título da tarefa"
              style={styles.modalInput}
            />
            <TextInput
              value={descriptionInput}
              onChangeText={setDescriptionInput}
              placeholder="Descrição (opcional)"
              style={[styles.modalInput, styles.modalInputMultiline]}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondary}
                onPress={() => {
                  setCreateOpen(false);
                  setEditingTaskId(null);
                  setTitleInput('');
                  setDescriptionInput('');
                }}
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimary}
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                onPress={async () => {
                  if (!titleInput.trim() || !houseId || !user) {
                    return;
                  }
                  if (editingTaskId) {
                    await updateTaskMutation.mutateAsync({
                      id: editingTaskId,
                      updates: {
                        title: titleInput.trim(),
                        description: descriptionInput.trim() || null,
                      },
                    });
                  } else {
                    await createTaskMutation.mutateAsync({
                      house_id: houseId,
                      created_by_id: user.id,
                      title: titleInput.trim(),
                      description: descriptionInput.trim() || null,
                    });
                  }
                  setCreateOpen(false);
                  setEditingTaskId(null);
                  setTitleInput('');
                  setDescriptionInput('');
                  refetch();
                }}
              >
                <Text style={styles.modalPrimaryText}>
                  {createTaskMutation.isPending || updateTaskMutation.isPending
                    ? 'Salvando...'
                    : 'Salvar tarefa'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
    gap: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
  },
  kanbanContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  columnContent: {
    gap: 12,
  },
  taskCard: {
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    padding: 12,
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  taskDescription: {
    fontSize: 14,
    color: '#475569',
  },
  taskMeta: {
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  taskActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  taskActionLink: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  taskActionDanger: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyColumnText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  actionsRow: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
  },
  primaryAction: {
    borderRadius: 999,
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  inlineModalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inlineModal: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    fontSize: 14,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  modalPrimary: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSecondary: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 14,
  },
});


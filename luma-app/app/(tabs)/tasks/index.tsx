import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { useMemo, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, PlayCircle, XCircle, GripVertical, Plus, ListTodo, ArrowLeft } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useAuthStore } from '@/stores/auth.store';
import type { Task, TaskStatus, TaskPriority } from '@/types/models';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TagInput } from '@/components/TagInput';
import { Colors } from '@/constants/Colors';

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendentes',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluídas',
  CANCELLED: 'Canceladas',
};

const EMPTY_STATE_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Nenhuma tarefa pendente.',
  IN_PROGRESS: 'Nenhuma tarefa em andamento.',
  COMPLETED: 'Nenhuma tarefa concluída.',
  CANCELLED: 'Nenhuma tarefa cancelada.',
};

type ColumnPosition = { x: number; width: number };

// --- Light Theme Components ---
const LightGlassCard = ({ children, style }: any) => (
  <View style={[styles.glassCard, style]}>
    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
    <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', ...StyleSheet.absoluteFillObject }} />
    <View style={{ zIndex: 10 }}>{children}</View>
  </View>
);

export default function TasksScreen() {
  const router = useRouter();
  const houseId = useAuthStore((state) => state.houseId);
  const user = useAuthStore((state) => state.user);
  const { top } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const { data: tasks, isLoading, isRefetching, refetch } = useTasks(houseId);
  useRealtimeTasks(houseId);

  const columnRefs = useRef<Record<TaskStatus, ColumnPosition>>({
    PENDING: { x: 0, width: 0 },
    IN_PROGRESS: { x: 0, width: 0 },
    COMPLETED: { x: 0, width: 0 },
    CANCELLED: { x: 0, width: 0 },
  });

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<TaskPriority>('MEDIUM');
  const [tagsInput, setTagsInput] = useState<string[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

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

  const pendingTasks = useMemo(() => {
    return tasks?.filter(task => task.status === 'PENDING').length ?? 0;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!selectedTagFilter || !tasks) return tasks;
    return tasks.filter((task) => task.tags && task.tags.includes(selectedTagFilter));
  }, [tasks, selectedTagFilter]);

  const allTags = useMemo(() => {
    if (!tasks) return [];
    const tagSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.tags) {
        task.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  const grouped = useMemo(
    () =>
      (filteredTasks ?? []).reduce<Record<TaskStatus, typeof filteredTasks>>(
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
      ),
    [filteredTasks],
  );

  const handleColumnLayout = (status: TaskStatus, x: number, width: number) => {
    columnRefs.current[status] = { x, width };
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Light Background */}
        <View style={{ backgroundColor: Colors.background, ...StyleSheet.absoluteFillObject }} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: top + 16 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
        >
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerIconRow}>
              <View style={styles.todoIconBg}>
                <ListTodo size={24} color={Colors.background} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Tarefas da Casa</Text>
                <Text style={styles.subtitle}>
                  {pendingTasks} pendentes
                </Text>
              </View>
            </View>
            <Text style={styles.subtitleSecondary}>
              {isMobile
                ? 'Deslize para ver todas as colunas. Toque para editar.'
                : 'Arraste tarefas entre colunas ou use os botões de ação.'}
            </Text>

            {allTags.length > 0 && (
              <View style={styles.tagsFilterContainer}>
                <Text style={styles.filterLabel}>Filtrar por tag:</Text>
                <View style={styles.tagsFilterRow}>
                  <TouchableOpacity
                    style={[styles.filterTag, !selectedTagFilter && styles.filterTagActive]}
                    onPress={() => setSelectedTagFilter(null)}
                  >
                    <Text style={[styles.filterTagText, !selectedTagFilter && styles.filterTagTextActive]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {allTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.filterTag, selectedTagFilter === tag && styles.filterTagActive]}
                      onPress={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                    >
                      <Text style={[styles.filterTagText, selectedTagFilter === tag && styles.filterTagTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => {
                setTitleInput('');
                setDescriptionInput('');
                setPriorityInput('MEDIUM');
                setTagsInput([]);
                setCreateOpen(true);
              }}
            >
              <Plus size={20} color={Colors.background} />
              <Text style={styles.primaryActionText}>Nova tarefa</Text>
            </TouchableOpacity>
          </View>

          {isMobile ? (
            <View style={styles.kanbanWrapperMobile}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.kanbanScrollContent}
                style={styles.kanbanScrollView}
                decelerationRate="normal"
              >
                {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => {
                  const columnTasks = grouped[status] ?? [];
                  return (
                    <LightGlassCard
                      key={status}
                      style={styles.columnMobile}
                    >
                      <View
                        onLayout={(e) => {
                          const { x, width } = e.nativeEvent.layout;
                          handleColumnLayout(status, x, width);
                        }}
                      >
                        <Text style={styles.columnTitle}>{STATUS_LABELS[status]}</Text>
                        <View style={styles.columnContent}>
                          {isLoading ? (
                            <Text style={styles.helperText}>Carregando tarefas...</Text>
                          ) : columnTasks.length === 0 ? (
                            <Text style={styles.emptyColumnText}>{EMPTY_STATE_LABELS[status]}</Text>
                          ) : (
                            columnTasks.map((task) => (
                              <DraggableTask
                                key={task.id}
                                task={task}
                                currentStatus={status}
                                columnRefs={columnRefs.current}
                                isMobile={true}
                                onUpdateStatus={(newStatus) =>
                                  updateTaskMutation
                                    .mutateAsync({
                                      id: task.id,
                                      updates: {
                                        status: newStatus,
                                        ...(newStatus === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {}),
                                      },
                                    })
                                    .then(() => refetch())
                                }
                                onEdit={() => {
                                  setEditingTaskId(task.id);
                                  setTitleInput(task.title);
                                  setDescriptionInput(task.description ?? '');
                                  setPriorityInput(task.priority);
                                  setTagsInput(task.tags || []);
                                  setCreateOpen(true);
                                }}
                                onDelete={() =>
                                  deleteTaskMutation.mutateAsync({ id: task.id, houseId: task.houseId }).then(() => refetch())
                                }
                                onViewDetails={() => {
                                  if (task.id) {
                                    router.push(`/(tabs)/tasks/${task.id}`);
                                  }
                                }}
                              />
                            ))
                          )}
                        </View>
                      </View>
                    </LightGlassCard>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.kanbanContainer}>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => {
                const columnTasks = grouped[status] ?? [];
                return (
                  <LightGlassCard
                    key={status}
                    style={styles.column}
                  >
                    <View
                      onLayout={(e) => {
                        const { x, width } = e.nativeEvent.layout;
                        handleColumnLayout(status, x, width);
                      }}
                    >
                      <Text style={styles.columnTitle}>{STATUS_LABELS[status]}</Text>
                      <View style={styles.columnContent}>
                        {isLoading ? (
                          <Text style={styles.helperText}>Carregando tarefas...</Text>
                        ) : columnTasks.length === 0 ? (
                          <Text style={styles.emptyColumnText}>{EMPTY_STATE_LABELS[status]}</Text>
                        ) : (
                          columnTasks.map((task) => (
                            <DraggableTask
                              key={task.id}
                              task={task}
                              currentStatus={status}
                              columnRefs={columnRefs.current}
                              isMobile={false}
                              onUpdateStatus={(newStatus) =>
                                updateTaskMutation
                                  .mutateAsync({
                                    id: task.id,
                                    updates: {
                                      status: newStatus,
                                      ...(newStatus === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {}),
                                    },
                                  })
                                  .then(() => refetch())
                              }
                              onEdit={() => {
                                setEditingTaskId(task.id);
                                setTitleInput(task.title);
                                setDescriptionInput(task.description ?? '');
                                setPriorityInput(task.priority);
                                setTagsInput(task.tags || []);
                                setCreateOpen(true);
                              }}
                              onDelete={() =>
                                deleteTaskMutation.mutateAsync({ id: task.id, houseId: task.houseId }).then(() => refetch())
                              }
                              onViewDetails={() => {
                                if (task.id) {
                                  router.push(`/(tabs)/tasks/${task.id}`);
                                }
                              }}
                            />
                          ))
                        )}
                      </View>
                    </View>
                  </LightGlassCard>
                );
              })}
            </View>
          )}

          {isCreateOpen && (
            <View style={styles.inlineModalBackdrop}>
              <LightGlassCard style={styles.inlineModal}>
                <Text style={styles.modalTitle}>{editingTaskId ? 'Editar tarefa' : 'Nova tarefa'}</Text>
                <TextInput
                  value={titleInput}
                  onChangeText={setTitleInput}
                  placeholder="Título da tarefa"
                  placeholderTextColor={Colors.textSecondary}
                  style={styles.modalInput}
                />
                <TextInput
                  value={descriptionInput}
                  onChangeText={setDescriptionInput}
                  placeholder="Descrição (opcional)"
                  placeholderTextColor={Colors.textSecondary}
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  multiline
                />

                <Text style={styles.modalLabel}>Tags</Text>
                <TagInput tags={tagsInput} onChange={setTagsInput} placeholder="Digite e pressione Enter" />

                <Text style={styles.modalLabel}>Prioridade</Text>
                <View style={styles.prioritySelector}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityChip,
                        priorityInput === priority && styles.priorityChipSelected,
                        priority === 'LOW' && priorityInput === priority && styles.priorityChipLow,
                        priority === 'MEDIUM' && priorityInput === priority && styles.priorityChipMedium,
                        priority === 'HIGH' && priorityInput === priority && styles.priorityChipHigh,
                        priority === 'URGENT' && priorityInput === priority && styles.priorityChipUrgent,
                      ]}
                      onPress={() => setPriorityInput(priority)}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          priorityInput === priority && styles.priorityChipTextSelected,
                        ]}
                      >
                        {priority === 'LOW' ? 'Baixa' : priority === 'MEDIUM' ? 'Média' : priority === 'HIGH' ? 'Alta' : 'Urgente'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalSecondary}
                    onPress={() => {
                      setCreateOpen(false);
                      setEditingTaskId(null);
                      setTitleInput('');
                      setDescriptionInput('');
                      setPriorityInput('MEDIUM');
                      setTagsInput([]);
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
                            priority: priorityInput,
                            tags: tagsInput,
                          },
                        });
                      } else {
                        await createTaskMutation.mutateAsync({
                          house_id: houseId,
                          created_by_id: user.id,
                          assigned_to_id: user.id,
                          title: titleInput.trim(),
                          description: descriptionInput.trim() || null,
                          priority: priorityInput,
                          tags: tagsInput,
                        });
                      }
                      setCreateOpen(false);
                      setEditingTaskId(null);
                      setTitleInput('');
                      setDescriptionInput('');
                      setPriorityInput('MEDIUM');
                      setTagsInput([]);
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
              </LightGlassCard>
            </View>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

function DraggableTask({
  task,
  currentStatus,
  columnRefs,
  isMobile,
  onUpdateStatus,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  task: Task;
  currentStatus: TaskStatus;
  columnRefs: Record<TaskStatus, ColumnPosition>;
  isMobile: boolean;
  onUpdateStatus: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
}) {
  if (Platform.OS === 'web') {
    if (isMobile) {
      return (
        <TaskCardMobile
          task={task}
          onUpdateStatus={onUpdateStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
          isDragging={false}
        />
      );
    }
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskDragHandle}>
          <GripVertical size={16} color={Colors.textSecondary} />
        </View>
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
              {task.priority === 'LOW' ? 'Baixa' : task.priority === 'MEDIUM' ? 'Média' : task.priority === 'HIGH' ? 'Alta' : 'Urgente'}
            </Text>
          </View>
        </View>
        {task.description ? <Text style={styles.taskDescription}>{task.description}</Text> : null}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.taskTagsContainer}>
            {task.tags.map((tag) => (
              <View key={tag} style={styles.taskTag}>
                <Text style={styles.taskTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
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
        {task.status === 'COMPLETED' && task.points > 0 ? (
          <Text style={styles.pointsText}>+{task.points} pontos para a casa</Text>
        ) : null}
        <View style={styles.taskActionsRow}>
          {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
            <>
              {task.status === 'PENDING' && (
                <TouchableOpacity onPress={() => onUpdateStatus('IN_PROGRESS')}>
                  <Text style={styles.taskActionLink}>Em andamento</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => onUpdateStatus('COMPLETED')}>
                <Text style={styles.taskActionLink}>Concluir</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onUpdateStatus('CANCELLED')}>
                <Text style={styles.taskActionLink}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
          {onViewDetails && (
            <TouchableOpacity onPress={onViewDetails}>
              <Text style={styles.taskActionLink}>Ver detalhes</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.taskActionLink}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete}>
            <Text style={styles.taskActionDanger}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isMobile) {
    return (
      <TaskCardMobile
        task={task}
        onUpdateStatus={onUpdateStatus}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={false}
      />
    );
  }

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskDragHandle}>
        <GripVertical size={16} color={Colors.textSecondary} />
      </View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      {task.description ? <Text style={styles.taskDescription}>{task.description}</Text> : null}
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
      {task.status === 'COMPLETED' && task.points > 0 ? (
        <Text style={styles.pointsText}>+{task.points} pontos para a casa</Text>
      ) : null}
      <View style={styles.taskActionsRow}>
        {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
          <>
            {task.status === 'PENDING' && (
              <TouchableOpacity onPress={() => onUpdateStatus('IN_PROGRESS')}>
                <Text style={styles.taskActionLink}>Em andamento</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onUpdateStatus('COMPLETED')}>
              <Text style={styles.taskActionLink}>Concluir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onUpdateStatus('CANCELLED')}>
              <Text style={styles.taskActionLink}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.taskActionLink}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.taskActionDanger}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TaskCardMobile({
  task,
  onUpdateStatus,
  onEdit,
  onDelete,
  onViewDetails,
  isDragging = false,
}: {
  task: Task;
  onUpdateStatus: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
  isDragging?: boolean;
}) {
  const getQuickActions = () => {
    if (task.status === 'PENDING') {
      return [
        { label: 'Em andamento', status: 'IN_PROGRESS' as TaskStatus, icon: PlayCircle, color: '#1d4ed8' },
        { label: 'Concluir', status: 'COMPLETED' as TaskStatus, icon: CheckCircle2, color: '#16a34a' },
      ];
    }
    if (task.status === 'IN_PROGRESS') {
      return [
        { label: 'Concluir', status: 'COMPLETED' as TaskStatus, icon: CheckCircle2, color: '#16a34a' },
        { label: 'Cancelar', status: 'CANCELLED' as TaskStatus, icon: XCircle, color: '#dc2626' },
      ];
    }
    return [];
  };

  const quickActions = getQuickActions();

  return (
    <View style={[styles.taskCardMobile, isDragging && styles.taskCardDragging]}>
      <View style={styles.taskDragHandleMobile}>
        <GripVertical size={16} color={Colors.textSecondary} />
      </View>
      <View style={styles.taskHeaderMobile}>
        <Text style={styles.taskTitleMobile}>{task.title}</Text>
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
            {task.priority === 'LOW' ? 'Baixa' : task.priority === 'MEDIUM' ? 'Média' : task.priority === 'HIGH' ? 'Alta' : 'Urgente'}
          </Text>
        </View>
      </View>
      {task.description ? <Text style={styles.taskDescriptionMobile}>{task.description}</Text> : null}
      {task.tags && task.tags.length > 0 && (
        <View style={styles.taskTagsContainer}>
          {task.tags.map((tag) => (
            <View key={tag} style={styles.taskTag}>
              <Text style={styles.taskTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.taskMetaMobile}>
        {task.assignee?.name ? (
          <Text style={styles.taskMetaTextMobile}>👤 {task.assignee.name}</Text>
        ) : (
          <Text style={styles.taskMetaTextMobile}>👤 Sem responsável</Text>
        )}
        {task.dueDate ? (
          <Text style={styles.taskMetaTextMobile}>
            📅 {new Date(task.dueDate).toLocaleDateString('pt-BR')}
          </Text>
        ) : null}
      </View>
      {task.status === 'COMPLETED' && task.points > 0 ? (
        <View style={styles.pointsBadgeMobile}>
          <Text style={styles.pointsTextMobile}>+{task.points} pontos</Text>
        </View>
      ) : null}
      {quickActions.length > 0 && (
        <View style={styles.quickActionsMobile}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.status}
                style={[styles.quickActionButton, { borderColor: action.color }]}
                onPress={() => onUpdateStatus(action.status)}
              >
                <Icon size={16} color={action.color} />
                <Text style={[styles.quickActionText, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={styles.taskActionsMobile}>
        {onViewDetails && (
          <TouchableOpacity
            style={[styles.taskActionButtonMobile, styles.taskActionButtonPrimaryMobile]}
            onPress={onViewDetails}
          >
            <Text style={[styles.taskActionTextMobile, styles.taskActionTextPrimaryMobile]}>Ver detalhes</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.taskActionButtonMobile} onPress={onEdit}>
          <Text style={styles.taskActionTextMobile}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.taskActionButtonMobile, styles.taskActionDangerMobile]} onPress={onDelete}>
          <Text style={[styles.taskActionTextMobile, styles.taskActionDangerTextMobile]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 20,
  },
  headerSection: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '4D',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todoIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.8,
    marginTop: 2,
  },
  subtitleSecondary: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  tagsFilterContainer: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tagsFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  filterTagActive: {
    backgroundColor: Colors.primary + '33',
    borderColor: Colors.primary,
  },
  filterTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterTagTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  primaryActionText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  kanbanWrapperMobile: {
    flex: 1,
  },
  kanbanScrollView: {
    flex: 1,
  },
  kanbanScrollContent: {
    gap: 16,
    paddingRight: 24,
  },
  kanbanContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  column: {
    flex: 1,
    minWidth: 300,
    padding: 16,
    backgroundColor: '#FFF',
    borderColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
  },
  columnMobile: {
    width: 300,
    padding: 16,
    backgroundColor: '#FFF',
    borderColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  columnContent: {
    gap: 12,
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  emptyColumnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    opacity: 0.6,
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardMobile: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardDragging: {
    opacity: 0.5,
    transform: [{ scale: 1.02 }],
  },
  taskDragHandle: {
    alignItems: 'center',
    marginBottom: 4,
  },
  taskDragHandleMobile: {
    alignItems: 'center',
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskHeaderMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  taskTitleMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  taskDescriptionMobile: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  taskTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  taskTag: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskTagText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  taskMeta: {
    gap: 2,
    marginBottom: 8,
  },
  taskMetaMobile: {
    gap: 4,
    marginBottom: 12,
  },
  taskMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  taskMetaTextMobile: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.primary + '10',
  },
  priorityBadgeLow: { backgroundColor: '#16a34a' },
  priorityBadgeMedium: { backgroundColor: '#ca8a04' },
  priorityBadgeHigh: { backgroundColor: '#ea580c' },
  priorityBadgeUrgent: { backgroundColor: '#dc2626' },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  priorityBadgeTextLight: {
    color: '#FFF',
  },
  pointsText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: 8,
  },
  pointsBadgeMobile: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pointsTextMobile: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  taskActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  taskActionLink: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  taskActionDanger: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '500',
  },
  quickActionsMobile: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFF',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskActionsMobile: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  taskActionButtonMobile: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary + '0D',
  },
  taskActionButtonPrimaryMobile: {
    backgroundColor: Colors.primary + '1A',
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  taskActionDangerMobile: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  taskActionTextMobile: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  taskActionTextPrimaryMobile: {
    color: Colors.primary,
    fontWeight: '600',
  },
  taskActionDangerTextMobile: {
    color: '#ef4444',
  },

  // Modal Styles
  inlineModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000,
  },
  inlineModal: {
    padding: 24,
    backgroundColor: '#FFF',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '40',
    backgroundColor: 'transparent',
  },
  priorityChipSelected: {
    borderColor: 'transparent',
  },
  priorityChipLow: { backgroundColor: '#16a34a' },
  priorityChipMedium: { backgroundColor: '#ca8a04' },
  priorityChipHigh: { backgroundColor: '#ea580c' },
  priorityChipUrgent: { backgroundColor: '#dc2626' },
  priorityChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priorityChipTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '40',
  },
  modalSecondaryText: {
    color: Colors.text,
    fontSize: 14,
  },
  modalPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  modalPrimaryText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

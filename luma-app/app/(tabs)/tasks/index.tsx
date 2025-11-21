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

// Para web, não usar gesture handler - apenas botões de ação rápida
// Drag and drop funcionará apenas em mobile nativo (iOS/Android)

import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useAuthStore } from '@/stores/auth.store';
import type { Task, TaskStatus, TaskPriority } from '@/types/models';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TagInput } from '@/components/TagInput';
import { GlassCard } from '@/components/shared';

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

export default function TasksScreen() {
  const router = useRouter();
  const houseId = useAuthStore((state) => state.houseId);
  const user = useAuthStore((state) => state.user);
  const { top } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const { data: tasks, isLoading, isRefetching, refetch } = useTasks(houseId);
  useRealtimeTasks(houseId); // Atualização em tempo real
  
  // Refs para posições das colunas (para detectar drop zone)
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

  // Calcular tarefas pendentes
  const pendingTasks = useMemo(() => {
    return tasks?.filter(task => task.status === 'PENDING').length ?? 0;
  }, [tasks]);

  // Filtrar tarefas por tag se selecionada
  const filteredTasks = useMemo(() => {
    if (!selectedTagFilter || !tasks) return tasks;
    return tasks.filter((task) => task.tags && task.tags.includes(selectedTagFilter));
  }, [tasks, selectedTagFilter]);

  // Obter todas as tags únicas para o filtro
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
        <LinearGradient
          colors={['#C28400', '#8F6100']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: top + 16 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FFF44F" />
          }
        >
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFF44F" />
          </TouchableOpacity>
          <View style={styles.headerIconRow}>
            <View style={styles.todoIconBg}>
              <ListTodo size={24} color="#C28400" />
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
          <Plus size={20} color="#2C1A00" />
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
              <GlassCard
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
              </GlassCard>
            );
          })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.kanbanContainer}>
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => {
            const columnTasks = grouped[status] ?? [];
            return (
              <GlassCard
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
              </GlassCard>
            );
          })}
        </View>
      )}

      {isCreateOpen && (
        <View style={styles.inlineModalBackdrop}>
          <GlassCard style={styles.inlineModal}>
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
                      assigned_to_id: user.id, // Por padrão, atribui ao criador se não especificado
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
          </GlassCard>
        </View>
      )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// Componente Draggable para tarefas
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
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Para web, usar apenas botões de ação rápida (drag and drop funciona apenas em mobile nativo)
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
    // Desktop fallback
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskDragHandle}>
          <GripVertical size={16} color="#94a3b8" />
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

  // Para mobile nativo, implementar drag and drop aqui quando necessário
  // Por enquanto, usar botões de ação rápida também
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

  // Desktop nativo - usar botões
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskDragHandle}>
        <GripVertical size={16} color="#94a3b8" />
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

// Componente de Card de Tarefa para Mobile
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
        <GripVertical size={16} color="#94a3b8" />
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
    backgroundColor: '#1a1a1a',
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
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,244,79,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.3)',
    alignSelf: 'flex-start',
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
    backgroundColor: '#FFF44F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
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
    color: '#FFF44F',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFBE6',
    opacity: 0.8,
    marginTop: 2,
  },
  subtitleSecondary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  kanbanContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 8,
  },
  kanbanWrapperMobile: {
    marginHorizontal: -24,
  },
  kanbanScrollView: {
    paddingLeft: 24,
  },
  kanbanScrollContent: {
    gap: 16,
    paddingRight: 24,
    paddingBottom: 8,
    paddingTop: 4,
  },
  column: {
    flex: 1,
    padding: 16,
    minWidth: 200,
  },
  columnMobile: {
    width: 320,
    padding: 16,
    marginRight: 16,
    minHeight: 400,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFBE6',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnContent: {
    gap: 12,
  },
  taskCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 14,
    gap: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskCardDragging: {
    shadowColor: '#FFF44F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFF44F',
  },
  taskDragHandle: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  taskCardMobile: {
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  taskDragHandleMobile: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  taskTitleMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBE6',
    lineHeight: 22,
  },
  taskDescriptionMobile: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  taskMetaMobile: {
    gap: 6,
    marginTop: 4,
  },
  taskMetaTextMobile: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  pointsBadgeMobile: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  pointsTextMobile: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  quickActionsMobile: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    minHeight: 44,
    minWidth: 120,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskActionsMobile: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  taskActionButtonMobile: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  taskActionButtonPrimaryMobile: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  taskActionDangerMobile: {
    backgroundColor: '#fef2f2',
  },
  taskActionTextMobile: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  taskActionTextPrimaryMobile: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  taskActionDangerTextMobile: {
    color: '#dc2626',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBE6',
  },
  taskDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  taskMeta: {
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#FFF44F',
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
    color: '#FFF44F',
    fontWeight: '600',
  },
  taskActionDanger: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#FFFBE6',
    opacity: 0.8,
  },
  pointsText: {
    marginTop: 4,
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  emptyColumnText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFBE6',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#FFF44F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  primaryActionText: {
    color: '#2C1A00',
    fontWeight: '700',
    fontSize: 15,
  },
  inlineModalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inlineModal: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFBE6',
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    fontSize: 15,
    color: '#FFFBE6',
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  modalPrimary: {
    flex: 1,
    backgroundColor: '#FFF44F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  modalPrimaryText: {
    color: '#2C1A00',
    fontWeight: '700',
    fontSize: 15,
  },
  modalSecondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    color: '#FFFBE6',
    fontWeight: '600',
    fontSize: 15,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFBE6',
    marginTop: 12,
    marginBottom: 8,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityChipSelected: {
    borderWidth: 2,
  },
  priorityChipLow: {
    borderColor: '#94a3b8',
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  priorityChipMedium: {
    borderColor: '#FFF44F',
    backgroundColor: 'rgba(255,244,79,0.2)',
  },
  priorityChipHigh: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  priorityChipUrgent: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  priorityChipTextSelected: {
    color: '#FFFBE6',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  taskHeaderMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
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
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748b',
  },
  priorityBadgeTextLight: {
    color: '#0f172a',
  },
  tagsFilterContainer: {
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTagActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#1d4ed8',
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTagTextActive: {
    color: '#1d4ed8',
  },
  taskTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  taskTag: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
});


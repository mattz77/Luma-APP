import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTasks } from '@/hooks/useTasks';
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
  const { data: tasks, isLoading, isRefetching, refetch } = useTasks(houseId);

  if (!houseId) {
    return (
      <ScrollView contentContainerStyle={[styles.container, styles.centered]}>
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
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1d4ed8" />
      }
    >
      <Text style={styles.title}>Tarefas da Casa</Text>
      <Text style={styles.subtitle}>
        Visualize o quadro Kanban, programe recorrências e estimule a gamificação.
      </Text>

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
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
});


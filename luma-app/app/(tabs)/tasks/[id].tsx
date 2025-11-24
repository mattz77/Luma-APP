import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Calendar, CheckCircle2, Clock3, User, ListTodo, ArrowRight } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useTask } from '@/hooks/useTasks';
import { useAuthStore } from '@/stores/auth.store';

const DetailCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>
    <BlurView tint="light" intensity={20} style={StyleSheet.absoluteFill} />
    <View style={{ backgroundColor: 'rgba(255,255,255,0.75)', ...StyleSheet.absoluteFillObject }} />
    <View style={{ zIndex: 10 }}>{children}</View>
  </View>
);

const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusPalette: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: Colors.textSecondary },
  IN_PROGRESS: { label: 'Em andamento', color: Colors.accent },
  COMPLETED: { label: 'Concluída', color: Colors.primary },
  CANCELLED: { label: 'Cancelada', color: '#DD4A4A' },
};

export default function TaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const taskId = params.id ? String(params.id) : null;
  const { houseId } = useAuthStore();
  const { data: task, isLoading, error } = useTask(taskId);

  const palette = statusPalette[task?.status ?? 'PENDING'];
  const assigneeName = task?.assignee?.name ?? task?.assignee?.email ?? 'Não atribuído';
  const assignerName = task?.creator?.name ?? task?.creator?.email ?? 'Sistema';
  const priorityLabel = task?.priority ? task.priority.toLowerCase() : 'normal';

  const isAuthorized = useMemo(() => {
    if (!task || !houseId) return true;
    return task.houseId === houseId;
  }, [task, houseId]);

  const renderContent = () => {
    if (!taskId) {
      return <Text style={styles.message}>Tarefa inválida.</Text>;
    }

    if (isLoading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>Carregando detalhes...</Text>
        </View>
      );
    }

    if (error || !task || !isAuthorized) {
      return <Text style={styles.message}>Não foi possível encontrar esta tarefa.</Text>;
    }

    return (
      <>
        <DetailCard>
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <ListTodo size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Tarefa</Text>
              <Text style={styles.heroTitle}>{task.title}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: palette.color + '20' }]}>
              <Text style={[styles.statusText, { color: palette.color }]}>{palette.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: Colors.secondary + '20' }]}>
              <Text style={[styles.statusText, { color: Colors.secondary }]}>
                {priorityLabel}
              </Text>
            </View>
          </View>
        </DetailCard>

        <DetailCard>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>{task.description || 'Sem descrição.'}</Text>
        </DetailCard>

        <DetailCard>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={[styles.detailRow, styles.assignmentRow]}>
            <User size={18} color={Colors.primary} />
            <Text style={styles.detailLabel}>Atribuído para</Text>
            <View style={styles.assignmentValue}>
              <Text style={styles.assignmentUser}>{assignerName}</Text>
              <ArrowRight size={16} color={Colors.textSecondary} style={{ marginHorizontal: 6 }} />
              <Text style={styles.assignmentUser}>{assigneeName}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={18} color={Colors.primary} />
            <Text style={styles.detailLabel}>Prazo</Text>
            <Text style={styles.detailValue}>{formatDateTime(task.dueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock3 size={18} color={Colors.primary} />
            <Text style={styles.detailLabel}>Atualizada</Text>
            <Text style={styles.detailValue}>{formatDateTime(task.updatedAt)}</Text>
          </View>
          {task.completedAt && (
            <View style={styles.detailRow}>
              <CheckCircle2 size={18} color={Colors.primary} />
              <Text style={styles.detailLabel}>Concluída</Text>
              <Text style={styles.detailValue}>{formatDateTime(task.completedAt)}</Text>
            </View>
          )}
        </DetailCard>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Detalhes da Tarefa</Text>
          {renderContent()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  backText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  card: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    gap: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    textTransform: 'uppercase',
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 6,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  detailLabel: {
    minWidth: 100,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  assignmentRow: {
    alignItems: 'flex-start',
  },
  assignmentValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  assignmentUser: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  loader: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  message: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 16,
  },
});

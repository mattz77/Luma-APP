import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useExpenses } from '@/hooks/useExpenses';
import { useTasks } from '@/hooks/useTasks';
import { useCanAccessFinances } from '@/hooks/useUserRole';
import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const houseId = useAuthStore((state) => state.houseId);

  const canAccessFinances = useCanAccessFinances(houseId, user?.id);
  const { top } = useSafeAreaInsets();
  const { data: expenses } = useExpenses(houseId);
  const { data: tasks } = useTasks(houseId);

  const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) ?? 0;
  const totalExpensesCount = expenses?.length ?? 0;
  const paidExpensesCount = expenses?.filter((expense) => expense.isPaid).length ?? 0;

  const now = new Date();
  const pendingTasks =
    tasks?.filter((task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS').length ?? 0;
  const overdueTasks =
    tasks?.filter(
      (task) =>
        (task.status === 'PENDING' || task.status === 'IN_PROGRESS') &&
        task.dueDate &&
        new Date(task.dueDate) < now,
    ).length ?? 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 16 }]}
    >
      <Text style={styles.greeting}>Olá, {user?.name ?? 'família'} 👋</Text>
      <Text style={styles.subtitle}>
        {houseId
          ? 'Resumo de hoje da sua casa: finanças, tarefas e Luma em um só lugar.'
          : 'Crie ou entre em uma casa para ver o resumo da sua rotina.'}
      </Text>

      <View style={styles.cardRow}>
        {canAccessFinances && (
          <View style={[styles.card, cardShadowStyle]}>
            <Text style={styles.cardTitle}>Despesas do mês</Text>
            <Text style={styles.cardValue}>{formatCurrency(totalExpenses)}</Text>
            <Text style={styles.cardHint}>
              {houseId
                ? `Você registrou ${totalExpensesCount} despesa(s); ${paidExpensesCount} já marcada(s) como paga(s).`
                : 'Selecione uma casa para carregar os dados.'}
            </Text>
            {houseId && (
              <TouchableOpacity
                style={styles.cardActionButton}
                onPress={() => router.push('/(tabs)/finances')}
              >
                <Text style={styles.cardActionText}>Ver detalhes de finanças</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={[styles.card, cardShadowStyle, !canAccessFinances && styles.cardFullWidth]}>
          <Text style={styles.cardTitle}>Tarefas pendentes</Text>
          <Text style={styles.cardValue}>{pendingTasks}</Text>
          <Text style={styles.cardHint}>
            {houseId
              ? overdueTasks > 0
                ? `${overdueTasks} tarefa(s) atrasada(s) hoje.`
                : 'Inclui tarefas pendentes e em andamento.'
              : 'Crie ou entre em uma casa para visualizar.'}
          </Text>
          {houseId && (
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => router.push('/(tabs)/tasks')}
            >
              <Text style={styles.cardActionText}>Abrir quadro de tarefas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.cardLarge, cardShadowStyle]}>
        <Text style={styles.cardTitle}>Assistente Luma</Text>
        <Text style={styles.cardHint}>
          Use a Luma para entender suas finanças, organizar tarefas ou registrar novas informações da
          casa em linguagem natural.
        </Text>
        {houseId ? (
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={styles.chip}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/luma',
                  params: { preset: 'financas' },
                })
              }
            >
              <Text style={styles.chipText}>Como está a situação financeira este mês?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/luma',
                  params: { preset: 'tarefas' },
                })
              }
            >
              <Text style={styles.chipText}>Quais tarefas tenho para esta semana?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chip}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/luma',
                  params: { preset: 'despesa' },
                })
              }
            >
              <Text style={styles.chipText}>Me ajude a registrar uma nova despesa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.cardHint}>
            Conecte-se a uma casa para que a Luma possa usar o contexto da sua residência.
          </Text>
        )}
      </View>
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
    backgroundColor: '#ffffff',
    gap: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardFullWidth: {
    flex: 1,
  },
  cardLarge: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardHint: {
    fontSize: 14,
    color: '#64748b',
  },
  cardActionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  chipsRow: {
    marginTop: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#1f2937',
  },
});

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const pendingTasks =
    tasks?.filter((task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS').length ?? 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 16 }]}
    >
      <Text style={styles.greeting}>Olá, {user?.name ?? 'família'} 👋</Text>
      <Text style={styles.subtitle}>
        {houseId
          ? 'Veja, em um só lugar, como estão as finanças e as tarefas da sua casa hoje.'
          : 'Crie ou entre em uma casa para ver os indicadores do seu lar.'}
      </Text>

      <View style={styles.cardRow}>
        {canAccessFinances && (
          <View style={[styles.card, cardShadowStyle]}>
            <Text style={styles.cardTitle}>Despesas do mês</Text>
            <Text style={styles.cardValue}>{formatCurrency(totalExpenses)}</Text>
            <Text style={styles.cardHint}>
              {houseId
                ? 'Somatório das despesas registradas neste mês.'
                : 'Selecione uma casa para carregar os dados.'}
            </Text>
          </View>
        )}
        <View style={[styles.card, cardShadowStyle, !canAccessFinances && styles.cardFullWidth]}>
          <Text style={styles.cardTitle}>Tarefas pendentes</Text>
          <Text style={styles.cardValue}>{pendingTasks}</Text>
          <Text style={styles.cardHint}>
            {houseId
              ? 'Inclui tarefas pendentes e em andamento.'
              : 'Crie ou entre em uma casa para visualizar.'}
          </Text>
        </View>
      </View>

      <View style={[styles.cardLarge, cardShadowStyle]}>
        <Text style={styles.cardTitle}>Assistente Luma</Text>
        <Text style={styles.cardHint}>
          Converse com a Luma para registrar despesas, criar tarefas ou tirar dúvidas sobre a rotina da
          casa. Acesse a aba Luma para começar.
        </Text>
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
    backgroundColor: '#0b1220',
    gap: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardFullWidth: {
    flex: 1,
  },
  cardLarge: {
    backgroundColor: '#020617',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
  },
  cardHint: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

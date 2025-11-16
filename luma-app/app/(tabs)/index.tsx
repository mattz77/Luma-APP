import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const { data: expenses } = useExpenses(houseId);
  const { data: tasks } = useTasks(houseId);

  const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) ?? 0;
  const pendingTasks =
    tasks?.filter((task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS').length ?? 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Olá, {user?.name ?? 'família'} 👋</Text>
      <Text style={styles.subtitle}>
        {houseId
          ? 'Acompanhe como anda a rotina da casa hoje.'
          : 'Conecte-se a uma casa para ver seus indicadores.'}
      </Text>

      <View style={styles.cardRow}>
        {canAccessFinances && (
          <View style={[styles.card, cardShadowStyle]}>
            <Text style={styles.cardTitle}>Despesas do mês</Text>
            <Text style={styles.cardValue}>{formatCurrency(totalExpenses)}</Text>
            <Text style={styles.cardHint}>
              {houseId
                ? 'Somatório das despesas registradas este mês.'
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
          Faça uma pergunta ou peça ajuda em finanças, tarefas e dispositivos. Vá até a aba Luma para
          começar uma conversa.
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
    backgroundColor: '#f8fafc',
    gap: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardFullWidth: {
    flex: 1,
  },
  cardLarge: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
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
});

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, CalendarDays, CheckCircle, Clock, User, Wallet } from 'lucide-react-native';
import { useExpense } from '@/hooks/useExpenses';
import { useAuthStore } from '@/stores/auth.store';

const formatCurrency = (value?: number | string) => {
  const numeric = Number(value ?? 0);
  return `R$ ${numeric.toFixed(2)}`.replace('.', ',');
};

const formatDate = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DetailCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>
    <BlurView tint="light" intensity={25} style={StyleSheet.absoluteFill} />
    <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', ...StyleSheet.absoluteFillObject }} />
    <View style={{ zIndex: 10 }}>{children}</View>
  </View>
);

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const expenseId = params.id ? String(params.id) : null;
  const { houseId } = useAuthStore();
  const { data: expense, isLoading, error } = useExpense(expenseId);

  const isAuthorized = useMemo(() => {
    if (!expense || !houseId) return true;
    return expense.houseId === houseId;
  }, [expense, houseId]);

  const statusLabel = expense?.isPaid ? 'Pago' : 'Pendente';
  const statusColor = expense?.isPaid ? Colors.primary : Colors.textSecondary;

  const renderContent = () => {
    if (!expenseId) {
      return <Text style={styles.message}>Despesa inválida.</Text>;
    }

    if (isLoading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>Carregando detalhes...</Text>
        </View>
      );
    }

    if (error || !expense || !isAuthorized) {
      return (
        <Text style={styles.message}>
          Não foi possível encontrar esta despesa.
        </Text>
      );
    }

    return (
      <>
        <DetailCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={styles.heroIcon}>
              <Wallet size={28} color={Colors.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.heroLabel}>Despesa</Text>
              <Text style={styles.heroTitle}>{expense.description}</Text>
            </View>
          </View>
          <View style={styles.heroAmountRow}>
            <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </DetailCard>

        <DetailCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informações</Text>
          </View>
          <View style={styles.detailRow}>
            <CalendarDays size={18} color={Colors.primary} />
            <Text style={styles.detailLabel}>Data</Text>
            <Text style={styles.detailValue}>{formatDate(expense.expenseDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <User size={18} color={Colors.primary} />
            <Text style={styles.detailLabel}>Responsável</Text>
            <Text style={styles.detailValue}>
              {expense.createdBy?.name ?? expense.createdBy?.email ?? '---'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={18} color={Colors.primary} />
            <Text style={styles.detailLabel}>Criado em</Text>
            <Text style={styles.detailValue}>{formatDate(expense.createdAt)}</Text>
          </View>
        </DetailCard>

        {expense.splits?.length ? (
          <DetailCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Divisão</Text>
            </View>
            {expense.splits.map((split) => (
              <View key={split.id} style={styles.splitRow}>
                <View style={styles.splitIndicator}>
                  <CheckCircle size={16} color={split.isPaid ? Colors.primary : Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.splitName}>{split.user?.name ?? split.user?.email ?? 'Participante'}</Text>
                  <Text style={styles.splitAmount}>{formatCurrency(split.amount)}</Text>
                </View>
                <Text style={[styles.splitStatus, { color: split.isPaid ? Colors.primary : Colors.textSecondary }]}>
                  {split.isPaid ? 'Pago' : 'Pendente'}
                </Text>
              </View>
            ))}
          </DetailCard>
        ) : null}
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
          <Text style={styles.pageTitle}>Detalhes da Despesa</Text>
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
    color: Colors.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  heroAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    minWidth: 90,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  splitIndicator: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  splitAmount: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  splitStatus: {
    fontSize: 13,
    fontWeight: '600',
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



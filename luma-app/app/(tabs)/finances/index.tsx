import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet, BarChart3, Plus, Settings } from 'lucide-react-native';
import { GlassCard } from '@/components/shared';

import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useToggleExpensePaid,
  useUpdateExpense,
} from '@/hooks/useExpenses';
import { useRealtimeExpenses } from '@/hooks/useRealtimeExpenses';
import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from '@/hooks/useExpenseCategories';
import { useHouseMembers } from '@/hooks/useHouses';
import { useCanAccessFinances } from '@/hooks/useUserRole';
import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';
import type { Expense } from '@/types/models';
import { ExpenseFormModal, type ExpenseFormResult } from './components/ExpenseFormModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';

const formatCurrency = (value: string | number) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return 'R$ 0,00';
  }

  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
};

export default function FinancesScreen() {
  const router = useRouter();
  const houseId = useAuthStore((state) => state.houseId);
  const user = useAuthStore((state) => state.user);
  const canAccessFinances = useCanAccessFinances(houseId, user?.id);
  const { top } = useSafeAreaInsets();

  if (!canAccessFinances) {
    return (
      <View style={styles.noAccessContainer}>
        <Text style={styles.noAccessTitle}>Acesso Restrito</Text>
        <Text style={styles.noAccessText}>
          Apenas responsáveis pela casa têm acesso às informações financeiras.
        </Text>
      </View>
    );
  }

  const { data: expenses, isLoading, isRefetching, refetch } = useExpenses(houseId);
  useRealtimeExpenses(houseId); // Atualização em tempo real
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories(houseId);
  const { data: members = [], isLoading: membersLoading } = useHouseMembers(houseId ?? undefined);

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const toggleExpensePaidMutation = useToggleExpensePaid(houseId);

  const createCategoryMutation = useCreateExpenseCategory(houseId);
  const updateCategoryMutation = useUpdateExpenseCategory(houseId);
  const deleteCategoryMutation = useDeleteExpenseCategory(houseId);

  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [togglingExpenseId, setTogglingExpenseId] = useState<string | null>(null);

  const total = useMemo(
    () => expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) ?? 0,
    [expenses],
  );
  const totalCount = expenses?.length ?? 0;
  const paidCount = expenses?.filter((expense) => expense.isPaid).length ?? 0;

  if (!houseId) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, styles.centered, { paddingTop: top + 16 }]}
      >
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.emptySubtitle}>
          Vincule-se a uma casa ou crie uma nova para começar a registrar despesas.
        </Text>
      </ScrollView>
    );
  }

  const isSubmittingExpense = createExpenseMutation.isPending || updateExpenseMutation.isPending;

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setExpenseModalVisible(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseModalVisible(true);
  };

  const handleCloseModal = () => {
    setExpenseModalVisible(false);
    setEditingExpense(null);
  };

  const handleSubmitExpense = async (form: ExpenseFormResult) => {
    if (!houseId || !user?.id) {
      throw new Error('Casa ou usuário não encontrados.');
    }

    const payload = {
      houseId,
      categoryId: form.categoryId,
      createdById: editingExpense?.createdById ?? user.id,
      amount: form.amount,
      description: form.description,
      expenseDate: form.expenseDate,
      isRecurring: editingExpense?.isRecurring ?? false,
      recurrencePeriod: editingExpense?.recurrencePeriod ?? null,
      isPaid: form.isPaid,
      notes: form.notes ?? null,
      receiptUrl: form.receiptUrl ?? null,
      splits: form.splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        isPaid: split.isPaid,
      })),
    };

    if (editingExpense) {
      await updateExpenseMutation.mutateAsync({ id: editingExpense.id, input: payload });
    } else {
      await createExpenseMutation.mutateAsync(payload);
    }

    handleCloseModal();
  };

  const handleDeleteExpense = async () => {
    if (!editingExpense || !houseId) return;
    await deleteExpenseMutation.mutateAsync({ id: editingExpense.id, houseId });
    handleCloseModal();
  };

  const handleTogglePaid = async (expense: Expense, value: boolean) => {
    try {
      setTogglingExpenseId(expense.id);
      await toggleExpensePaidMutation.mutateAsync({ id: expense.id, isPaid: value });
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    } finally {
      setTogglingExpenseId(null);
    }
  };

  const handleCreateCategory = (name: string) => {
    if (!houseId) {
      return Promise.reject(new Error('Casa não encontrada.'));
    }
    return createCategoryMutation.mutateAsync(name);
  };

  const handleUpdateCategory = (id: string, name: string) =>
    updateCategoryMutation.mutateAsync({ id, name });

  const handleDeleteCategory = (id: string) => deleteCategoryMutation.mutateAsync(id);

  const renderExpenseRow = (expense: Expense) => {
    const isToggling = togglingExpenseId === expense.id && toggleExpensePaidMutation.isPending;
    return (
      <TouchableOpacity
        key={expense.id}
        style={styles.expenseRow}
        onPress={() => handleOpenEdit(expense)}
        activeOpacity={0.86}
      >
        <View style={styles.expenseIconBg}>
          <Wallet size={18} color="#FFF44F" />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{expense.description}</Text>
          <Text style={styles.expenseMeta}>
            {expense.category?.name ?? 'Sem categoria'} ·{' '}
            {new Date(expense.expenseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </Text>
          {expense.splits && expense.splits.length > 0 && (
            <Text style={styles.expenseHint}>
              Dividido entre {expense.splits.length} pessoa(s)
            </Text>
          )}
        </View>
        <View style={styles.expenseAside}>
          <Text
            style={[
              styles.expenseAmount,
              expense.isPaid ? styles.expenseAmountPaid : styles.expenseAmountPending,
            ]}
          >
            {formatCurrency(expense.amount)}
          </Text>
          <View style={styles.paidSwitchRow}>
            <Text style={styles.paidSwitchLabel}>{expense.isPaid ? 'Pago' : 'Pendente'}</Text>
            <Switch
              value={expense.isPaid}
              onValueChange={(value) => handleTogglePaid(expense, value)}
              disabled={isToggling || toggleExpensePaidMutation.isPending}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#10b981' }}
              thumbColor={expense.isPaid ? '#FFF44F' : '#f4f3f4'}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#C28400', '#8F6100']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: top + 16 }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FFF44F" />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerIconRow}>
            <View style={styles.walletIconBg}>
              <Wallet size={24} color="#C28400" />
            </View>
            <View>
              <Text style={styles.title}>Finanças da Casa</Text>
              <Text style={styles.subtitle}>NOV</Text>
            </View>
          </View>
          <Text style={styles.subtitleSecondary}>
            Controle total dos gastos e orçamento mensal.
          </Text>
        </View>
        
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push('/(tabs)/finances/reports')}
          >
            <BarChart3 size={18} color="#FFF44F" />
            <Text style={styles.headerActionText}>Relatórios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push('/(tabs)/finances/budget')}
          >
            <Wallet size={18} color="#FFF44F" />
            <Text style={styles.headerActionText}>Orçamento</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Settings size={18} color="#FFF44F" />
            <Text style={styles.headerActionText}>Categorias</Text>
          </TouchableOpacity>
        </View>

      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.cardTitle}>Total do mês</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalCount} DESPESAS</Text>
          </View>
        </View>
        <Text style={styles.cardValue}>{formatCurrency(String(total))}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min((paidCount / totalCount) * 100, 100)}%` }]} />
        </View>
        <Text style={styles.cardHint}>
          {totalCount > 0
            ? `${paidCount} de ${totalCount} despesas pagas`
            : 'Nenhuma despesa registrada ainda.'}
        </Text>
      </GlassCard>

      <GlassCard style={styles.listCard}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>Movimentações recentes</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
            <Plus size={20} color="#2C1A00" />
          </TouchableOpacity>
        </View>

        {isLoading || categoriesLoading || membersLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FFF44F" />
            <Text style={styles.helperText}>Carregando despesas...</Text>
          </View>
        ) : expenses && expenses.length > 0 ? (
          expenses.map((expense) => renderExpenseRow(expense))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma despesa registrada</Text>
            <Text style={styles.emptySubtitle}>
              Comece registrando contas como aluguel, luz, água ou supermercado.
            </Text>
          </View>
        )}
      </GlassCard>

      <ExpenseFormModal
        visible={isExpenseModalVisible}
        mode={editingExpense ? 'edit' : 'create'}
        initialExpense={editingExpense ?? undefined}
        onClose={handleCloseModal}
        onSubmit={handleSubmitExpense}
        onDelete={editingExpense ? handleDeleteExpense : undefined}
        categories={categories}
        members={members}
        currentUserId={user?.id ?? null}
        isSubmitting={isSubmittingExpense}
        isDeleting={deleteExpenseMutation.isPending}
        onCreateCategory={handleCreateCategory}
      />

      <CategoryManagerModal
        visible={isCategoryModalVisible}
        categories={categories}
        onClose={() => setCategoryModalVisible(false)}
        onCreate={handleCreateCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />
      </ScrollView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  headerRow: {
    marginBottom: 16,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  walletIconBg: {
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
  headerActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  headerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,244,79,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.3)',
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF44F',
  },
  badge: {
    backgroundColor: 'rgba(255,244,79,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF44F',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  summaryCard: {
    padding: 24,
  },
  listCard: {
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFBE6',
  },
  cardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  cardHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  helperText: {
    fontSize: 14,
    color: '#FFFBE6',
    opacity: 0.8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF44F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF44F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  expenseIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,244,79,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,244,79,0.2)',
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBE6',
  },
  expenseMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  expenseHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  expenseAside: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  expenseAmountPaid: {
    color: '#10b981',
  },
  expenseAmountPending: {
    color: '#FFF44F',
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFBE6',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  paidSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paidSwitchLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  noAccessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFBE6',
    marginBottom: 12,
    textAlign: 'center',
  },
  noAccessText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
});


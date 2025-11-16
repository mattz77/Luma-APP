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

import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useToggleExpensePaid,
  useUpdateExpense,
} from '@/hooks/useExpenses';
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
  const houseId = useAuthStore((state) => state.houseId);
  const user = useAuthStore((state) => state.user);
  const canAccessFinances = useCanAccessFinances(houseId, user?.id);

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

  if (!houseId) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, styles.centered]}>
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
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{expense.description}</Text>
          <Text style={styles.expenseMeta}>
            {expense.category?.name ?? 'Sem categoria'} ·{' '}
            {new Date(expense.expenseDate).toLocaleDateString('pt-BR')}
          </Text>
          <Text style={styles.expenseHint}>
            {expense.splits && expense.splits.length > 0
              ? `Dividido entre ${expense.splits.length} participante(s)`
              : 'Não dividido'}
          </Text>
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
            <Text style={styles.paidSwitchLabel}>Pago</Text>
            <Switch
              value={expense.isPaid}
              onValueChange={(value) => handleTogglePaid(expense, value)}
              disabled={isToggling || toggleExpensePaidMutation.isPending}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1d4ed8" />
      }
    >
      <Text style={styles.title}>Finanças da Casa</Text>
      <Text style={styles.subtitle}>
        Controle despesas, recibos e relatórios da sua residência compartilhada.
      </Text>

      <View style={[styles.summaryCard, cardShadowStyle]}>
        <View style={styles.summaryHeader}>
          <Text style={styles.cardTitle}>Despesas deste mês</Text>
          <TouchableOpacity
            style={styles.manageCategoriesButton}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text style={styles.manageCategoriesText}>Gerenciar categorias</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardValue}>{formatCurrency(String(total))}</Text>
        <Text style={styles.cardHint}>
          Valores atualizados automaticamente ao registrar novas despesas.
        </Text>
      </View>

      <View style={[styles.listCard, cardShadowStyle]}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>Movimentações recentes</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
            <Text style={styles.addButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {isLoading || categoriesLoading || membersLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.helperText}>Carregando dados...</Text>
          </View>
        ) : expenses && expenses.length > 0 ? (
          expenses.map((expense) => renderExpenseRow(expense))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma despesa registrada</Text>
            <Text style={styles.emptySubtitle}>
              Utilize o botão “Adicionar despesa” para começar o registro financeiro.
            </Text>
          </View>
        )}
      </View>

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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageCategoriesButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  manageCategoriesText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHint: {
    fontSize: 13,
    color: '#64748b',
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  expenseMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  expenseHint: {
    fontSize: 12,
    color: '#94a3b8',
  },
  expenseAside: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  expenseAmountPaid: {
    color: '#10b981',
  },
  expenseAmountPending: {
    color: '#ef4444',
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
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
  },
  loadingState: {
    alignItems: 'center',
    gap: 8,
  },
  paidSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noAccessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  noAccessText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  paidSwitchLabel: {
    fontSize: 12,
    color: '#475569',
  },
});


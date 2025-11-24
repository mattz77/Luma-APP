import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownCircle, ArrowUpCircle, DollarSign, MoreHorizontal, PieChart, Plus, TrendingUp, Wallet, ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useExpenses, useCreateExpense } from '@/hooks/useExpenses';
import { useBudgetLimit } from '@/hooks/useMonthlyBudget';
import { useExpenseCategories, useCreateExpenseCategory } from '@/hooks/useExpenseCategories';
import { useHouseMembers } from '@/hooks/useHouses';
import { useRealtimeExpenses } from '@/hooks/useRealtimeExpenses';
import { useAuthStore } from '@/stores/auth.store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlassCard } from '@/components/shared';
import { Colors } from '@/constants/Colors';
import { ExpenseFormModal, type ExpenseFormResult } from '@/components/finances/ExpenseFormModal';

// --- Helper Components for Light Theme ---
const LightGlassCard = ({ children, style }: any) => (
  <View style={[styles.glassCard, style]}>
    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
    <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', ...StyleSheet.absoluteFillObject }} />
    <View style={{ zIndex: 10 }}>{children}</View>
  </View>
);

export default function FinancesScreen() {
  const router = useRouter();
  const { houseId, user } = useAuthStore();
  const { top } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  const { data: expenses, isLoading, isRefetching, refetch } = useExpenses(houseId);
  const { data: budgetLimit } = useBudgetLimit(houseId);
  const { data: categories = [] } = useExpenseCategories(houseId);
  const { data: members = [] } = useHouseMembers(houseId);
  const createExpenseMutation = useCreateExpense();
  const createCategoryMutation = useCreateExpenseCategory(houseId);
  useRealtimeExpenses(houseId);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);

  const handleOpenExpenseModal = () => {
    Haptics.selectionAsync();
    setExpenseModalVisible(true);
  };

  const handleCloseExpenseModal = () => {
    setExpenseModalVisible(false);
  };

  const handleSubmitExpense = async (formData: ExpenseFormResult) => {
    if (!houseId || !user?.id) {
      throw new Error('Selecione uma casa para registrar despesas.');
    }

    await createExpenseMutation.mutateAsync({
      houseId,
      createdById: user.id,
      categoryId: formData.categoryId,
      amount: formData.amount,
      description: formData.description,
      expenseDate: formData.expenseDate,
      isRecurring: false,
      recurrencePeriod: null,
      isPaid: formData.isPaid,
      notes: formData.notes,
      receiptUrl: formData.receiptUrl,
      splits: formData.splits.map((split) => ({
        userId: split.userId,
        amount: split.amount,
        isPaid: split.isPaid,
      })),
    });

    setExpenseModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCreateCategory = async (name: string) => {
    const category = await createCategoryMutation.mutateAsync(name);
    return category;
  };

  if (!houseId) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, styles.centered, { paddingTop: top + 16 }]}
      >
        <Text style={styles.emptyTitle}>Selecione uma casa</Text>
        <Text style={styles.emptySubtitle}>
          Associe-se a uma casa para gerenciar as finanças compartilhadas.
        </Text>
      </ScrollView>
    );
  }

  const summary = useMemo(() => {
    if (!expenses) return { total: 0, paid: 0, pending: 0 };
    return expenses.reduce(
      (acc, expense) => {
        const amount = Number(expense.amount);
        acc.total += amount;
        if (expense.isPaid) {
          acc.paid += amount;
        } else {
          acc.pending += amount;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0 }
    );
  }, [expenses]);

  const budgetProgress = useMemo(() => {
    if (!budgetLimit || !budgetLimit.amount) return 0;
    return Math.min((summary.total / Number(budgetLimit.amount)) * 100, 100);
  }, [summary.total, budgetLimit]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (selectedFilter === 'all') return expenses;
    return expenses.filter((e) => (selectedFilter === 'paid' ? e.isPaid : !e.isPaid));
  }, [expenses, selectedFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Background Light Theme */}
        <View style={{ backgroundColor: Colors.background, ...StyleSheet.absoluteFillObject }} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: top + 16 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(tabs)/' as any)}
            >
              <ArrowLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerRow}>
              <View style={styles.walletIconBg}>
                <Wallet size={24} color={Colors.background} />
              </View>
              <View>
                <Text style={styles.title}>Finanças da Casa</Text>
                <Text style={styles.subtitle}>Gestão de despesas compartilhadas</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.settingsButton}>
              <MoreHorizontal size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Main Summary Card */}
          <LightGlassCard style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Gasto este Mês</Text>
              <View style={styles.budgetBadge}>
                <Text style={styles.budgetBadgeText}>
                  Orçamento: {budgetLimit ? formatCurrency(Number(budgetLimit.amount)) : 'Não definido'}
                </Text>
              </View>
            </View>

            <Text style={styles.totalAmount}>{formatCurrency(summary.total)}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${budgetProgress}%`, backgroundColor: budgetProgress > 90 ? '#ef4444' : Colors.primary }]} />
            </View>
            <Text style={styles.progressText}>{budgetProgress.toFixed(0)}% do orçamento utilizado</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: '#22c55e20' }]}>
                  <ArrowUpCircle size={20} color="#16a34a" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Pago</Text>
                  <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatCurrency(summary.paid)}</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: '#ef444420' }]}>
                  <ArrowDownCircle size={20} color="#dc2626" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Pendente</Text>
                  <Text style={[styles.statValue, { color: '#dc2626' }]}>{formatCurrency(summary.pending)}</Text>
                </View>
              </View>
            </View>
          </LightGlassCard>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleOpenExpenseModal}>
              <Plus size={20} color={Colors.background} />
              <Text style={styles.actionButtonTextPrimary}>Nova Despesa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => router.push('/(tabs)/finances/budget' as any)}
            >
              <PieChart size={20} color={Colors.primary} />
              <Text style={styles.actionButtonTextSecondary}>Definir orçamento</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>Todas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === 'paid' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('paid')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'paid' && styles.filterTabTextActive]}>Pagas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === 'pending' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('pending')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'pending' && styles.filterTabTextActive]}>Pendentes</Text>
            </TouchableOpacity>
          </View>

          {/* Expenses List */}
          <View style={styles.expensesList}>
            <Text style={styles.sectionTitle}>Histórico Recente</Text>

            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({
                      pathname: '/(tabs)/finances/[id]',
                      params: { id: expense.id },
                    } as any);
                  }}
                >
                  <View style={styles.expenseIconBg}>
                    <DollarSign size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseTitle}>{expense.description}</Text>
                    <Text style={styles.expenseDate}>
                      {new Date(expense.expenseDate).toLocaleDateString('pt-BR')} •{' '}
                      {expense.createdBy?.name ?? expense.createdBy?.email ?? 'Desconhecido'}
                    </Text>
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={styles.expenseAmount}>{formatCurrency(Number(expense.amount))}</Text>
                    <View style={[
                      styles.statusBadge,
                      expense.isPaid ? styles.statusBadgePaid : styles.statusBadgePending
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        expense.isPaid ? styles.statusBadgeTextPaid : styles.statusBadgeTextPending
                      ]}>
                        {expense.isPaid ? 'Pago' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Nenhuma despesa encontrada.</Text>
              </View>
            )}
          </View>
        </ScrollView>
        <ExpenseFormModal
          visible={isExpenseModalVisible}
          mode="create"
          initialExpense={null}
          onClose={handleCloseExpenseModal}
          onSubmit={handleSubmitExpense}
          categories={categories}
          members={members}
          currentUserId={user?.id ?? null}
          isSubmitting={createExpenseMutation.isPending}
          isDeleting={false}
          onCreateCategory={handleCreateCategory}
        />
      </View>
    </ErrorBoundary>
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
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  centered: {
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

  // Header
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  settingsButton: {
    padding: 8,
  },

  // Summary Card
  glassCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  summaryCard: {
    // Additional styles if needed
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  budgetBadge: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  budgetBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.textSecondary + '20',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.textSecondary + '20',
    marginHorizontal: 16,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonTextPrimary: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 15,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonTextSecondary: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },

  // Filters
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  filterTabActive: {
    backgroundColor: Colors.primary + '10',
  },
  filterTabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // List
  expensesList: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  expenseIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgePaid: {
    backgroundColor: '#22c55e20',
  },
  statusBadgePending: {
    backgroundColor: '#ef444420',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadgeTextPaid: {
    color: '#16a34a',
  },
  statusBadgeTextPending: {
    color: '#dc2626',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});

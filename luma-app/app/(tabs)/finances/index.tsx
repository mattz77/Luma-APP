import React, { useCallback, useMemo, useState } from 'react';
import { Platform, RefreshControl, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  ChevronLeft,
  PieChart,
  Plus,
  Search,
  Wallet,
  Zap,
} from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Skeleton } from '@/components/ui/skeleton';

import { useExpenses, useCreateExpense } from '@/hooks/useExpenses';
import { useBudgetLimit } from '@/hooks/useMonthlyBudget';
import { useExpenseCategories, useCreateExpenseCategory } from '@/hooks/useExpenseCategories';
import { useHouseMembers } from '@/hooks/useHouses';
import { useRealtimeExpenses } from '@/hooks/useRealtimeExpenses';
import { useAuthStore } from '@/stores/auth.store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ExpenseFormModal, type ExpenseFormResult } from '@/components/finances/ExpenseFormModal';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Toast } from '@/components/ui/Toast';
import type { Expense } from '@/types/models';
import { Colors } from '@/constants/Colors';
import { AlertCircle } from 'lucide-react-native';
import { formatDayAndMonthLongLocal } from '@/lib/dateLocale';
import { ScreenGreeting } from '@/components/ScreenGreeting';

// --- Alinhado à tela de Tarefas (tasks/index.tsx) ---
const THEMES = {
  yellow: { bg: 'bg-[#FDE047]', text: 'text-black', badge: 'bg-black/10 text-black', iconBg: 'bg-white/50' },
  lavender: { bg: 'bg-[#DDD6FE]', text: 'text-black', badge: 'bg-black/10 text-black', iconBg: 'bg-white/50' },
  dark: { bg: 'bg-[#27272A]', text: 'text-white', badge: 'bg-zinc-800 text-zinc-300', iconBg: 'bg-zinc-700' },
};

const DateStrip = () => {
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = -1; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        day: d.getDate(),
        week: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
        active: i === 0,
        fullDate: d,
      });
    }
    return arr;
  }, []);

  return (
    <Animated.View layout={Layout.springify()}>
      {/* padding vertical: dia ativo usa scale(1.05) + sombra — evita corte no topo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 14,
          alignItems: 'center',
        }}
      >
        <HStack space="md" className="items-center">
          {dates.map((date, i) => (
            <Pressable
              key={i}
              onPress={() => Haptics.selectionAsync()}
              className={`items-center justify-center border w-[60px] h-[85px] ${
                date.active
                  ? 'bg-[#FDE047] border-[#FDE047] shadow-lg shadow-yellow-900/20'
                  : 'bg-white border-slate-200'
              }`}
              style={[{ borderRadius: 24 }, date.active && { transform: [{ scale: 1.05 }] }]}
            >
              <Text className={`text-2xl font-bold mb-1 ${date.active ? 'text-black' : 'text-slate-900'}`}>
                {date.day}
              </Text>
              <Text className={`text-xs font-bold uppercase ${date.active ? 'text-black' : 'text-slate-400'}`}>
                {date.week}
              </Text>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Animated.View>
  );
};

const TABULAR_NUMS_STYLE: TextStyle | undefined =
  Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : undefined;

const FinanceStatsWidget = ({
  total,
  paid,
  pending,
  budgetProgress,
  hasBudget,
  budgetAmountFormatted,
  formatCurrency,
}: {
  total: number;
  paid: number;
  pending: number;
  budgetProgress: number;
  hasBudget: boolean;
  budgetAmountFormatted: string | null;
  formatCurrency: (v: number) => string;
}) => {
  const pct = Math.min(Math.round(budgetProgress), 100);

  return (
    <Box className="mx-6 mb-8">
      <HStack className="justify-between items-end mb-4">
        <Heading size="lg" className="font-bold text-slate-900">
          Resumo do mês
        </Heading>
        <VStack className="items-end max-w-[55%]">
          <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Orçamento</Text>
          {hasBudget && budgetAmountFormatted ? (
            <Text
              className="text-base font-semibold text-slate-900 tracking-tight"
              style={TABULAR_NUMS_STYLE}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {budgetAmountFormatted}
            </Text>
          ) : (
            <Text className="text-sm text-slate-500 font-medium text-right">Sem orçamento definido</Text>
          )}
        </VStack>
      </HStack>

      <Box className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <HStack className="items-center justify-between mb-6">
          <VStack>
            <AnimatedNumber
              value={total}
              formatter={formatCurrency}
              style={{
                fontSize: 32,
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: 4,
                letterSpacing: -0.3,
                ...TABULAR_NUMS_STYLE,
              }}
            />
            <Text className="text-sm text-slate-400 font-medium">Total gasto</Text>
          </VStack>
          <Box className="w-16 h-16 rounded-full border-4 border-slate-100 items-center justify-center relative">
            <Box
              className="absolute w-full h-full rounded-full border-4 border-t-[#FDE047] border-r-[#FDE047] rotate-45"
            />
            <Text className="text-xs font-bold text-slate-900">{pct}%</Text>
          </Box>
        </HStack>

        <Text className="text-xs text-slate-400 font-medium mb-3">Do orçamento utilizado</Text>

        <HStack className="items-center justify-between pt-4 border-t border-slate-100">
          <HStack space="sm" className="items-center flex-1">
            <Box className="w-9 h-9 rounded-xl bg-emerald-500/15 items-center justify-center">
              <ArrowUpCircle size={18} color="#16a34a" />
            </Box>
            <VStack>
              <Text className="text-xs text-slate-400 font-medium">Pago</Text>
              <AnimatedNumber
                value={paid}
                formatter={formatCurrency}
                style={{ fontSize: 15, fontWeight: '600', color: '#16a34a', ...TABULAR_NUMS_STYLE }}
              />
            </VStack>
          </HStack>
          <Box className="w-px h-10 bg-slate-100 mx-2" />
          <HStack space="sm" className="items-center flex-1">
            <Box className="w-9 h-9 rounded-xl bg-red-500/15 items-center justify-center">
              <ArrowDownCircle size={18} color="#dc2626" />
            </Box>
            <VStack>
              <Text className="text-xs text-slate-400 font-medium">Pendente</Text>
              <AnimatedNumber
                value={pending}
                formatter={formatCurrency}
                style={{ fontSize: 15, fontWeight: '600', color: '#dc2626', ...TABULAR_NUMS_STYLE }}
              />
            </VStack>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

const themeForExpense = (expense: Expense): keyof typeof THEMES => {
  const amount = Number(expense.amount);
  if (amount >= 500) return 'yellow';
  if (!expense.isPaid) return 'dark';
  const id = expense.id ?? '';
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return n % 2 === 0 ? 'lavender' : 'yellow';
};

const BentoExpenseCard = ({
  expense,
  formatCurrency,
  onPress,
}: {
  expense: Expense;
  formatCurrency: (v: number) => string;
  onPress: () => void;
}) => {
  const themeKey = themeForExpense(expense);
  const theme = THEMES[themeKey];
  const categoryLabel = expense.category?.name ?? 'Geral';
  const dateStr = new Date(expense.expenseDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <Animated.View entering={FadeInDown.springify()} layout={Layout.springify()}>
      <Pressable
        onPress={onPress}
        className={`p-5 rounded-[32px] mb-4 relative overflow-hidden active:scale-[0.98] ${theme.bg}`}
      >
        <HStack className="justify-between items-start mb-4">
          <Box className={`px-3 py-1 rounded-full ${theme.badge}`}>
            <Text className={`text-xs font-bold uppercase tracking-wider ${theme.text} opacity-80`}>
              {categoryLabel}
            </Text>
          </Box>
          {!expense.isPaid && (
            <HStack space="xs" className="items-center">
              <Box className="w-2 h-2 rounded-full bg-amber-500" />
              <Text className={`text-xs font-bold ${theme.text}`}>Pendente</Text>
            </HStack>
          )}
        </HStack>

        <Heading size="xl" className={`font-bold leading-tight mb-2 ${theme.text}`} numberOfLines={2}>
          {expense.description || 'Despesa'}
        </Heading>

        <HStack space="xs" className="items-center mb-6 opacity-80">
          <Calendar size={16} color={themeKey === 'dark' ? 'white' : 'black'} />
          <Text className={`text-sm font-medium ${theme.text}`}>{dateStr}</Text>
          <Text className={`text-sm font-medium ${theme.text} opacity-60`}>•</Text>
          <Text className={`text-sm font-medium ${theme.text}`} numberOfLines={1}>
            {expense.createdBy?.name ?? expense.createdBy?.email ?? '—'}
          </Text>
        </HStack>

        <HStack className="items-center justify-between mt-auto">
          <HStack space="xs" className="items-center">
            <Box className={`w-10 h-10 rounded-2xl items-center justify-center ${theme.iconBg}`}>
              <Wallet size={18} color={themeKey === 'dark' ? 'white' : 'black'} />
            </Box>
            <Text className={`text-lg font-bold ${theme.text}`}>{formatCurrency(Number(expense.amount))}</Text>
          </HStack>

          <Box
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${
              expense.isPaid ? (themeKey === 'dark' ? 'bg-emerald-500/25' : 'bg-black') : 'bg-red-500/90'
            }`}
          >
            <Zap size={12} color={expense.isPaid ? (themeKey === 'dark' ? '#34d399' : '#FDE047') : '#fff'} fill="currentColor" />
            <Text
              className={`text-xs font-bold ${
                expense.isPaid ? (themeKey === 'dark' ? 'text-emerald-400' : 'text-[#FDE047]') : 'text-white'
              }`}
            >
              {expense.isPaid ? 'Pago' : 'A pagar'}
            </Text>
          </Box>
        </HStack>
      </Pressable>
    </Animated.View>
  );
};

export default function FinancesScreen() {
  const router = useRouter();
  const { houseId, user } = useAuthStore();

  const { data: expenses, isLoading, isRefetching, refetch } = useExpenses(houseId);
  const { data: budgetLimit } = useBudgetLimit(houseId);
  const { data: categories = [] } = useExpenseCategories(houseId);
  const { data: members = [] } = useHouseMembers(houseId);
  const createExpenseMutation = useCreateExpense();
  const createCategoryMutation = useCreateExpenseCategory(houseId);
  useRealtimeExpenses(houseId);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

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
    showToast('Despesa registrada com sucesso!', 'success');
  };

  const handleCreateCategory = async (name: string) => {
    const category = await createCategoryMutation.mutateAsync(name);
    return category;
  };

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
    []
  );

  const summary = useMemo(() => {
    if (!expenses) return { total: 0, paid: 0, pending: 0 };
    return expenses.reduce(
      (acc, expense) => {
        const amount = Number(expense.amount);
        acc.total += amount;
        if (expense.isPaid) acc.paid += amount;
        else acc.pending += amount;
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

  const hasBudget = !!(budgetLimit && budgetLimit.amount);
  const budgetAmountFormatted =
    hasBudget && budgetLimit ? formatCurrency(Number(budgetLimit.amount)) : null;

  const greetingFirstName = user?.name?.split(' ')[0] ?? '';

  if (!houseId) {
    return (
      <Box className="flex-1 bg-[#FDFBF7] items-center justify-center px-6">
        <AlertCircle size={48} color={Colors.textSecondary} />
        <Heading size="lg" className="text-slate-900 text-center mt-4">
          Selecione uma casa
        </Heading>
        <Text className="text-slate-500 text-center mt-2">
          Associe-se a uma casa para gerenciar as finanças compartilhadas.
        </Text>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box className="flex-1 bg-[#FDFBF7]">
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header — mesmo padrão de Tarefas */}
          <Box className="px-6 pt-12 pb-6 flex-row justify-between items-center">
            <VStack>
              <ScreenGreeting firstName={greetingFirstName} variant="ola" />
              <HStack space="xs" className="items-center">
                <Heading size="xl" className="font-bold text-slate-900">
                  Finanças · {formatDayAndMonthLongLocal()}
                </Heading>
                <ChevronLeft size={18} className="text-slate-400 -rotate-90" />
              </HStack>
            </VStack>
            <HStack space="sm">
              <Pressable
                onPress={handleOpenExpenseModal}
                className="w-10 h-10 rounded-full bg-[#FDE047] border border-yellow-200 items-center justify-center shadow-sm active:scale-[0.95]"
              >
                <Plus size={20} className="text-slate-900" />
              </Pressable>
              <Pressable className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm active:scale-[0.95]">
                <Search size={18} className="text-slate-900" />
              </Pressable>
            </HStack>
          </Box>

          <DateStrip />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#FDE047" />
            }
          >
            <FinanceStatsWidget
              total={summary.total}
              paid={summary.paid}
              pending={summary.pending}
              budgetProgress={budgetProgress}
              hasBudget={hasBudget}
              budgetAmountFormatted={budgetAmountFormatted}
              formatCurrency={formatCurrency}
            />

            {/* Ações — estilo bento / botões da experiência Tarefas */}
            <Box className="px-6 mb-6">
              <HStack space="md">
                <Pressable
                  onPress={handleOpenExpenseModal}
                  className="flex-1 flex-row items-center justify-center bg-[#FDE047] h-14 rounded-[24px] gap-2 shadow-lg shadow-yellow-200 active:scale-[0.98]"
                >
                  <Plus size={20} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-[15px]">Nova despesa</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/finances/budget' as any)}
                  className="flex-1 flex-row items-center justify-center bg-white border border-slate-100 h-14 rounded-[24px] gap-2 shadow-sm active:scale-[0.98]"
                >
                  <PieChart size={20} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-[14px]">Orçamento</Text>
                </Pressable>
              </HStack>
            </Box>

            {/* Filtros — segmentado como chips da tela de tarefas */}
            <Box className="px-6 mb-4">
              <HStack className="bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {(
                  [
                    { key: 'all' as const, label: 'Todas' },
                    { key: 'paid' as const, label: 'Pagas' },
                    { key: 'pending' as const, label: 'Pendentes' },
                  ] as const
                ).map(({ key, label }) => {
                  const active = selectedFilter === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedFilter(key);
                      }}
                      className={`flex-1 py-2.5 rounded-xl items-center ${active ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                    >
                      <Text className={`text-xs font-bold ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </HStack>
            </Box>

            <Box className="px-6 space-y-4">
              <HStack className="justify-between items-center mb-2">
                <Heading size="xl" className="font-bold text-slate-900">
                  Histórico
                </Heading>
                <Text className="text-sm text-slate-400 font-medium">
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'itens'}
                </Text>
              </HStack>

              {isLoading ? (
                <VStack space="md">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="w-full h-[200px] rounded-[32px]" />
                  ))}
                </VStack>
              ) : (
                filteredExpenses.map((expense) => (
                  <BentoExpenseCard
                    key={expense.id}
                    expense={expense}
                    formatCurrency={formatCurrency}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push({
                        pathname: '/(tabs)/finances/[id]',
                        params: { id: expense.id },
                      } as any);
                    }}
                  />
                ))
              )}

              {filteredExpenses.length === 0 && !isLoading && (
                <Box className="py-10 items-center opacity-50">
                  <Wallet size={48} color="#cbd5e1" />
                  <Text className="text-slate-400 mt-4 font-medium text-center">
                    Nenhuma despesa neste filtro.
                  </Text>
                </Box>
              )}
            </Box>
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

          {toast && (
            <Toast
              visible={toast.visible}
              message={toast.message}
              type={toast.type}
              onDismiss={() => setToast(null)}
            />
          )}
        </SafeAreaView>
      </Box>
    </ErrorBoundary>
  );
}

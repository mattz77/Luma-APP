import React, { useState, useEffect, useMemo } from 'react';
import { Platform, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlertCircle, ArrowLeft, ChevronRight, Wallet } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Spinner } from '@/components/ui/spinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import { BudgetLimitModal } from '@/components/finances/BudgetLimitModal';
import { useBudgetLimit, useUpsertBudgetLimit } from '@/hooks/useMonthlyBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/stores/auth.store';
import { getBudgetUsageColor } from '@/lib/budgetUsageColor';
import { formatCurrency } from '@/lib/moneyInputBrl';
import { ScreenGreeting } from '@/components/ScreenGreeting';

const TABULAR_NUMS_STYLE: TextStyle | undefined =
  Platform.OS === 'ios' ? { fontVariant: ['tabular-nums'] } : undefined;

const FieldLabel = ({ children }: { children: string }) => (
  <Text className="text-slate-500 text-xs font-bold ml-1 uppercase tracking-wider">{children}</Text>
);

export default function BudgetScreen() {
  const router = useRouter();
  const houseId = useAuthStore((s) => s.houseId);
  const user = useAuthStore((s) => s.user);

  const { data: budget, isLoading } = useBudgetLimit(houseId);
  const upsertMutation = useUpsertBudgetLimit();
  const { data: expenses = [] } = useExpenses(houseId);

  const [amountCentsDigits, setAmountCentsDigits] = useState('');
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    if (budget?.amount != null) {
      const n = Number(budget.amount);
      if (Number.isFinite(n) && n >= 0) {
        setAmountCentsDigits(String(Math.round(n * 100)));
      } else {
        setAmountCentsDigits('');
      }
    } else {
      setAmountCentsDigits('');
    }
  }, [budget]);

  const totalSpent = useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }, [expenses]);

  const progress = useMemo(() => {
    if (!budget || !Number(budget.amount)) return 0;
    return Math.min((totalSpent / Number(budget.amount)) * 100, 100);
  }, [budget, totalSpent]);

  const remaining = useMemo(() => {
    if (!budget?.amount) return 0;
    return Math.max(Number(budget.amount) - totalSpent, 0);
  }, [budget, totalSpent]);

  const progressColor = useMemo(() => getBudgetUsageColor(progress), [progress]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleLimitSubmit = async (amount: number) => {
    if (!houseId) {
      throw new Error('Selecione uma casa primeiro.');
    }
    await upsertMutation.mutateAsync({ houseId, amount });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Limite salvo com sucesso!', 'success');
    setLimitModalVisible(false);
  };

  const openLimitModal = () => {
    Haptics.selectionAsync();
    setLimitModalVisible(true);
  };

  const greetingFirstName = user?.name?.split(' ')[0] ?? '';

  if (!houseId) {
    return (
      <Box className="flex-1 bg-[#FDFBF7] items-center justify-center px-6">
        <AlertCircle size={48} color="#94a3b8" />
        <Heading size="lg" className="text-slate-900 text-center mt-4">
          Selecione uma casa
        </Heading>
        <Text className="text-slate-500 text-center mt-2">
          Associe-se a uma casa para definir o limite de orçamento.
        </Text>
      </Box>
    );
  }

  const limitSummaryText = budget?.amount
    ? formatCurrency(Number(budget.amount))
    : 'Toque para definir';

  return (
    <ErrorBoundary>
      <Box className="flex-1 bg-[#FDFBF7]">
        <SafeAreaView className="flex-1" edges={['top']}>
          <HStack className="px-6 pt-12 pb-6 items-center">
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm active:scale-[0.95] mr-3"
            >
              <ArrowLeft size={20} color="#0f172a" />
            </Pressable>
            <VStack className="flex-1">
              <ScreenGreeting firstName={greetingFirstName} variant="ola" />
              <Heading size="xl" className="font-bold text-slate-900">
                Orçamento
              </Heading>
            </VStack>
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <Box className="mx-6 mb-6">
              <Heading size="lg" className="font-bold text-slate-900 mb-4">
                Limite do mês
              </Heading>

              <Box className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <HStack className="items-start justify-between mb-6">
                  <HStack space="md" className="items-center flex-1">
                    <Box className="w-14 h-14 rounded-2xl bg-[#DDD6FE] items-center justify-center">
                      <Wallet size={26} color="#0f172a" />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                        Limite configurado
                      </Text>
                      <Text
                        className="text-3xl font-semibold text-slate-900 tracking-tight"
                        style={TABULAR_NUMS_STYLE}
                      >
                        {budget?.amount ? formatCurrency(Number(budget.amount)) : '—'}
                      </Text>
                    </VStack>
                  </HStack>
                  <Box className="w-16 h-16 rounded-full border-4 border-slate-100 items-center justify-center relative">
                    <Box
                      className="absolute w-full h-full rounded-full rotate-45"
                      style={{
                        borderWidth: 4,
                        borderTopColor: progressColor,
                        borderRightColor: progressColor,
                        borderBottomColor: 'transparent',
                        borderLeftColor: 'transparent',
                      }}
                    />
                    <Text className="text-xs font-bold text-slate-900">{Math.round(progress)}%</Text>
                  </Box>
                </HStack>

                <VStack className="mb-4">
                  <Text className="text-2xl font-semibold text-slate-900 tracking-tight" style={TABULAR_NUMS_STYLE}>
                    {formatCurrency(totalSpent)}
                  </Text>
                  <Text className="text-sm text-slate-400 font-medium">Gasto total este mês</Text>
                </VStack>

                <Text className="text-xs text-slate-400 font-medium mb-3">Do limite utilizado</Text>

                <Box className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                  <Box className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
                </Box>

                <HStack className="justify-between pt-4 border-t border-slate-100">
                  <Text className="text-sm text-slate-500">{Math.round(progress)}% utilizado</Text>
                  <Text className="text-sm font-semibold text-slate-900" style={TABULAR_NUMS_STYLE}>
                    Restante: {budget?.amount ? formatCurrency(remaining) : '—'}
                  </Text>
                </HStack>
              </Box>
            </Box>

            <Box className="px-6 mb-6">
              <Box className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                {isLoading ? (
                  <Box className="py-12 items-center">
                    <Spinner size="large" />
                  </Box>
                ) : (
                  <VStack space="md">
                    <FieldLabel>Atualizar limite geral</FieldLabel>
                    <Pressable
                      onPress={openLimitModal}
                      className="flex-row items-center justify-between min-h-[56px] px-4 py-3 rounded-2xl border border-slate-200 bg-white active:bg-slate-50 active:scale-[0.99]"
                      accessibilityRole="button"
                      accessibilityLabel="Abrir para editar limite mensal"
                    >
                      <Text
                        className={`flex-1 text-base font-semibold mr-2 ${
                          budget?.amount ? 'text-slate-900' : 'text-slate-400'
                        }`}
                        numberOfLines={1}
                      >
                        {limitSummaryText}
                      </Text>
                      <ChevronRight size={22} color="#64748b" />
                    </Pressable>
                  </VStack>
                )}
              </Box>
            </Box>

            <Box className="px-6">
              <Box className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <Heading size="md" className="font-bold text-slate-900 mb-3">
                  Como funciona?
                </Heading>
                <Text className="text-sm text-slate-600 leading-6 mb-4">
                  Defina um limite geral de gastos. O Luma usará esse valor como referência mensal para:
                </Text>
                <VStack space="sm">
                  <Text className="text-sm text-slate-600 leading-6">
                    • Acompanhar o progresso dos gastos
                  </Text>
                  <Text className="text-sm text-slate-600 leading-6">
                    • Alertar quando estiver perto do limite
                  </Text>
                  <Text className="text-sm text-slate-600 leading-6">
                    • Gerar relatórios e insights personalizados
                  </Text>
                </VStack>
              </Box>
            </Box>
          </ScrollView>

          <BudgetLimitModal
            visible={limitModalVisible}
            initialCentsDigits={amountCentsDigits}
            onClose={() => setLimitModalVisible(false)}
            onSubmit={handleLimitSubmit}
            isSubmitting={upsertMutation.isPending}
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

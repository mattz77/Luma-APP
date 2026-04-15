import React, { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Save, Wallet } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/ui/Toast';
import { useBudgetLimit, useUpsertBudgetLimit } from '@/hooks/useMonthlyBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/stores/auth.store';
import { AlertCircle } from 'lucide-react-native';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

  const [amount, setAmount] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    if (budget) {
      setAmount(String(budget.amount));
    } else {
      setAmount('');
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

  const parsedPreview = useMemo(() => {
    const raw = amount.replace(/[^0-9.,]/g, '').replace(',', '.');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }, [amount]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleSave = async () => {
    if (!houseId) {
      Alert.alert('Erro', 'Selecione uma casa primeiro.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Informe um valor válido.');
      return;
    }

    try {
      await upsertMutation.mutateAsync({ houseId, amount: numericAmount });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Limite salvo com sucesso!', 'success');
      setTimeout(() => router.back(), 600);
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

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

  return (
    <ErrorBoundary>
      <Box className="flex-1 bg-[#FDFBF7]">
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header — alinhado à lista Finanças */}
          <HStack className="px-6 pt-12 pb-6 items-center">
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm active:scale-95 mr-3"
            >
              <ArrowLeft size={20} color="#0f172a" />
            </Pressable>
            <VStack className="flex-1">
              <Text className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                Olá, {user?.name?.split(' ')[0] || 'Usuário'}!
              </Text>
              <Heading size="xl" className="font-bold text-slate-900">
                Orçamento
              </Heading>
            </VStack>
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Resumo — mesmo cartão que “Resumo do mês” na lista */}
            <Box className="mx-6 mb-6">
              <HStack className="justify-between items-end mb-4">
                <Heading size="lg" className="font-bold text-slate-900">
                  Limite do mês
                </Heading>
                <Text className="text-slate-500 text-sm font-medium">
                  {budget?.amount ? formatCurrency(Number(budget.amount)) : 'Não definido'}
                </Text>
              </HStack>

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
                      <Text className="text-3xl font-bold text-slate-900">
                        {budget?.amount ? formatCurrency(Number(budget.amount)) : '—'}
                      </Text>
                    </VStack>
                  </HStack>
                  <Box className="w-16 h-16 rounded-full border-4 border-slate-100 items-center justify-center relative">
                    <Box className="absolute w-full h-full rounded-full border-4 border-t-[#FDE047] border-r-[#FDE047] rotate-45" />
                    <Text className="text-xs font-bold text-slate-900">{Math.round(progress)}%</Text>
                  </Box>
                </HStack>

                <VStack className="mb-4">
                  <Text className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</Text>
                  <Text className="text-sm text-slate-400 font-medium">Gasto total este mês</Text>
                </VStack>

                <Text className="text-xs text-slate-400 font-medium mb-3">Do limite utilizado</Text>

                <Box className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                  <Box className="h-full rounded-full bg-[#FDE047]" style={{ width: `${progress}%` }} />
                </Box>

                <HStack className="justify-between pt-4 border-t border-slate-100">
                  <Text className="text-sm text-slate-500">{Math.round(progress)}% utilizado</Text>
                  <Text className="text-sm font-semibold text-slate-900">
                    Restante: {budget?.amount ? formatCurrency(remaining) : '—'}
                  </Text>
                </HStack>
              </Box>
            </Box>

            {/* Formulário */}
            <Box className="px-6 mb-6">
              <Box className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                {isLoading ? (
                  <Box className="py-12 items-center">
                    <Spinner size="large" />
                  </Box>
                ) : (
                  <VStack space="lg">
                    <VStack space="xs">
                      <FieldLabel>Atualizar limite geral</FieldLabel>
                      <Input className="h-14 border border-slate-200 bg-white rounded-2xl">
                        <InputField
                          value={amount}
                          onChangeText={setAmount}
                          placeholder="0,00"
                          keyboardType="decimal-pad"
                          className="text-lg font-semibold text-slate-900 px-3"
                          placeholderTextColor="#94a3b8"
                        />
                      </Input>
                      {parsedPreview !== null && parsedPreview > 0 && (
                        <Text className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(parsedPreview)}</Text>
                      )}
                    </VStack>

                    <Pressable
                      onPress={handleSave}
                      disabled={upsertMutation.isPending}
                      className={`bg-[#FDE047] h-14 rounded-[24px] flex-row items-center justify-center gap-2 shadow-lg shadow-yellow-200 active:scale-[0.98] ${
                        upsertMutation.isPending ? 'opacity-60' : ''
                      }`}
                    >
                      {upsertMutation.isPending ? (
                        <Spinner size="small" color="#0f172a" />
                      ) : (
                        <>
                          <Save size={20} color="#0f172a" />
                          <Text className="text-slate-900 font-bold text-base">Salvar limite</Text>
                        </>
                      )}
                    </Pressable>
                  </VStack>
                )}
              </Box>
            </Box>

            {/* Info */}
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

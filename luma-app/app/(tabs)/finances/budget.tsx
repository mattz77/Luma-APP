import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, Wallet } from 'lucide-react-native';

import { useBudgetLimit, useUpsertBudgetLimit } from '@/hooks/useMonthlyBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';
import { Colors } from '@/constants/Colors';

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

export default function BudgetScreen() {
  const router = useRouter();
  const houseId = useAuthStore((state) => state.houseId);
  const { top } = useSafeAreaInsets();

  const { data: budget, isLoading } = useBudgetLimit(houseId);
  const upsertMutation = useUpsertBudgetLimit();
  const { data: expenses = [] } = useExpenses(houseId);

  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (budget) {
      setAmount(budget.amount);
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

  const goToFinances = () => router.replace('/(tabs)/finances' as any);

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
      Alert.alert('Sucesso', 'Limite salvo com sucesso!', [{ text: 'OK', onPress: goToFinances }]);
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    }
  };

  const handleGoBack = () => {
    goToFinances();
  };

  if (!houseId) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, styles.centered, { paddingTop: top + 16 }]}
      >
        <Text style={styles.emptyTitle}>Selecione uma casa</Text>
        <Text style={styles.emptySubtitle}>
          Associe-se a uma casa para definir o limite de orçamento.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 16 }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Orçamento da Casa</Text>
      </View>

      <View style={[styles.summaryCard, cardShadowStyle]}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIcon}>
            <Wallet size={26} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Limite configurado</Text>
            <Text style={styles.summaryAmount}>
              {budget ? formatCurrency(budget.amount) : 'Defina um valor'}
            </Text>
          </View>
        </View>

        <View style={styles.progressMeta}>
          <Text style={styles.progressValue}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.progressCaption}>Gasto total este mês</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressFooterLabel}>{progress.toFixed(0)}% utilizado</Text>
          <Text style={styles.progressFooterValue}>
            Restante:{' '}
            {budget ? formatCurrency(Math.max(Number(budget.amount) - totalSpent, 0)) : '—'}
          </Text>
        </View>
      </View>

      <View style={[styles.card, cardShadowStyle]}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.label}>Atualizar limite geral</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              style={styles.input}
              keyboardType="numeric"
            />
            {amount && !Number.isNaN(parseFloat(amount.replace(/[^0-9.,]/g, '').replace(',', '.'))) && (
              <Text style={styles.preview}>
                {formatCurrency(amount.replace(/[^0-9.,]/g, '').replace(',', '.'))}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.saveButton, upsertMutation.isPending && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Salvar limite</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={[styles.infoCard, cardShadowStyle]}>
        <Text style={styles.infoTitle}>Como funciona?</Text>
        <Text style={styles.infoText}>
          Defina um limite geral de gastos. O Luma usará esse valor como referência mensal para:
        </Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>• Acompanhar o progresso dos gastos</Text>
          <Text style={styles.infoItem}>• Alertar quando estiver perto do limite</Text>
          <Text style={styles.infoItem}>• Gerar relatórios e insights personalizados</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  progressMeta: {
    alignItems: 'flex-start',
    gap: 2,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  progressCaption: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.textSecondary + '20',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressFooterLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  progressFooterValue: {
    color: Colors.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  preview: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 40,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  infoList: {
    gap: 6,
  },
  infoItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});


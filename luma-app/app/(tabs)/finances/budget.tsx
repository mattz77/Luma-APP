import { useState, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';

import { useMonthlyBudget, useUpsertMonthlyBudget } from '@/hooks/useMonthlyBudget';
import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';

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

const formatMonth = (month: string) => {
  const [year, monthNum] = month.split('-');
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export default function BudgetScreen() {
  const router = useRouter();
  const { month } = useLocalSearchParams<{ month?: string }>();
  const houseId = useAuthStore((state) => state.houseId);
  const { top } = useSafeAreaInsets();

  const currentMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: budget, isLoading } = useMonthlyBudget(houseId, currentMonth);
  const upsertMutation = useUpsertMonthlyBudget();

  const [amount, setAmount] = useState('');

  // Atualizar o input quando o budget carregar
  useEffect(() => {
    if (budget) {
      setAmount(budget.amount);
    } else {
      setAmount('');
    }
  }, [budget]);

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
      await upsertMutation.mutateAsync({
        house_id: houseId,
        month: currentMonth,
        amount: numericAmount,
      });
      Alert.alert('Sucesso', 'Orçamento salvo com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    }
  };

  if (!houseId) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, styles.centered, { paddingTop: top + 16 }]}
      >
        <Text style={styles.emptyTitle}>Selecione uma casa</Text>
        <Text style={styles.emptySubtitle}>
          Associe-se a uma casa para definir o orçamento mensal.
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Orçamento Mensal</Text>
      </View>

      <View style={[styles.card, cardShadowStyle]}>
        <Text style={styles.monthLabel}>{formatMonth(currentMonth)}</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#1d4ed8" style={styles.loader} />
        ) : (
          <>
            <Text style={styles.label}>Valor do orçamento</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              style={styles.input}
              keyboardType="numeric"
              autoFocus
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
                  <Text style={styles.saveButtonText}>Salvar orçamento</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={[styles.infoCard, cardShadowStyle]}>
        <Text style={styles.infoTitle}>Como funciona?</Text>
        <Text style={styles.infoText}>
          Defina um orçamento mensal para sua casa. O Luma usará esse valor para:
        </Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>• Acompanhar o progresso dos gastos</Text>
          <Text style={styles.infoItem}>• Alertar quando próximo do limite</Text>
          <Text style={styles.infoItem}>• Sugerir ajustes nas despesas</Text>
        </View>
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
    paddingHorizontal: 24,
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
    padding: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  preview: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoList: {
    gap: 6,
  },
  infoItem: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
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
    marginTop: 8,
  },
});


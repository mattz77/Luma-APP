import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, CalendarDays, CheckCircle, Clock, Trash2, User, Wallet } from 'lucide-react-native';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Toast } from '@/components/ui/Toast';
import { useDeleteExpense, useExpense } from '@/hooks/useExpenses';
import { useUserRole } from '@/hooks/useUserRole';
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
  const houseId = useAuthStore((s) => s.houseId);
  const userId = useAuthStore((s) => s.user?.id);
  const userRole = useUserRole(houseId, userId);
  const isHouseAdmin = userRole === 'ADMIN';
  const deleteExpenseMutation = useDeleteExpense();
  const { data: expense, isLoading, isError, error, isSuccess } = useExpense(expenseId, houseId);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'error' } | null>(null);

  const isAuthorized = useMemo(() => {
    if (!expense || !houseId) return true;
    return expense.houseId === houseId;
  }, [expense, houseId]);

  const showDeleteAction =
    Boolean(isHouseAdmin && expense && isAuthorized && !isLoading && !isError);

  const confirmDeleteExpense = useCallback(async () => {
    if (!expense) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      await deleteExpenseMutation.mutateAsync({ id: expense.id, houseId: expense.houseId });
      setShowDeleteAlert(false);
      router.back();
    } catch (err: unknown) {
      setShowDeleteAlert(false);
      const message =
        err instanceof Error ? err.message : 'Não foi possível excluir a despesa. Tente novamente.';
      setToast({ visible: true, message, type: 'error' });
    }
  }, [deleteExpenseMutation, expense, router]);

  const handleRequestDelete = useCallback(() => {
    if (!expense) return;
    setShowDeleteAlert(true);
  }, [expense]);

  const closeDeleteAlert = useCallback(() => {
    if (deleteExpenseMutation.isPending) return;
    setShowDeleteAlert(false);
  }, [deleteExpenseMutation.isPending]);

  const statusLabel = expense?.isPaid ? 'Pago' : 'Pendente';
  const statusColor = expense?.isPaid ? Colors.primary : Colors.textSecondary;

  const renderContent = () => {
    if (!expenseId) {
      return <Text style={styles.message}>Despesa inválida.</Text>;
    }

    if (expenseId && !houseId) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>Carregando casa...</Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>Carregando detalhes...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.feedbackBlock}>
          <Text style={styles.message}>
            {error instanceof Error ? error.message : 'Não foi possível carregar esta despesa. Tente novamente.'}
          </Text>
          <Button style={styles.feedbackButton} action="primary" onPress={() => router.back()}>
            <ButtonText>Voltar</ButtonText>
          </Button>
        </View>
      );
    }

    if (isSuccess && expense === null) {
      return (
        <View style={styles.feedbackBlock}>
          <Text style={styles.message}>
            Esta despesa não existe ou não está disponível para a casa atual (pode ter sido removida ou os dados
            ainda não sincronizaram).
          </Text>
          <Button style={styles.feedbackButton} action="primary" onPress={() => router.back()}>
            <ButtonText>Voltar</ButtonText>
          </Button>
        </View>
      );
    }

    if (!expense || !isAuthorized) {
      return (
        <View style={styles.feedbackBlock}>
          <Text style={styles.message}>Você não tem acesso a esta despesa.</Text>
          <Button style={styles.feedbackButton} variant="outline" action="secondary" onPress={() => router.back()}>
            <ButtonText>Voltar</ButtonText>
          </Button>
        </View>
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
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Detalhes da Despesa</Text>
            {showDeleteAction ? (
              <TouchableOpacity
                style={styles.deleteIconButton}
                onPress={handleRequestDelete}
                disabled={deleteExpenseMutation.isPending}
                accessibilityLabel="Excluir despesa"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Trash2 size={22} color="#ef4444" />
              </TouchableOpacity>
            ) : null}
          </View>
          {renderContent()}
        </ScrollView>

        <AlertDialog isOpen={showDeleteAlert} onClose={closeDeleteAlert}>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Heading size="lg">Excluir despesa</Heading>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text style={styles.deleteDialogBody}>
                Deseja realmente excluir esta despesa? Essa ação não pode ser desfeita.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button variant="outline" action="secondary" onPress={closeDeleteAlert}>
                <ButtonText>Cancelar</ButtonText>
              </Button>
              <Button
                action="negative"
                onPress={() => void confirmDeleteExpense()}
                isDisabled={deleteExpenseMutation.isPending}
              >
                <ButtonText>{deleteExpenseMutation.isPending ? 'Removendo...' : 'Excluir'}</ButtonText>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {toast ? (
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        ) : null}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  deleteIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
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
    lineHeight: 22,
  },
  feedbackBlock: {
    gap: 16,
    paddingVertical: 24,
    alignItems: 'stretch',
  },
  feedbackButton: {
    marginTop: 8,
  },
  deleteDialogBody: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});



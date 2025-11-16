import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Expense, ExpenseCategory, ExpenseSplit, HouseMemberWithUser } from '@/types/models';

interface MemberShare {
  userId: string;
  amount: number;
  isPaid: boolean;
}

export interface ExpenseFormResult {
  description: string;
  amount: number;
  expenseDate: string;
  categoryId: string | null;
  isPaid: boolean;
  notes: string | null;
  receiptUrl: string | null;
  splits: MemberShare[];
}

interface ExpenseFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialExpense?: Expense | null;
  onClose: () => void;
  onSubmit: (data: ExpenseFormResult) => Promise<void>;
  onDelete?: () => Promise<void>;
  categories: ExpenseCategory[];
  members: HouseMemberWithUser[];
  currentUserId: string | null;
  isSubmitting: boolean;
  isDeleting: boolean;
  onCreateCategory: (name: string) => Promise<ExpenseCategory>;
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

const formatNumber = (value: string) => value.replace(/[^0-9.,]/g, '').replace(',', '.');

export function ExpenseFormModal({
  visible,
  mode,
  initialExpense,
  onClose,
  onSubmit,
  onDelete,
  categories,
  members,
  currentUserId,
  isSubmitting,
  isDeleting,
  onCreateCategory,
}: ExpenseFormModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('0');
  const [expenseDate, setExpenseDate] = useState(defaultDate());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [shares, setShares] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isEditMode = mode === 'edit' && Boolean(initialExpense);

  const memberLookup = useMemo(() => {
    const map = new Map<string, HouseMemberWithUser>();
    members.forEach((member) => map.set(member.userId, member));
    return map;
  }, [members]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEditMode && initialExpense) {
      setDescription(initialExpense.description);
      setAmount(String(Number(initialExpense.amount)));
      setExpenseDate(initialExpense.expenseDate.slice(0, 10));
      setCategoryId(initialExpense.categoryId);
      setIsPaid(initialExpense.isPaid);
      setNotes(initialExpense.notes ?? '');
      setReceiptUrl(initialExpense.receiptUrl ?? '');

      const splits = initialExpense.splits ?? [];
      const memberIds = splits.length
        ? splits.map((split) => split.userId)
        : currentUserId
          ? [currentUserId]
          : [];

      setSelectedMembers(memberIds);
      if (splits.length) {
        const shareMap: Record<string, string> = {};
        splits.forEach((split) => {
          shareMap[split.userId] = String(parseFloat(split.amount));
        });
        setShares(shareMap);
      } else {
        setShares(createEqualShareMap(memberIds, Number(initialExpense.amount || 0)));
      }
    } else {
      setDescription('');
      setAmount('0');
      setExpenseDate(defaultDate());
      setCategoryId(categories[0]?.id ?? null);
      setIsPaid(false);
      setNotes('');
      setReceiptUrl('');
      const defaultMembers = currentUserId ? [currentUserId] : [];
      setSelectedMembers(defaultMembers);
      setShares(createEqualShareMap(defaultMembers, 0));
    }
    setErrorMessage(null);
    setIsAddingCategory(false);
    setNewCategoryName('');
  }, [visible, isEditMode, initialExpense, categories, currentUserId]);

  const handleToggleMember = (memberId: string) => {
    setErrorMessage(null);
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) {
          Alert.alert('Seleção inválida', 'A despesa deve estar associada a pelo menos um membro.');
          return prev;
        }
        const updatedMembers = prev.filter((id) => id !== memberId);
        setShares((prevShares) => {
          const newShares = { ...prevShares };
          delete newShares[memberId];
          return newShares;
        });
        return updatedMembers;
      }
      const updatedMembers = [...prev, memberId];
      const distributed = createEqualShareMap(updatedMembers, parseFloat(amount) || 0);
      setShares(distributed);
      return updatedMembers;
    });
  };

  const handleDistributeEqually = () => {
    if (!selectedMembers.length) {
      return;
    }
    const distributed = createEqualShareMap(selectedMembers, parseFloat(amount) || 0);
    setShares(distributed);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    try {
      const category = await onCreateCategory(newCategoryName.trim());
      setCategoryId(category.id);
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    const parsedAmount = parseFloat(formatNumber(amount));
    if (!description.trim()) {
      setErrorMessage('Descreva a despesa.');
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Informe um valor válido.');
      return;
    }
    if (!expenseDate) {
      setErrorMessage('Informe a data da despesa.');
      return;
    }
    if (!selectedMembers.length) {
      setErrorMessage('Selecione ao menos um membro para dividir a despesa.');
      return;
    }

    const splitValues = selectedMembers.map((memberId) => {
      const value = parseFloat(formatNumber(shares[memberId] ?? '0'));
      return { memberId, value };
    });
    const totalShares = splitValues.reduce((acc, item) => acc + (Number.isNaN(item.value) ? 0 : item.value), 0);
    const difference = Math.abs(totalShares - parsedAmount);
    if (difference > 0.05) {
      setErrorMessage('A soma das cotas deve ser igual ao valor total da despesa.');
      return;
    }

    const normalizedSplits: MemberShare[] = splitValues.map((item, index) => {
      let value = item.value;
      if (index === splitValues.length - 1 && difference > 0) {
        const adjustment = parsedAmount - (totalShares - item.value);
        value = adjustment;
      }
      return {
        userId: item.memberId,
        amount: Number(value.toFixed(2)),
        isPaid,
      };
    });

    try {
      await onSubmit({
        description: description.trim(),
        amount: Number(parsedAmount.toFixed(2)),
        expenseDate,
        categoryId,
        isPaid,
        notes: notes.trim() ? notes.trim() : null,
        receiptUrl: receiptUrl.trim() ? receiptUrl.trim() : null,
        splits: normalizedSplits,
      });
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    Alert.alert('Excluir despesa', 'Deseja realmente excluir esta despesa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete();
          } catch (error) {
            Alert.alert('Erro', (error as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Editar despesa' : 'Nova despesa'}
            </Text>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              placeholder="Ex.: Mercado do mês"
            />

            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              value={amount}
              onChangeText={(value) => setAmount(formatNumber(value))}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0,00"
            />

            <Text style={styles.label}>Data</Text>
            <TextInput
              value={expenseDate}
              onChangeText={setExpenseDate}
              style={styles.input}
              placeholder="AAAA-MM-DD"
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Pago</Text>
              <Switch value={isPaid} onValueChange={setIsPaid} />
            </View>

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                    onPress={() => setCategoryId(category.id)}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.categoryChip, styles.categoryAddChip]}
                onPress={() => setIsAddingCategory(true)}
              >
                <Text style={[styles.categoryText, styles.categoryAddText]}>+ Categoria</Text>
              </TouchableOpacity>
            </View>

            {isAddingCategory ? (
              <View style={styles.newCategoryRow}>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Nome da categoria"
                  style={[styles.input, styles.flex1]}
                />
                <TouchableOpacity style={styles.secondaryButton} onPress={handleAddCategory}>
                  <Text style={styles.secondaryButtonText}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.secondaryButtonGhost]}
                  onPress={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                >
                  <Text style={[styles.secondaryButtonText, styles.secondaryButtonGhostText]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.label}>Dividir com</Text>
            <View style={styles.memberGrid}>
              {members.map((member) => {
                const selected = selectedMembers.includes(member.userId);
                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => handleToggleMember(member.userId)}
                    style={[styles.memberChip, selected && styles.memberChipSelected]}
                  >
                    <Text
                      style={[styles.memberChipText, selected && styles.memberChipTextSelected]}
                    >
                      {member.user.name ?? member.user.email}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedMembers.length > 0 ? (
              <View style={styles.shareHeader}>
                <Text style={styles.label}>Valores individuais</Text>
                <TouchableOpacity onPress={handleDistributeEqually}>
                  <Text style={styles.linkButton}>Distribuir igualmente</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {selectedMembers.map((memberId) => {
              const member = memberLookup.get(memberId);
              if (!member) {
                return null;
              }
              return (
                <View key={memberId} style={styles.shareRow}>
                  <Text style={styles.shareName}>{member.user.name ?? member.user.email}</Text>
                  <TextInput
                    value={shares[memberId] ?? '0'}
                    onChangeText={(value) =>
                      setShares((prev) => ({ ...prev, [memberId]: formatNumber(value) }))
                    }
                    keyboardType="decimal-pad"
                    style={[styles.input, styles.shareInput]}
                  />
                </View>
              );
            })}

            <Text style={styles.label}>Notas</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.multilineInput]}
              multiline
              numberOfLines={3}
              placeholder="Observações adicionais"
            />

            <Text style={styles.label}>Comprovante (URL opcional)</Text>
            <TextInput
              value={receiptUrl}
              onChangeText={setReceiptUrl}
              style={styles.input}
              placeholder="https://..."
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            {isEditMode && onDelete ? (
              <TouchableOpacity
                style={[styles.footerButton, styles.deleteButton]}
                onPress={handleDelete}
                disabled={isDeleting || isSubmitting}
              >
                <Text style={styles.deleteButtonText}>
                  {isDeleting ? 'Removendo...' : 'Excluir'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.footerButton, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Adicionar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createEqualShareMap = (memberIds: string[], total: number) => {
  if (!memberIds.length || total <= 0) {
    return memberIds.reduce<Record<string, string>>((acc, id) => {
      acc[id] = '0';
      return acc;
    }, {});
  }
  const equalValue = total / memberIds.length;
  return memberIds.reduce<Record<string, string>>((acc, id, index) => {
    let value = equalValue;
    if (index === memberIds.length - 1) {
      const currentTotal = equalValue * (memberIds.length - 1);
      value = total - currentTotal;
    }
    acc[id] = value.toFixed(2);
    return acc;
  }, {});
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  categoryChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  categoryAddChip: {
    borderStyle: 'dashed',
  },
  categoryAddText: {
    color: '#2563eb',
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  secondaryButtonGhost: {
    backgroundColor: 'transparent',
  },
  secondaryButtonGhostText: {
    color: '#64748b',
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  memberChipSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  memberChipText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  memberChipTextSelected: {
    color: '#fff',
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkButton: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  shareName: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  shareInput: {
    width: 110,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '600',
  },
});


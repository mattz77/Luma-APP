import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

import type { Expense, ExpenseCategory, ExpenseSplit, HouseMemberWithUser } from '@/types/models';
import { pickImageFromGallery, takePhoto, uploadImageToStorage, deleteImageFromStorage } from '@/lib/storage';

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
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
      setSelectedImageUri(initialExpense.receiptUrl ?? null);

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
      setSelectedImageUri(null);
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

  const handlePickImage = async () => {
    try {
      const result = await pickImageFromGallery();
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setReceiptUrl(''); // Limpar URL antiga se houver
      }
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto();
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setReceiptUrl(''); // Limpar URL antiga se houver
      }
    } catch (error) {
      Alert.alert('Erro', (error as Error).message);
    }
  };

  const handleRemoveImage = async () => {
    // Se há uma URL antiga (não é uma nova imagem), deletar do storage
    if (receiptUrl && receiptUrl.startsWith('http')) {
      try {
        await deleteImageFromStorage(receiptUrl);
      } catch (error) {
        console.error('Erro ao deletar imagem:', error);
      }
    }
    setSelectedImageUri(null);
    setReceiptUrl('');
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
      let finalReceiptUrl = receiptUrl.trim() || null;

      // Se há uma nova imagem selecionada, fazer upload
      if (selectedImageUri && !selectedImageUri.startsWith('http')) {
        setIsUploadingImage(true);
        const uploadResult = await uploadImageToStorage(selectedImageUri);
        setIsUploadingImage(false);

        if (uploadResult.error) {
          setErrorMessage(`Erro ao fazer upload da imagem: ${uploadResult.error}`);
          return;
        }

        if (uploadResult.url) {
          finalReceiptUrl = uploadResult.url;
        }
      }

      await onSubmit({
        description: description.trim(),
        amount: Number(parsedAmount.toFixed(2)),
        expenseDate,
        categoryId,
        isPaid,
        notes: notes.trim() ? notes.trim() : null,
        receiptUrl: finalReceiptUrl,
        splits: normalizedSplits,
      });
    } catch (error) {
      setIsUploadingImage(false);
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
    <Modal animationType="fade" visible={visible} onRequestClose={onClose} transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,10,0.35)' }]} />
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.dragHandle} />
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

            <Text style={styles.label}>Comprovante</Text>
            
            {selectedImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageUploadButtons}>
                <TouchableOpacity
                  style={[styles.imageUploadButton, styles.imageUploadButtonPrimary]}
                  onPress={handlePickImage}
                  disabled={isUploadingImage}
                >
                  <ImageIcon size={20} color="#1d4ed8" />
                  <Text style={styles.imageUploadButtonText}>Escolher da galeria</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageUploadButton, styles.imageUploadButtonSecondary]}
                  onPress={handleTakePhoto}
                  disabled={isUploadingImage}
                >
                  <Camera size={20} color="#64748b" />
                  <Text style={[styles.imageUploadButtonText, styles.imageUploadButtonTextSecondary]}>
                    Tirar foto
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isUploadingImage && (
              <View style={styles.uploadingIndicator}>
                <ActivityIndicator size="small" color="#1d4ed8" />
                <Text style={styles.uploadingText}>Fazendo upload da imagem...</Text>
              </View>
            )}

            <Text style={[styles.label, styles.helperLabel]}>Ou insira uma URL manualmente</Text>
            <TextInput
              value={receiptUrl}
              onChangeText={setReceiptUrl}
              style={styles.input}
              placeholder="https://..."
              editable={!selectedImageUri && !isUploadingImage}
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '20',
    maxHeight: '88%',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 18,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 60,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.textSecondary + '40',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.textSecondary + '25',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.card,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: Colors.background,
  },
  categoryAddChip: {
    borderStyle: 'dashed',
  },
  categoryAddText: {
    color: Colors.primary,
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
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary + '15',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
    borderColor: Colors.textSecondary + '25',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.card,
  },
  memberChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  memberChipText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  memberChipTextSelected: {
    color: Colors.background,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  linkButton: {
    color: Colors.primary,
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
    color: Colors.text,
  },
  shareInput: {
    width: 120,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '25',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: Colors.background,
    color: Colors.text,
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
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: Colors.textSecondary + '15',
  },
  cancelButtonText: {
    color: Colors.text,
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
  imageUploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  imageUploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  imageUploadButtonPrimary: {
    backgroundColor: '#eff6ff',
    borderColor: '#1d4ed8',
  },
  imageUploadButtonSecondary: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  imageUploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  imageUploadButtonTextSecondary: {
    color: '#64748b',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  helperLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 4,
  },
});


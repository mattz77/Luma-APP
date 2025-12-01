import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

import type { Expense, ExpenseCategory, ExpenseSplit, HouseMemberWithUser } from '@/types/models';
import { pickImageFromGallery, takePhoto, uploadImageToStorage, deleteImageFromStorage } from '@/lib/storage';

// Gluestack UI v3 imports
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollView } from '@/components/ui/scroll-view';
import { KeyboardAvoidingView } from '@/components/ui/keyboard-avoiding-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Image } from '@/components/ui/image';
import { Pressable } from '@/components/ui/pressable';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogCloseButton } from '@/components/ui/alert-dialog';
import { Alert, AlertText } from '@/components/ui/alert';

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
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showInvalidMemberAlert, setShowInvalidMemberAlert] = useState(false);

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
          setShowInvalidMemberAlert(true);
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
      setErrorMessage((error as Error).message);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await pickImageFromGallery();
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setReceiptUrl('');
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto();
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setReceiptUrl('');
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleRemoveImage = async () => {
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
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete();
      setShowDeleteAlert(false);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setShowDeleteAlert(false);
    }
  };

  return (
    <>
      <Modal isOpen={visible} onClose={onClose} size="full">
        <ModalBackdrop />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <ModalContent style={styles.modalContent}>
            <ModalHeader>
              <VStack space="sm" className="w-full items-center">
                <Box style={styles.dragHandle} />
                <Heading size="lg">
                  {isEditMode ? 'Editar despesa' : 'Nova despesa'}
                </Heading>
              </VStack>
            </ModalHeader>
            <ModalBody>
              <ScrollView>
                <VStack space="lg" style={styles.scrollContent}>
                  <VStack space="sm">
                    <Text size="sm" className="font-semibold">Descrição</Text>
                    <Input>
                      <InputField
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Ex.: Mercado do mês"
                      />
                    </Input>
                  </VStack>

                  <VStack space="sm">
                    <Text size="sm" className="font-semibold">Valor (R$)</Text>
                    <Input>
                      <InputField
                        value={amount}
                        onChangeText={(value) => setAmount(formatNumber(value))}
                        keyboardType="decimal-pad"
                        placeholder="0,00"
                      />
                    </Input>
                  </VStack>

                  <VStack space="sm">
                    <Text size="sm" className="font-semibold">Data</Text>
                    <Input>
                      <InputField
                        value={expenseDate}
                        onChangeText={setExpenseDate}
                        placeholder="AAAA-MM-DD"
                      />
                    </Input>
                  </VStack>

                  <HStack space="md" className="items-center justify-between py-2">
                    <Text size="sm" className="font-semibold">Pago</Text>
                    <Switch value={isPaid} onValueChange={setIsPaid} />
                  </HStack>

                  <VStack space="sm">
                    <Text size="sm" className="font-semibold">Categoria</Text>
                    <HStack space="sm" className="flex-wrap">
                      {categories.map((category) => {
                        const selected = category.id === categoryId;
                        return (
                          <Pressable
                            key={category.id}
                            onPress={() => setCategoryId(category.id)}
                            className={`px-3.5 py-2 rounded-[18px] border ${
                              selected
                                ? 'bg-primary-500 border-primary-500'
                                : 'bg-background-0 border-outline-300'
                            }`}
                          >
                            <Text
                              size="xs"
                              className={`font-semibold ${
                                selected ? 'text-background-0' : 'text-typography-900'
                              }`}
                            >
                              {category.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Pressable
                        onPress={() => setIsAddingCategory(true)}
                        className="px-3.5 py-2 rounded-[18px] border border-dashed border-outline-300 bg-background-0"
                      >
                        <Text size="xs" className="font-semibold text-primary-500">
                          + Categoria
                        </Text>
                      </Pressable>
                    </HStack>
                  </VStack>

                  {isAddingCategory && (
                    <HStack space="sm" className="items-center">
                      <Input className="flex-1">
                        <InputField
                          value={newCategoryName}
                          onChangeText={setNewCategoryName}
                          placeholder="Nome da categoria"
                        />
                      </Input>
                      <Button size="sm" action="secondary" onPress={handleAddCategory}>
                        <ButtonText>Salvar</ButtonText>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        action="secondary"
                        onPress={() => {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                        }}
                      >
                        <ButtonText>Cancelar</ButtonText>
                      </Button>
                    </HStack>
                  )}

                  <VStack space="sm">
                    <Text size="sm" className="font-semibold">Dividir com</Text>
                    <HStack space="sm" className="flex-wrap">
                      {members.map((member) => {
                        const selected = selectedMembers.includes(member.userId);
                        return (
                          <Pressable
                            key={member.id}
                            onPress={() => handleToggleMember(member.userId)}
                            className={`px-3.5 py-2 rounded-[18px] border ${
                              selected
                                ? 'bg-primary-500 border-primary-500'
                                : 'bg-background-0 border-outline-200'
                            }`}
                          >
                            <Text
                              size="xs"
                              className={`font-medium ${
                                selected ? 'text-background-0' : 'text-typography-900'
                              }`}
                            >
                              {member.user.name ?? member.user.email}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </HStack>
                  </VStack>

                  {selectedMembers.length > 0 && (
                    <VStack space="sm">
                      <HStack space="md" className="justify-between items-center mt-2">
                        <Text size="sm" className="font-semibold">Valores individuais</Text>
                        <Pressable onPress={handleDistributeEqually}>
                          <Text size="xs" className="font-semibold text-primary-500">
                            Distribuir igualmente
                          </Text>
                        </Pressable>
                      </HStack>
                      {selectedMembers.map((memberId) => {
                        const member = memberLookup.get(memberId);
                        if (!member) {
                          return null;
                        }
                        return (
                          <HStack key={memberId} space="md" className="items-center justify-between">
                            <Text size="sm" className="flex-1">
                              {member.user.name ?? member.user.email}
                            </Text>
                            <Input className="w-[120px]">
                              <InputField
                                value={shares[memberId] ?? '0'}
                                onChangeText={(value) =>
                                  setShares((prev) => ({ ...prev, [memberId]: formatNumber(value) }))
                                }
                                keyboardType="decimal-pad"
                              />
                            </Input>
                          </HStack>
                        );
                      })}
                    </VStack>
                  )}

                  <VStack space="sm">
                    <Text size="sm" className="font-semibold">Notas</Text>
                    <Textarea>
                      <TextareaInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Observações adicionais"
                        multiline
                      />
                    </Textarea>
                  </VStack>

                  <VStack space="sm">
                    <Text size="sm" className="font-semibold">Comprovante</Text>
                    {selectedImageUri ? (
                      <Box style={styles.imagePreviewContainer}>
                        <Image
                          source={{ uri: selectedImageUri }}
                          style={styles.imagePreview}
                          alt="Preview do comprovante"
                        />
                        <Pressable style={styles.removeImageButton} onPress={handleRemoveImage}>
                          <X size={20} color="#fff" />
                        </Pressable>
                      </Box>
                    ) : (
                      <HStack space="md" className="mb-2">
                        <Button
                          size="sm"
                          variant="outline"
                          action="primary"
                          onPress={handlePickImage}
                          disabled={isUploadingImage}
                          className="flex-1"
                        >
                          <ImageIcon size={20} color="#1d4ed8" />
                          <ButtonText>Escolher da galeria</ButtonText>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          action="secondary"
                          onPress={handleTakePhoto}
                          disabled={isUploadingImage}
                          className="flex-1"
                        >
                          <Camera size={20} color="#64748b" />
                          <ButtonText>Tirar foto</ButtonText>
                        </Button>
                      </HStack>
                    )}
                    {isUploadingImage && (
                      <HStack space="sm" className="items-center justify-center py-2 mb-2">
                        <Spinner size="small" color="#1d4ed8" />
                        <Text size="xs" className="text-typography-500">
                          Fazendo upload da imagem...
                        </Text>
                      </HStack>
                    )}
                    <Text size="xs" className="text-typography-400 mt-2 mb-1">
                      Ou insira uma URL manualmente
                    </Text>
                    <Input>
                      <InputField
                        value={receiptUrl}
                        onChangeText={setReceiptUrl}
                        placeholder="https://..."
                        editable={!selectedImageUri && !isUploadingImage}
                      />
                    </Input>
                  </VStack>

                  {errorMessage && (
                    <Alert action="error" variant="solid">
                      <AlertText>{errorMessage}</AlertText>
                    </Alert>
                  )}
                </VStack>
              </ScrollView>
            </ModalBody>
            <ModalFooter>
              <HStack space="md" className="w-full">
                {isEditMode && onDelete ? (
                  <Button
                    action="negative"
                    variant="outline"
                    onPress={handleDelete}
                    disabled={isDeleting || isSubmitting}
                    className="flex-1"
                  >
                    <ButtonText>{isDeleting ? 'Removendo...' : 'Excluir'}</ButtonText>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    action="secondary"
                    onPress={onClose}
                    className="flex-1"
                  >
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                )}
                <Button
                  action="primary"
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <ButtonText>
                    {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Adicionar'}
                  </ButtonText>
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </KeyboardAvoidingView>
      </Modal>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog isOpen={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg">Excluir despesa</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>Deseja realmente excluir esta despesa?</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" action="secondary" onPress={() => setShowDeleteAlert(false)}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button action="negative" onPress={confirmDelete} disabled={isDeleting}>
              <ButtonText>{isDeleting ? 'Removendo...' : 'Excluir'}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for Invalid Member Selection */}
      <AlertDialog isOpen={showInvalidMemberAlert} onClose={() => setShowInvalidMemberAlert(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg">Seleção inválida</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>A despesa deve estar associada a pelo menos um membro.</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button action="primary" onPress={() => setShowInvalidMemberAlert(false)}>
              <ButtonText>Entendi</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
  },
  dragHandle: {
    alignSelf: 'center',
    width: 60,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.textSecondary + '40',
    marginBottom: 6,
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
});

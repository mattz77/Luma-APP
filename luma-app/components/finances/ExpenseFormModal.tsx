import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Modal as RNModal,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

import type { Expense, ExpenseCategory, HouseMemberWithUser } from '@/types/models';
import { pickImageFromGallery, takePhoto, uploadImageToStorage, deleteImageFromStorage } from '@/lib/storage';

import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Image } from '@/components/ui/image';
import { Pressable } from '@/components/ui/pressable';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

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

const FieldLabel = ({ children }: { children: string }) => (
  <Text className="text-slate-500 text-xs font-bold ml-1 uppercase tracking-wider">{children}</Text>
);

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
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(0);

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
    if (visible) {
      translateY.value = 0;
    }
  }, [visible, translateY]);

  const handleCloseState = () => {
    Keyboard.dismiss();
    onClose();
  };

  const closeModal = () => {
    Keyboard.dismiss();
    handleCloseState();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;
      if (shouldClose) {
        translateY.value = withSpring(
          screenHeight,
          {
            damping: 25,
            stiffness: 200,
            mass: 0.8,
            velocity: event.velocityY / 1000,
          },
          () => {
            runOnJS(handleCloseState)();
          }
        );
      } else {
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 200,
          mass: 0.8,
          velocity: event.velocityY / 1000,
        });
      }
    });

  const modalAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const clampedY = Math.max(0, translateY.value);
    const opacity =
      clampedY > 0
        ? interpolate(clampedY, [0, 100, screenHeight], [1, 0.95, 0.8], Extrapolation.CLAMP)
        : 1;
    return {
      transform: [{ translateY: clampedY }],
      opacity,
    };
  });

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
    Haptics.selectionAsync();
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const title = isEditMode ? 'Editar despesa' : 'Nova despesa';

  return (
    <>
      <RNModal visible={visible} transparent animationType="none" onRequestClose={closeModal} statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end">
            {/* Backdrop — mesmo padrão da tela de Tarefas */}
            <Animated.View
              entering={FadeIn.duration(Platform.OS === 'ios' ? 250 : 300)}
              exiting={FadeOut.duration(150)}
              className="absolute inset-0"
            >
              <BlurView intensity={Platform.OS === 'ios' ? 20 : 30} tint="light" style={StyleSheet.absoluteFill} />
              <View className="absolute inset-0 bg-black/15" />
              <Pressable className="flex-1" onPress={closeModal} />
            </Animated.View>

            <Animated.View
              entering={FadeIn.duration(400).delay(50)}
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0)']}
                locations={[0, 0.3, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%' }}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.15)']}
                locations={[0, 0.7, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
              />
            </Animated.View>

            <GestureHandlerRootView style={{ width: '100%', zIndex: 10 }}>
              <GestureDetector gesture={panGesture}>
                <Animated.View
                  entering={SlideInDown.springify()
                    .damping(Platform.OS === 'ios' ? 18 : 20)
                    .stiffness(Platform.OS === 'ios' ? 280 : 250)
                    .mass(Platform.OS === 'ios' ? 0.8 : 1)}
                  className="bg-white rounded-t-[40px] w-full shadow-2xl"
                  style={[{ backgroundColor: '#FFFFFF', maxHeight: '92%' }, modalAnimatedStyle]}
                >
                  <View className="w-full items-center pt-2 pb-2">
                    <View className="w-12 h-1 bg-slate-200 rounded-full" />
                  </View>

                  <HStack className="justify-between items-center px-8 mb-4">
                    <Pressable onPress={Keyboard.dismiss}>
                      <Heading size="2xl" className="font-bold text-slate-900 tracking-tight">
                        {title}
                      </Heading>
                    </Pressable>
                    <Pressable
                      onPress={closeModal}
                      className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 items-center justify-center active:bg-slate-100"
                    >
                      <X size={18} color="#0f172a" />
                    </Pressable>
                  </HStack>

                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={Keyboard.dismiss}
                    contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 40 }}
                  >
                    <VStack space="lg" className="pb-8">
                      <VStack space="xs">
                        <FieldLabel>Descrição</FieldLabel>
                        <Input className="h-14 border border-slate-200 bg-white rounded-2xl">
                          <InputField
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Ex: Mercado do mês"
                            className="text-lg font-medium text-slate-900 px-3"
                            placeholderTextColor="#94a3b8"
                          />
                        </Input>
                      </VStack>

                      <HStack space="md" className="items-stretch">
                        <VStack space="xs" className="flex-[1.1]">
                          <FieldLabel>Valor (R$)</FieldLabel>
                          <Input className="h-14 border border-slate-200 bg-white rounded-2xl">
                            <InputField
                              value={amount}
                              onChangeText={(value) => setAmount(formatNumber(value))}
                              keyboardType="decimal-pad"
                              placeholder="0,00"
                              className="text-lg font-semibold text-slate-900 px-3"
                              placeholderTextColor="#94a3b8"
                            />
                          </Input>
                        </VStack>
                        <VStack space="xs" className="flex-1">
                          <FieldLabel>Data</FieldLabel>
                          <Input className="h-14 border border-slate-200 bg-white rounded-2xl">
                            <InputField
                              value={expenseDate}
                              onChangeText={setExpenseDate}
                              placeholder="AAAA-MM-DD"
                              className="text-base font-medium text-slate-900 px-3"
                              placeholderTextColor="#94a3b8"
                            />
                          </Input>
                        </VStack>
                      </HStack>

                      <HStack className="items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5">
                        <Text className="text-slate-900 font-bold text-sm">Marcar como pago</Text>
                        <Switch value={isPaid} onValueChange={setIsPaid} />
                      </HStack>

                      <VStack space="xs">
                        <FieldLabel>Categoria</FieldLabel>
                        <HStack space="sm" className="flex-wrap">
                          {categories.map((category) => {
                            const selected = category.id === categoryId;
                            return (
                              <Pressable
                                key={category.id}
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  setCategoryId(category.id);
                                }}
                                className={`px-4 py-2.5 rounded-xl border ${
                                  selected
                                    ? 'bg-[#FDE047] border-[#FDE047]'
                                    : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-bold ${selected ? 'text-slate-900' : 'text-slate-500'}`}
                                >
                                  {category.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                          <Pressable
                            onPress={() => {
                              Haptics.selectionAsync();
                              setIsAddingCategory(true);
                            }}
                            className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-white items-center justify-center"
                          >
                            <Text className="text-xs font-bold text-slate-500">+ Nova</Text>
                          </Pressable>
                        </HStack>
                      </VStack>

                      {isAddingCategory && (
                        <VStack space="xs">
                          <FieldLabel>Nome da categoria</FieldLabel>
                          <HStack space="sm" className="items-center">
                            <Input className="flex-1 h-12 border border-slate-200 bg-white rounded-2xl">
                              <InputField
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                placeholder="Ex: Alimentação"
                                className="text-slate-900 px-3"
                                placeholderTextColor="#94a3b8"
                              />
                            </Input>
                            <Pressable
                              onPress={handleAddCategory}
                              className="bg-[#FDE047] px-4 h-12 rounded-2xl items-center justify-center border border-yellow-200"
                            >
                              <Text className="text-slate-900 font-bold text-sm">Salvar</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setIsAddingCategory(false);
                                setNewCategoryName('');
                              }}
                              className="px-3 h-12 rounded-2xl items-center justify-center border border-slate-200 bg-white"
                            >
                              <Text className="text-slate-500 font-bold text-sm">✕</Text>
                            </Pressable>
                          </HStack>
                        </VStack>
                      )}

                      <VStack space="xs">
                        <FieldLabel>Dividir com</FieldLabel>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ gap: 8 }}
                        >
                          {members.map((member) => {
                            const selected = selectedMembers.includes(member.userId);
                            return (
                              <Pressable
                                key={member.id}
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  handleToggleMember(member.userId);
                                }}
                                className={`px-4 py-2.5 rounded-xl border ${
                                  selected
                                    ? 'bg-[#FDE047] border-[#FDE047]'
                                    : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-bold ${selected ? 'text-slate-900' : 'text-slate-500'}`}
                                >
                                  {member.user.name ?? member.user.email}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </VStack>

                      {selectedMembers.length > 0 && (
                        <VStack space="sm">
                          <HStack className="justify-between items-center">
                            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                              Valores individuais
                            </Text>
                            <Pressable onPress={handleDistributeEqually}>
                              <Text className="text-xs font-bold text-yellow-600">Distribuir igualmente</Text>
                            </Pressable>
                          </HStack>
                          {selectedMembers.map((memberId) => {
                            const member = memberLookup.get(memberId);
                            if (!member) return null;
                            return (
                              <HStack
                                key={memberId}
                                className="items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3"
                              >
                                <Text className="text-slate-900 font-medium flex-1" numberOfLines={1}>
                                  {member.user.name ?? member.user.email}
                                </Text>
                                <Input className="w-[110px] h-11 border border-slate-200 bg-white rounded-xl">
                                  <InputField
                                    value={shares[memberId] ?? '0'}
                                    onChangeText={(value) =>
                                      setShares((prev) => ({ ...prev, [memberId]: formatNumber(value) }))
                                    }
                                    keyboardType="decimal-pad"
                                    className="text-right font-semibold text-slate-900 px-2"
                                  />
                                </Input>
                              </HStack>
                            );
                          })}
                        </VStack>
                      )}

                      <VStack space="xs">
                        <FieldLabel>Notas</FieldLabel>
                        <Textarea className="border border-slate-200 bg-white rounded-2xl min-h-[100px]">
                          <TextareaInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Observações adicionais"
                            multiline
                            textAlignVertical="top"
                            className="py-3 px-3 text-sm text-slate-900 leading-5"
                            placeholderTextColor="#94a3b8"
                          />
                        </Textarea>
                      </VStack>

                      <VStack space="xs">
                        <FieldLabel>Comprovante</FieldLabel>
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
                          <HStack space="md">
                            <Pressable
                              onPress={handlePickImage}
                              disabled={isUploadingImage}
                              className="flex-1 flex-row items-center justify-center gap-2 h-12 border border-slate-200 bg-white rounded-2xl active:bg-slate-50"
                            >
                              <ImageIcon size={18} color="#0f172a" />
                              <Text className="text-slate-900 font-bold text-sm">Galeria</Text>
                            </Pressable>
                            <Pressable
                              onPress={handleTakePhoto}
                              disabled={isUploadingImage}
                              className="flex-1 flex-row items-center justify-center gap-2 h-12 border border-slate-200 bg-slate-50 rounded-2xl active:bg-slate-100"
                            >
                              <Camera size={18} color="#0f172a" />
                              <Text className="text-slate-900 font-bold text-sm">Câmera</Text>
                            </Pressable>
                          </HStack>
                        )}
                        {isUploadingImage && (
                          <HStack space="sm" className="items-center justify-center py-2">
                            <Spinner size="small" color="#ca8a04" />
                            <Text className="text-xs text-slate-500">Enviando imagem...</Text>
                          </HStack>
                        )}
                        <Text className="text-xs text-slate-400 mt-1">Ou cole a URL do arquivo</Text>
                        <Input className="h-12 border border-slate-200 bg-white rounded-2xl">
                          <InputField
                            value={receiptUrl}
                            onChangeText={setReceiptUrl}
                            placeholder="https://..."
                            editable={!selectedImageUri && !isUploadingImage}
                            className="text-sm text-slate-900 px-3"
                            placeholderTextColor="#94a3b8"
                          />
                        </Input>
                      </VStack>

                      {errorMessage && (
                        <Box className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                          <Text className="text-red-700 text-sm font-medium">{errorMessage}</Text>
                        </Box>
                      )}

                      <HStack space="md" className="mt-4 mb-24">
                        {isEditMode && onDelete ? (
                          <Pressable
                            onPress={handleDelete}
                            disabled={isDeleting || isSubmitting}
                            className="flex-1 h-14 rounded-[24px] border-2 border-red-200 bg-white items-center justify-center active:opacity-80"
                          >
                            <Text className="text-red-600 font-bold">
                              {isDeleting ? 'Removendo...' : 'Excluir'}
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={closeModal}
                            className="flex-1 h-14 rounded-[24px] border border-slate-200 bg-white items-center justify-center active:bg-slate-50"
                          >
                            <Text className="text-slate-900 font-bold">Cancelar</Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={handleSubmit}
                          disabled={isSubmitting || isUploadingImage}
                          className="flex-1 h-14 rounded-[24px] bg-[#FDE047] border border-yellow-200 items-center justify-center shadow-lg shadow-yellow-200 active:scale-[0.98] opacity-100 disabled:opacity-60"
                        >
                          <Text className="text-slate-900 font-bold text-base">
                            {isSubmitting
                              ? 'Salvando...'
                              : isEditMode
                                ? 'Salvar'
                                : 'Adicionar despesa'}
                          </Text>
                        </Pressable>
                      </HStack>
                    </VStack>
                  </ScrollView>
                </Animated.View>
              </GestureDetector>
            </GestureHandlerRootView>
          </View>
        </KeyboardAvoidingView>
      </RNModal>

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
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 16,
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

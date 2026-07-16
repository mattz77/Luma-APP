import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Modal as RNModal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Coins, Image as ImageIcon, Plus, Tag, X } from 'lucide-react-native';

import type { Expense, ExpenseCategory, HouseMemberWithUser } from '@/types/models';
import { pickImageFromGallery, takePhoto, uploadImageToStorage, deleteImageFromStorage } from '@/lib/storage';
import { isValidIsoYmd, localIsoDateToday } from '@/lib/dateLocale';
import { useBottomSheetBackdropFadeStyle } from '@/lib/useBottomSheetBackdropFadeStyle';
import { DatePickerBrazilianField } from '@/components/forms/DatePickerBrazilianField';
import {
  centsDigitsToDisplay,
  centsDigitsToReais,
  parseMoneyInputToCentsDigits,
} from '@/lib/moneyInputBrl';
import { LumaModalOverlay } from '@/components/ui/luma-modal-overlay';

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
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
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
  /** Quando definido (ex.: Finanças + `AnimatedDateStrip`), o gesto do sheet usa este `SharedValue`. */
  sheetTranslateY?: SharedValue<number>;
}

/** Mesmo fluxo do limite mensal (`BudgetLimitModal`): dígitos + máscara BRL na camada visual. */
function BrlCentOverlayInput(props: {
  centsDigits: string;
  onChangeCentsDigits: (text: string, prev: string) => void;
  minHeight: number;
  fontSize: number;
  roundedClassName: string;
  textAlign: 'left' | 'right' | 'center';
  accessibilityLabel: string;
  editable?: boolean;
  /** Ícone de moedas à esquerda (campo valor total no modal de despesa). */
  showCoinsIcon?: boolean;
  /** Fundo suave como no redesign (#F1EEE6). */
  softSurface?: boolean;
}) {
  const {
    centsDigits,
    onChangeCentsDigits,
    minHeight,
    fontSize,
    roundedClassName,
    textAlign,
    accessibilityLabel,
    editable = true,
    showCoinsIcon = false,
    softSurface = false,
  } = props;
  const display = centsDigitsToDisplay(centsDigits) || 'R$ 0,00';
  const padLeft = showCoinsIcon ? 44 : 12;
  const padRight = 12;
  const surfaceClass = softSurface
    ? 'border border-[#EAE6DC]/80 bg-[#F1EEE6]'
    : 'border border-[#EAE6DC] bg-white';

  return (
    <View
      className={`overflow-hidden relative w-full ${roundedClassName} ${surfaceClass}`}
      style={{ minHeight }}
    >
      {showCoinsIcon ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 12,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Coins size={22} color="#6F6A7A" />
        </View>
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { justifyContent: 'center', paddingLeft: padLeft, paddingRight: padRight },
        ]}
      >
        <Text
          className="font-semibold text-[#1B1725]"
          style={{ fontSize, width: '100%', textAlign }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {display}
        </Text>
      </View>
      <TextInput
        value={centsDigits}
        onChangeText={(text) => onChangeCentsDigits(text, centsDigits)}
        keyboardType="decimal-pad"
        editable={editable}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={accessibilityLabel}
        style={{
          minHeight,
          width: '100%',
          opacity: 0.04,
          fontSize,
          textAlign,
          color: '#1B1725',
          paddingLeft: padLeft,
          paddingRight: padRight,
        }}
      />
    </View>
  );
}

const FieldLabel = ({ children }: { children: string }) => (
  <Text className="text-[#6F6A7A] text-xs font-bold ml-1 uppercase tracking-wider">{children}</Text>
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
  sheetTranslateY,
}: ExpenseFormModalProps) {
  const { width: windowWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const internalTranslateY = useSharedValue(0);
  const translateY = sheetTranslateY ?? internalTranslateY;

  /** Card flutuante: largura explícita + centralização (evita `w-full` + marginHorizontal assimétrico no Yoga). */
  const SHEET_SIDE_GUTTER = 16;
  const sheetOuterStyle = useMemo(
    () => ({
      width: Math.max(0, windowWidth - SHEET_SIDE_GUTTER * 2),
      alignSelf: 'center' as const,
      marginBottom: Math.max(insets.bottom, 16) + 16,
      maxHeight: screenHeight * 0.88,
      flexDirection: 'column' as const,
      backgroundColor: '#FFFFFF',
      borderRadius: 40,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 14,
    }),
    [windowWidth, screenHeight, insets.bottom]
  );

  /** Folga para alça + título + margens; `ScrollView` com `maxHeight` explícito no iOS. */
  const sheetScrollMaxHeight = useMemo(() => {
    const bottomReserve = Math.max(insets.bottom, 16) + 16 + 24;
    const sheetCap = screenHeight * 0.88;
    const headerReserve = 180;
    return Math.max(240, sheetCap - headerReserve - bottomReserve);
  }, [screenHeight, insets.bottom]);

  /** Preenche o overlay para justifyContent flex-end ancorar o sheet na base */
  const sheetWrapperStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      justifyContent: 'flex-end' as const,
      alignItems: 'stretch' as const,
    }),
    []
  );

  const overlayRootStyle = useMemo(
    () => ({
      flex: 1,
      width: '100%' as const,
      ...(Platform.OS === 'web' ? { minHeight: screenHeight } : {}),
    }),
    [screenHeight]
  );

  const [description, setDescription] = useState('');
  const [amountCentsDigits, setAmountCentsDigits] = useState('');
  const [expenseDateIso, setExpenseDateIso] = useState(localIsoDateToday());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  /** Base64 do picker (RN: fetch(uri) no upload pode enviar arquivo vazio) */
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [shareCentsDigits, setShareCentsDigits] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showInvalidMemberAlert, setShowInvalidMemberAlert] = useState(false);
  const [showSplitMemberPicker, setShowSplitMemberPicker] = useState(false);

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

  const backdropFadeStyle = useBottomSheetBackdropFadeStyle(translateY, screenHeight);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEditMode && initialExpense) {
      setDescription(initialExpense.description);
      const amt = Number(initialExpense.amount);
      setAmountCentsDigits(
        Number.isFinite(amt) && amt > 0 ? String(Math.round(amt * 100)) : ''
      );
      setExpenseDateIso(initialExpense.expenseDate.trim().slice(0, 10));
      setCategoryId(initialExpense.categoryId);
      setIsPaid(initialExpense.isPaid);
      setNotes(initialExpense.notes ?? '');
      setSelectedImageUri(initialExpense.receiptUrl ?? null);
      setSelectedImageBase64(null);
      setSelectedImageMime(null);

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
          const v = Number(split.amount);
          shareMap[split.userId] =
            Number.isFinite(v) && v > 0 ? String(Math.round(v * 100)) : '';
        });
        setShareCentsDigits(shareMap);
      } else {
        setShareCentsDigits(
          createEqualShareCentsMap(
            memberIds,
            Number.isFinite(amt) && amt > 0 ? String(Math.round(amt * 100)) : ''
          )
        );
      }
    } else {
      setDescription('');
      setAmountCentsDigits('');
      setExpenseDateIso(localIsoDateToday());
      setCategoryId(categories[0]?.id ?? null);
      setIsPaid(false);
      setNotes('');
      setSelectedImageUri(null);
      setSelectedImageBase64(null);
      setSelectedImageMime(null);
      const defaultMembers = currentUserId ? [currentUserId] : [];
      setSelectedMembers(defaultMembers);
      setShareCentsDigits(createEqualShareCentsMap(defaultMembers, ''));
    }
    setErrorMessage(null);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setShowSplitMemberPicker(false);
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
        setShareCentsDigits((prevShares) => {
          const newShares = { ...prevShares };
          delete newShares[memberId];
          return newShares;
        });
        return updatedMembers;
      }
      const updatedMembers = [...prev, memberId];
      const distributed = createEqualShareCentsMap(updatedMembers, amountCentsDigits);
      setShareCentsDigits(distributed);
      return updatedMembers;
    });
  };

  const handleDistributeEqually = () => {
    if (!selectedMembers.length) {
      return;
    }
    Haptics.selectionAsync();
    const distributed = createEqualShareCentsMap(selectedMembers, amountCentsDigits);
    setShareCentsDigits(distributed);
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
        const a = result.assets[0];
        setSelectedImageUri(a.uri);
        setSelectedImageBase64(a.base64 ?? null);
        setSelectedImageMime(a.mimeType ?? null);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto();
      if (!result.canceled && result.assets && result.assets[0]) {
        const a = result.assets[0];
        setSelectedImageUri(a.uri);
        setSelectedImageBase64(a.base64 ?? null);
        setSelectedImageMime(a.mimeType ?? null);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleRemoveImage = async () => {
    if (selectedImageUri?.startsWith('http')) {
      try {
        await deleteImageFromStorage(selectedImageUri);
      } catch (error) {
        console.error('Erro ao deletar imagem:', error);
      }
    }
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setSelectedImageMime(null);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    const parsedAmount = centsDigitsToReais(amountCentsDigits);
    if (!description.trim()) {
      setErrorMessage('Descreva a despesa.');
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Informe um valor válido.');
      return;
    }
    if (!isValidIsoYmd(expenseDateIso)) {
      setErrorMessage('Informe uma data válida.');
      return;
    }
    if (!selectedMembers.length) {
      setErrorMessage('Selecione ao menos um membro para dividir a despesa.');
      return;
    }

    const totalCents = amountCentsDigits ? parseInt(amountCentsDigits, 10) : 0;
    let sumShareCents = 0;
    for (const memberId of selectedMembers) {
      const d = shareCentsDigits[memberId] ?? '';
      const c = d ? parseInt(d, 10) : 0;
      sumShareCents += Number.isFinite(c) ? c : 0;
    }
    if (sumShareCents !== totalCents) {
      setErrorMessage('A soma das cotas deve ser igual ao valor total da despesa.');
      return;
    }

    const normalizedSplits: MemberShare[] = selectedMembers.map((memberId) => {
      const digits = shareCentsDigits[memberId] ?? '';
      const reais = centsDigitsToReais(digits);
      const safe = Number.isNaN(reais) ? 0 : reais;
      return {
        userId: memberId,
        amount: Number(safe.toFixed(2)),
        isPaid,
      };
    });

    try {
      let finalReceiptUrl: string | null = null;

      if (selectedImageUri) {
        if (selectedImageUri.startsWith('http')) {
          finalReceiptUrl = selectedImageUri;
        } else {
          setIsUploadingImage(true);
          const uploadResult = await uploadImageToStorage(selectedImageUri, 'receipts', 'expenses', {
            base64: selectedImageBase64,
            mimeType: selectedImageMime,
          });
          setIsUploadingImage(false);

          if (uploadResult.error) {
            setErrorMessage(`Erro ao fazer upload da imagem: ${uploadResult.error}`);
            return;
          }

          if (uploadResult.url) {
            finalReceiptUrl = uploadResult.url;
          }
        }
      }

      await onSubmit({
        description: description.trim(),
        amount: Number(parsedAmount.toFixed(2)),
        expenseDate: expenseDateIso,
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
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end" style={overlayRootStyle}>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, backdropFadeStyle]}
              pointerEvents="box-none"
            >
              <LumaModalOverlay onRequestClose={closeModal} />
            </Animated.View>

            <GestureHandlerRootView style={sheetWrapperStyle}>
              <Animated.View
                entering={SlideInDown.springify()
                  .damping(Platform.OS === 'ios' ? 22 : 24)
                  .stiffness(Platform.OS === 'ios' ? 340 : 300)
                  .mass(Platform.OS === 'ios' ? 0.75 : 0.85)}
                className="shadow-2xl"
                style={[sheetOuterStyle, modalAnimatedStyle]}
              >
                <GestureDetector gesture={panGesture}>
                  <View
                    className="w-full items-center pt-2 pb-2"
                    accessibilityRole="button"
                    accessibilityLabel="Arrastar para fechar"
                  >
                    <View className="w-12 h-1 bg-[#EAE6DC] rounded-full" />
                  </View>
                </GestureDetector>

                <HStack className="justify-between items-center px-6 mb-3">
                    <Pressable onPress={Keyboard.dismiss}>
                      <Heading size="2xl" className="font-bold text-[#1B1725] tracking-tight">
                        {title}
                      </Heading>
                    </Pressable>
                    <Pressable
                      onPress={closeModal}
                      className="w-10 h-10 rounded-full bg-[#F1EEE6] border border-[#EAE6DC] items-center justify-center active:bg-[#F1EEE6]"
                    >
                      <X size={18} color="#1B1725" />
                    </Pressable>
                  </HStack>

                  <ScrollView
                    style={{ maxHeight: sheetScrollMaxHeight }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={Keyboard.dismiss}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
                  >
                    <VStack space="lg" className="pb-8">
                      <VStack space="xs">
                        <FieldLabel>Descrição</FieldLabel>
                        <Input className="h-14 border-0 bg-[#F1EEE6] rounded-2xl">
                          <InputField
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Ex: Mercado do mês"
                            className="text-lg font-medium text-[#1B1725] px-4"
                            placeholderTextColor="#A5A0AE"
                          />
                        </Input>
                      </VStack>

                      <HStack space="md" className="items-stretch">
                        <VStack space="xs" className="flex-[1.1]">
                          <FieldLabel>Valor (R$)</FieldLabel>
                          <BrlCentOverlayInput
                            centsDigits={amountCentsDigits}
                            onChangeCentsDigits={(text, prev) => {
                              setAmountCentsDigits(parseMoneyInputToCentsDigits(text, prev));
                              setErrorMessage(null);
                            }}
                            minHeight={56}
                            fontSize={18}
                            roundedClassName="rounded-2xl"
                            textAlign="center"
                            accessibilityLabel="Valor da despesa em reais"
                            editable={!isSubmitting}
                            showCoinsIcon
                            softSurface
                          />
                        </VStack>
                        <VStack space="xs" className="flex-1">
                          <FieldLabel>Data</FieldLabel>
                          <DatePickerBrazilianField
                            testID="expense-date"
                            valueIso={expenseDateIso}
                            onChangeIso={setExpenseDateIso}
                            placeholder="DD/MM/AAAA"
                            accessibilityLabel="Data da despesa, abrir calendário"
                            tone="soft"
                          />
                        </VStack>
                      </HStack>

                      <HStack className="items-center justify-between bg-[#F1EEE6] rounded-full px-4 py-3.5">
                        <Text className="text-[#1B1725] font-bold text-sm">Marcar como pago</Text>
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
                                className={`px-4 py-2.5 rounded-full border ${
                                  selected
                                    ? 'bg-[#F6B51E] border-[#F6B51E]'
                                    : 'bg-[#F1EEE6] border-transparent'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-bold ${selected ? 'text-[#1B1725]' : 'text-[#6F6A7A]'}`}
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
                            className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#F1EEE6] border border-[#EAE6DC]/80"
                          >
                            <Tag size={14} color="#6F6A7A" />
                            <Text className="text-xs font-bold text-[#6F6A7A]">+ Nova</Text>
                          </Pressable>
                        </HStack>
                      </VStack>

                      {isAddingCategory && (
                        <VStack space="xs">
                          <FieldLabel>Nome da categoria</FieldLabel>
                          <HStack space="sm" className="items-center">
                            <Input className="flex-1 h-12 border border-[#EAE6DC] bg-white rounded-2xl">
                              <InputField
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                placeholder="Ex: Alimentação"
                                className="text-[#1B1725] px-3"
                                placeholderTextColor="#A5A0AE"
                              />
                            </Input>
                            <Pressable
                              onPress={handleAddCategory}
                              className="bg-[#F6B51E] px-4 h-12 rounded-2xl items-center justify-center border border-yellow-200"
                            >
                              <Text className="text-[#1B1725] font-bold text-sm">Salvar</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setIsAddingCategory(false);
                                setNewCategoryName('');
                              }}
                              className="px-3 h-12 rounded-2xl items-center justify-center border border-[#EAE6DC] bg-white"
                            >
                              <Text className="text-[#6F6A7A] font-bold text-sm">✕</Text>
                            </Pressable>
                          </HStack>
                        </VStack>
                      )}

                      <VStack space="xs">
                        <FieldLabel>Dividir com</FieldLabel>
                        <HStack space="sm" className="items-center flex-wrap">
                          <Pressable
                            onPress={() => {
                              void Haptics.selectionAsync();
                              setShowSplitMemberPicker((v) => !v);
                            }}
                            accessibilityLabel="Adicionar pessoa à divisão"
                            className="w-11 h-11 rounded-full bg-white border-2 border-dashed border-[#EAE6DC] items-center justify-center active:border-[#F6B51E] active:bg-[#F6B51E]/15"
                          >
                            <Plus size={20} color="#6F6A7A" />
                          </Pressable>
                          <ScrollView
                            horizontal
                            nestedScrollEnabled={Platform.OS === 'android'}
                            showsHorizontalScrollIndicator={false}
                            className="flex-1 min-w-0"
                            contentContainerStyle={{ gap: 8, alignItems: 'center', paddingVertical: 2 }}
                          >
                            {selectedMembers.map((memberId) => {
                              const member = memberLookup.get(memberId);
                              if (!member) return null;
                              const label = member.user.name ?? member.user.email ?? 'Membro';
                              return (
                                <Pressable
                                  key={memberId}
                                  onPress={() => {
                                    void Haptics.selectionAsync();
                                    handleToggleMember(memberId);
                                  }}
                                  className="flex-row items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-[#F6B51E] border border-yellow-300/80"
                                >
                                  <Avatar size="sm" className="border-2 border-white">
                                    <AvatarFallbackText>{label.charAt(0)}</AvatarFallbackText>
                                    {member.user.avatarUrl ? (
                                      <AvatarImage source={{ uri: member.user.avatarUrl }} />
                                    ) : null}
                                  </Avatar>
                                  <Text className="text-xs font-bold text-[#1B1725]" numberOfLines={1}>
                                    {label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                        </HStack>
                        {showSplitMemberPicker ? (
                          <ScrollView
                            horizontal
                            nestedScrollEnabled={Platform.OS === 'android'}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingTop: 4 }}
                          >
                            {members
                              .filter((m) => !selectedMembers.includes(m.userId))
                              .map((member) => {
                                const label = member.user.name ?? member.user.email ?? 'Membro';
                                return (
                                  <Pressable
                                    key={member.id}
                                    onPress={() => {
                                      void Haptics.selectionAsync();
                                      handleToggleMember(member.userId);
                                      setShowSplitMemberPicker(false);
                                    }}
                                    className="px-4 py-2.5 rounded-full bg-[#F1EEE6] border border-[#EAE6DC]/80"
                                  >
                                    <Text className="text-xs font-bold text-[#6F6A7A]" numberOfLines={1}>
                                      + {label}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                          </ScrollView>
                        ) : null}
                      </VStack>

                      {selectedMembers.length > 0 && (
                        <VStack space="sm">
                          <HStack className="justify-between items-center">
                            <Text className="text-[#6F6A7A] text-xs font-bold uppercase tracking-wider">
                              Valores individuais
                            </Text>
                            <Pressable onPress={handleDistributeEqually}>
                              <Text className="text-xs font-bold text-[#1B1725]">Distribuir igualmente</Text>
                            </Pressable>
                          </HStack>
                          <VStack space="sm" className="bg-[#F1EEE6] rounded-2xl p-3">
                          {selectedMembers.map((memberId) => {
                            const member = memberLookup.get(memberId);
                            if (!member) return null;
                            return (
                              <HStack
                                key={memberId}
                                className="items-center justify-between bg-white/90 border border-[#EAE6DC]/60 rounded-xl px-3 py-2.5"
                              >
                                <HStack space="sm" className="items-center flex-1 min-w-0">
                                  <Avatar size="sm" className="border border-[#EAE6DC]">
                                    <AvatarFallbackText>
                                      {(member.user.name ?? member.user.email ?? 'M').charAt(0)}
                                    </AvatarFallbackText>
                                    {member.user.avatarUrl ? (
                                      <AvatarImage source={{ uri: member.user.avatarUrl }} />
                                    ) : null}
                                  </Avatar>
                                  <Text className="text-[#1B1725] font-medium flex-1" numberOfLines={1}>
                                    {member.user.name ?? member.user.email}
                                  </Text>
                                </HStack>
                                <View className="w-[110px]">
                                  <BrlCentOverlayInput
                                    centsDigits={shareCentsDigits[memberId] ?? ''}
                                    onChangeCentsDigits={(text, prev) => {
                                      setShareCentsDigits((p) => ({
                                        ...p,
                                        [memberId]: parseMoneyInputToCentsDigits(text, prev),
                                      }));
                                      setErrorMessage(null);
                                    }}
                                    minHeight={44}
                                    fontSize={15}
                                    roundedClassName="rounded-xl"
                                    textAlign="right"
                                    accessibilityLabel={`Cota em reais de ${member.user.name ?? member.user.email ?? 'membro'}`}
                                    editable={!isSubmitting}
                                    softSurface
                                  />
                                </View>
                              </HStack>
                            );
                          })}
                          </VStack>
                        </VStack>
                      )}

                      <VStack space="xs">
                        <FieldLabel>Notas</FieldLabel>
                        <Textarea className="border-0 bg-[#F1EEE6] rounded-2xl min-h-[100px]">
                          <TextareaInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Observações adicionais"
                            multiline
                            textAlignVertical="top"
                            className="py-3 px-4 text-sm text-[#1B1725] leading-5"
                            placeholderTextColor="#A5A0AE"
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
                              className="flex-1 flex-row items-center justify-center gap-2 h-12 bg-[#F1EEE6] rounded-2xl active:opacity-90"
                            >
                              <ImageIcon size={18} color="#1B1725" />
                              <Text className="text-[#1B1725] font-bold text-sm">Galeria</Text>
                            </Pressable>
                            <Pressable
                              onPress={handleTakePhoto}
                              disabled={isUploadingImage}
                              className="flex-1 flex-row items-center justify-center gap-2 h-12 bg-[#F1EEE6] rounded-2xl active:opacity-90"
                            >
                              <Camera size={18} color="#1B1725" />
                              <Text className="text-[#1B1725] font-bold text-sm">Câmera</Text>
                            </Pressable>
                          </HStack>
                        )}
                        {isUploadingImage && (
                          <HStack space="sm" className="items-center justify-center py-2">
                            <Spinner size="small" color="#E3A410" />
                            <Text className="text-xs text-[#6F6A7A]">Enviando imagem...</Text>
                          </HStack>
                        )}
                      </VStack>

                      {errorMessage && (
                        <Box className="bg-[#FBE7E7] border border-red-100 rounded-2xl px-4 py-3">
                          <Text className="text-red-700 text-sm font-medium">{errorMessage}</Text>
                        </Box>
                      )}

                      <HStack space="md" className="mt-4 mb-8">
                        {isEditMode && onDelete ? (
                          <Pressable
                            onPress={handleDelete}
                            disabled={isDeleting || isSubmitting}
                            className="flex-1 h-14 rounded-[24px] border-2 border-red-200 bg-white items-center justify-center active:opacity-80"
                          >
                            <Text className="text-[#D64545] font-bold">
                              {isDeleting ? 'Removendo...' : 'Excluir'}
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={closeModal}
                            className="flex-1 h-14 rounded-[24px] bg-[#E8EDF2] items-center justify-center active:opacity-90"
                          >
                            <Text className="text-[#1B1725] font-bold">Cancelar</Text>
                          </Pressable>
                        )}
                        <Pressable
                          testID="expense-submit"
                          onPress={handleSubmit}
                          disabled={isSubmitting || isUploadingImage}
                          className="flex-1 rounded-[24px] overflow-hidden opacity-100 disabled:opacity-60 active:scale-[0.98]"
                          style={{
                            height: 56,
                            shadowColor: '#b45309',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.25,
                            shadowRadius: 10,
                            elevation: 8,
                          }}
                        >
                          <LinearGradient
                            colors={['#FBEED0', '#E3A410', '#E3A410']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              height: 56,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 12,
                            }}
                          >
                            <Text className="text-white font-bold text-base">
                              {isSubmitting
                                ? 'Salvando...'
                                : isEditMode
                                  ? 'Salvar'
                                  : 'Adicionar despesa'}
                            </Text>
                          </LinearGradient>
                        </Pressable>
                      </HStack>
                    </VStack>
                  </ScrollView>
              </Animated.View>
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

/** Cotas em dígitos de centavos (mesmo contrato que `parseMoneyInputToCentsDigits`). */
function createEqualShareCentsMap(memberIds: string[], amountCentsDigits: string) {
  const totalCents = amountCentsDigits ? parseInt(amountCentsDigits, 10) : 0;
  if (!memberIds.length || !Number.isFinite(totalCents) || totalCents <= 0) {
    return memberIds.reduce<Record<string, string>>((acc, id) => {
      acc[id] = '';
      return acc;
    }, {});
  }
  const n = memberIds.length;
  const base = Math.floor(totalCents / n);
  return memberIds.reduce<Record<string, string>>((acc, id, index) => {
    if (index === n - 1) {
      const assigned = base * (n - 1);
      acc[id] = String(Math.max(0, totalCents - assigned));
    } else {
      acc[id] = String(base);
    }
    return acc;
  }, {});
}

const styles = StyleSheet.create({
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAE6DC',
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

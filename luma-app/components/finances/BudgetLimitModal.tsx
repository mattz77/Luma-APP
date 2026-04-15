import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Save, X } from 'lucide-react-native';

import {
  centsDigitsToDisplay,
  centsDigitsToReais,
  parseMoneyInputToCentsDigits,
} from '@/lib/moneyInputBrl';
import { LumaModalOverlay } from '@/components/ui/luma-modal-overlay';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Spinner } from '@/components/ui/spinner';

export interface BudgetLimitModalProps {
  visible: boolean;
  initialCentsDigits: string;
  onClose: () => void;
  onSubmit: (amountReais: number) => Promise<void>;
  isSubmitting: boolean;
}

export function BudgetLimitModal({
  visible,
  initialCentsDigits,
  onClose,
  onSubmit,
  isSubmitting,
}: BudgetLimitModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [draftCentsDigits, setDraftCentsDigits] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  /** Espaço extra no rodapé do ScrollView quando o teclado está visível (iOS). */
  const [iosKeyboardInset, setIosKeyboardInset] = useState(0);

  const sheetOuterStyle = useMemo(
    () => ({
      width: '100%' as const,
      maxHeight: screenHeight * 0.88,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      paddingBottom: Math.max(insets.bottom, 12),
      overflow: 'hidden' as const,
    }),
    [screenHeight, insets.bottom]
  );

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

  useEffect(() => {
    if (visible) {
      setDraftCentsDigits(initialCentsDigits);
      setLocalError(null);
      Haptics.selectionAsync();
      // iOS: não focar ao abrir — o teclado cobre o campo no sheet + Modal (alinhado ao ExpenseFormModal).
      if (Platform.OS !== 'ios') {
        const t = setTimeout(() => inputRef.current?.focus(), 350);
        return () => clearTimeout(t);
      }
    }
    return undefined;
  }, [visible, initialCentsDigits]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      setIosKeyboardInset(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setIosKeyboardInset(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setIosKeyboardInset(0);
    }
  }, [visible]);

  const displayValue = useMemo(() => centsDigitsToDisplay(draftCentsDigits), [draftCentsDigits]);

  const closeModal = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = async () => {
    const amount = centsDigitsToReais(draftCentsDigits);
    if (Number.isNaN(amount) || amount <= 0) {
      setLocalError('Informe um valor maior que zero.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLocalError(null);
    try {
      await onSubmit(amount);
    } catch (error) {
      setLocalError((error as Error).message ?? 'Não foi possível salvar.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={closeModal} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end" style={overlayRootStyle}>
          <LumaModalOverlay onRequestClose={closeModal} />

          <GestureHandlerRootView style={sheetWrapperStyle}>
            <Animated.View
              entering={SlideInDown.springify()
                .damping(Platform.OS === 'ios' ? 22 : 24)
                .stiffness(Platform.OS === 'ios' ? 340 : 300)
                .mass(Platform.OS === 'ios' ? 0.75 : 0.85)}
              className="w-full shadow-2xl"
              style={sheetOuterStyle}
            >
              <View className="w-full items-center pt-2 pb-2">
                <View className="w-12 h-1 bg-slate-200 rounded-full" />
              </View>

              <HStack className="justify-between items-center px-8 mb-2">
                <Heading size="2xl" className="font-bold text-slate-900 tracking-tight flex-1 pr-2">
                  Limite mensal
                </Heading>
                <Pressable
                  onPress={closeModal}
                  className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 items-center justify-center active:bg-slate-100"
                  accessibilityLabel="Fechar"
                >
                  <X size={18} color="#0f172a" />
                </Pressable>
              </HStack>

              <Text className="text-sm text-slate-500 px-8 mb-4">
                Os números entram da direita para a esquerda (como em caixa eletrônico): apagar remove o último
                dígito. Use o teclado numérico.
              </Text>

              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 32,
                  paddingBottom: 24 + (Platform.OS === 'ios' ? iosKeyboardInset : 0),
                }}
              >
                <VStack space="md" className="pb-4">
                  <VStack space="xs">
                    <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">
                      Valor do limite
                    </Text>
                    <View className="min-h-[80px] border border-slate-200 bg-slate-50 rounded-3xl overflow-hidden relative">
                      <View
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFillObject, styles.valueOverlay]}
                      >
                        <Text
                          className="text-3xl font-semibold text-slate-900 text-center px-3"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.65}
                        >
                          {displayValue || 'R$ 0,00'}
                        </Text>
                      </View>
                      <TextInput
                        ref={inputRef}
                        value={draftCentsDigits}
                        onChangeText={(text) => {
                          setDraftCentsDigits((prev) => parseMoneyInputToCentsDigits(text, prev));
                          setLocalError(null);
                        }}
                        onFocus={() => {
                          if (Platform.OS === 'ios') {
                            setTimeout(() => {
                              scrollRef.current?.scrollToEnd({ animated: true });
                            }, 120);
                          }
                        }}
                        keyboardType="decimal-pad"
                        editable={!isSubmitting}
                        autoCorrect={false}
                        autoCapitalize="none"
                        accessibilityLabel="Valor do limite em reais"
                        style={styles.digitInputOverlay}
                      />
                    </View>
                  </VStack>

                  {localError ? (
                    <Text className="text-sm text-red-600 text-center px-1">{localError}</Text>
                  ) : null}

                  <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={`bg-[#FDE047] h-14 rounded-[24px] flex-row items-center justify-center gap-2 shadow-lg shadow-yellow-200 active:scale-[0.98] mt-2 ${
                      isSubmitting ? 'opacity-60' : ''
                    }`}
                    accessibilityLabel="Salvar limite"
                  >
                    {isSubmitting ? (
                      <Spinner size="small" color="#0f172a" />
                    ) : (
                      <>
                        <Save size={20} color="#0f172a" />
                        <Text className="text-slate-900 font-bold text-base">Salvar limite</Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={closeModal}
                    disabled={isSubmitting}
                    className="py-3 items-center active:opacity-70"
                    accessibilityLabel="Cancelar"
                  >
                    <Text className="text-slate-600 font-semibold text-base">Cancelar</Text>
                  </Pressable>
                </VStack>
              </ScrollView>
            </Animated.View>
          </GestureHandlerRootView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  valueOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  /** Texto quase invisível: recebe toque e mantém só dígitos (sem máscara R$) para apagar corretamente. */
  digitInputOverlay: {
    minHeight: 80,
    width: '100%',
    opacity: 0.04,
    fontSize: 28,
    textAlign: 'center',
    color: '#0f172a',
  },
});

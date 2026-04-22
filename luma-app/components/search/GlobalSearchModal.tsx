import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CheckCircle, Search, Wallet, X } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { useDashboardSearchStore } from '@/stores/dashboard-search.store';
import { useTasks } from '@/hooks/useTasks';
import { useExpenses } from '@/hooks/useExpenses';
import {
  filterExpensesByGlobalSearch,
  filterTasksByGlobalSearch,
  type GlobalSearchScope,
} from '@/lib/filterDashboardSearch';
import { LumaModalOverlay } from '@/components/ui/luma-modal-overlay';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Colors } from '@/constants/Colors';

const SCOPES: { id: GlobalSearchScope; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'tasks', label: 'Tarefas' },
  { id: 'expenses', label: 'Despesas' },
];

export interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ visible, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const houseId = useAuthStore((s) => s.houseId);
  const query = useDashboardSearchStore((s) => s.query);
  const setQuery = useDashboardSearchStore((s) => s.setQuery);
  const [scope, setScope] = useState<GlobalSearchScope>('all');
  const searchInputRef = useRef<TextInput | null>(null);

  const { data: tasks = [] } = useTasks(houseId);
  const { data: expenses = [] } = useExpenses(houseId);

  const matchedTasks = useMemo(
    () => filterTasksByGlobalSearch(tasks, query, scope),
    [tasks, query, scope]
  );
  const matchedExpenses = useMemo(
    () => filterExpensesByGlobalSearch(expenses, query, scope),
    [expenses, query, scope]
  );

  const hasQuery = query.trim().length > 0;
  const noResults =
    hasQuery && matchedTasks.length === 0 && matchedExpenses.length === 0;

  useEffect(() => {
    if (!visible) {
      return;
    }
    requestAnimationFrame(() => {
      setTimeout(() => searchInputRef.current?.focus(), Platform.OS === 'web' ? 0 : 100);
    });
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const navigateToTask = (id: string) => {
    Haptics.selectionAsync();
    handleClose();
    router.push({ pathname: '/(tabs)/tasks/[id]', params: { id } } as any);
  };

  const navigateToExpense = (id: string) => {
    Haptics.selectionAsync();
    handleClose();
    router.push({ pathname: '/(tabs)/finances/[id]', params: { id } } as any);
  };

  const maxH = Dimensions.get('window').height * 0.85;
  /** Uma única altura para a lista — evita combinar `maxHeight` do card + do scroll (saltos com teclado/KAV). */
  const resultsScrollMaxHeight = useMemo(() => Math.min(Math.max(maxH - 200, 160), 440), [maxH]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.root}>
          <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="box-none">
            <LumaModalOverlay onRequestClose={handleClose} />
          </View>

          <View
            style={[
              styles.sheetWrap,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: insets.bottom + 16,
                zIndex: 2,
              },
            ]}
            pointerEvents="box-none"
          >
            <Box style={[styles.card, { maxHeight: maxH }]} pointerEvents="auto">
              <HStack className="justify-between items-center mb-4">
                <HStack space="sm" className="items-center">
                  <Search size={22} color={Colors.primary} />
                  <Heading size="lg" className="text-typography-900 font-bold">
                    Buscar
                  </Heading>
                </HStack>
                <Pressable
                  onPress={handleClose}
                  className="w-10 h-10 rounded-full items-center justify-center border border-outline-100"
                  accessibilityLabel="Fechar busca"
                >
                  <X size={20} color={Colors.textSecondary} />
                </Pressable>
              </HStack>

              <HStack space="sm" className="mb-3 flex-wrap">
                {SCOPES.map((s) => {
                  const active = scope === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setScope(s.id);
                      }}
                      className="px-3 py-2 rounded-full border"
                      style={{
                        borderColor: active ? Colors.primary : 'rgba(0,0,0,0.08)',
                        backgroundColor: active ? Colors.primary + '18' : 'transparent',
                      }}
                    >
                      <Text
                        size="sm"
                        className={active ? 'font-semibold text-primary-500' : 'text-typography-600'}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </HStack>

              <HStack
                space="sm"
                className="items-center px-3 py-2 mb-3 rounded-2xl border border-outline-100 bg-background-50"
              >
                <Search size={18} color={Colors.textSecondary} />
                <TextInput
                  ref={searchInputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar"
                  placeholderTextColor={Colors.textSecondary}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </HStack>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: resultsScrollMaxHeight }}
                contentContainerStyle={{ paddingBottom: 8, gap: 12 }}
              >
                {!hasQuery ? (
                  <Text size="sm" className="text-typography-500 py-2">
                    Digite para buscar em tarefas e despesas desta casa.
                  </Text>
                ) : noResults ? (
                  <Text size="sm" className="text-typography-500 py-2">
                    Nenhum resultado
                  </Text>
                ) : (
                  <VStack space="md">
                    {matchedTasks.length > 0 && (
                      <VStack space="sm">
                        <Text size="xs" className="font-bold text-typography-500 uppercase">
                          Tarefas
                        </Text>
                        {matchedTasks.map((task) => (
                          <Pressable key={task.id} onPress={() => navigateToTask(task.id)}>
                            <Box style={styles.resultRow}>
                              <CheckCircle size={18} color={Colors.primary} />
                              <Text size="sm" className="text-typography-900 flex-1" numberOfLines={2}>
                                {task.title}
                              </Text>
                            </Box>
                          </Pressable>
                        ))}
                      </VStack>
                    )}
                    {matchedExpenses.length > 0 && (
                      <VStack space="sm">
                        <Text size="xs" className="font-bold text-typography-500 uppercase">
                          Despesas
                        </Text>
                        {matchedExpenses.map((expense) => (
                          <Pressable key={expense.id} onPress={() => navigateToExpense(expense.id)}>
                            <Box style={styles.resultRow}>
                              <Wallet size={18} color={Colors.primary} />
                              <VStack className="flex-1">
                                <Text size="sm" className="text-typography-900" numberOfLines={2}>
                                  {expense.description}
                                </Text>
                                <Text size="xs" className="text-typography-500">
                                  R${' '}
                                  {Number(expense.amount).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Text>
                              </VStack>
                            </Box>
                          </Pressable>
                        ))}
                      </VStack>
                    )}
                  </VStack>
                )}
              </ScrollView>
            </Box>
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
      default: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      },
    }),
  },
  searchInput: {
    flex: 1,
    minHeight: 36,
    paddingVertical: Platform.OS === 'web' ? 6 : 4,
    fontSize: 16,
    color: Colors.text,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
});

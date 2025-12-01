import React, { useState, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, startOfMonth, endOfMonth, subMonths, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';

// Gluestack UI imports
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { FlatList } from '@/components/ui/flat-list';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetScrollView,
} from '@/components/ui/actionsheet';

// Icons
import { ArrowLeft, Calendar, Wallet, CheckCircle } from 'lucide-react-native';

// Hooks and services
import { useTasks } from '@/hooks/useTasks';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/stores/auth.store';
import { Colors } from '@/constants/Colors';

// Reuse ActivityItem component logic
type ActivityItemProps = {
  icon: any;
  title: string;
  subtitle: string;
  time: string;
  onPress?: () => void;
};

const ActivityItem = ({ icon: Icon, title, subtitle, time, onPress }: ActivityItemProps) => (
  <Pressable
    style={styles.activityItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <HStack className="items-center flex-1 gap-4">
      <Box style={styles.activityIconBg}>
        <Icon size={18} color={Colors.primary} />
      </Box>
      <Box className="flex-1 justify-center gap-0.5">
        <Text size="sm" className="font-semibold text-typography-900 leading-tight" numberOfLines={1}>{title}</Text>
        <Text size="xs" className="text-typography-500" numberOfLines={1}>{subtitle}</Text>
      </Box>
      <Box className="items-end justify-center pl-2">
        <Text size="xs" className="font-medium text-typography-400 text-[10px]">{time}</Text>
      </Box>
    </HStack>
  </Pressable>
);

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const houseId = useAuthStore((state) => state.houseId);
  const { data: tasks = [] } = useTasks(houseId);
  const { data: expenses = [] } = useExpenses(houseId);

  // State for selected month/year
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate list of months (last 12 months + current)
  const availableMonths = useMemo(() => {
    const months: Date[] = [];
    const now = new Date();
    for (let i = 0; i <= 12; i++) {
      months.push(subMonths(now, i));
    }
    return months.reverse(); // Most recent first
  }, []);

  // Filter activities by selected month
  const filteredActivities = useMemo(() => {
    const startOfSelectedMonth = startOfMonth(selectedDate);
    const endOfSelectedMonth = endOfMonth(selectedDate);

    // Filter expenses
    const monthExpenses = expenses
      .filter(e => {
        const date = new Date(e.expenseDate);
        return date >= startOfSelectedMonth && date <= endOfSelectedMonth;
      })
      .map(e => ({
        id: e.id,
        type: 'finance' as const,
        title: e.description,
        subtitle: `R$ ${Number(e.amount).toFixed(2)}`,
        date: new Date(e.expenseDate),
        time: new Date(e.expenseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

    // Filter tasks (completed)
    const monthTasks = tasks
      .filter(t => {
        if (t.status !== 'COMPLETED') return false;
        const date = new Date(t.updatedAt);
        return date >= startOfSelectedMonth && date <= endOfSelectedMonth;
      })
      .map(t => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        subtitle: 'Concluída',
        date: new Date(t.updatedAt),
        time: new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

    // Merge and sort by date desc
    return [...monthExpenses, ...monthTasks]
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, tasks, selectedDate]);

  const handleSelectMonth = (monthDate: Date) => {
    setSelectedDate(monthDate);
    setShowDatePicker(false);
    Haptics.selectionAsync();
  };

  const handleActivityPress = (item: typeof filteredActivities[0]) => {
    Haptics.selectionAsync();
    if (item.type === 'finance') {
      router.push({
        pathname: '/(tabs)/finances/[id]',
        params: { id: item.id },
      } as any);
    } else {
      router.push({
        pathname: '/(tabs)/tasks/[id]',
        params: { id: item.id },
      } as any);
    }
  };

  const selectedMonthLabel = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Box style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <HStack space="md" className="items-center justify-between px-5 pt-4 pb-6">
          <HStack space="md" className="items-center flex-1">
            <Pressable onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Heading size="lg" className="font-bold text-typography-900">Histórico</Heading>
          </HStack>
        </HStack>

        {/* Date Filter Button */}
        <Box className="px-5 mb-4">
          <Button
            variant="outline"
            action="secondary"
            onPress={() => {
              setShowDatePicker(true);
              Haptics.selectionAsync();
            }}
            className="w-full"
          >
            <ButtonIcon as={Calendar} size="md" />
            <ButtonText>{selectedMonthLabel}</ButtonText>
          </Button>
        </Box>

        {/* Activities List */}
        <Box className="flex-1 px-5">
          {filteredActivities.length > 0 ? (
            <FlatList
              data={filteredActivities}
              keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
              renderItem={({ item }) => (
                <ActivityItem
                  icon={item.type === 'finance' ? Wallet : CheckCircle}
                  title={item.title}
                  subtitle={item.subtitle}
                  time={item.time}
                  onPress={() => handleActivityPress(item)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Box className="flex-1 justify-center items-center py-20">
              <Text size="md" className="text-center text-typography-500">
                Nenhuma atividade encontrada para {selectedMonthLabel}
              </Text>
            </Box>
          )}
        </Box>

        {/* Date Picker Actionsheet */}
        <Actionsheet isOpen={showDatePicker} onClose={() => setShowDatePicker(false)}>
          <ActionsheetBackdrop />
          <ActionsheetContent maxHeight="70%">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <ActionsheetScrollView>
              <VStack space="xs" className="w-full">
                {availableMonths.map((monthDate) => {
                  const monthLabel = format(monthDate, "MMMM 'de' yyyy", { locale: ptBR });
                  const isSelected = 
                    getYear(monthDate) === getYear(selectedDate) &&
                    getMonth(monthDate) === getMonth(selectedDate);

                  return (
                    <ActionsheetItem
                      key={monthDate.toISOString()}
                      onPress={() => handleSelectMonth(monthDate)}
                    >
                      <ActionsheetItemText
                        className={isSelected ? 'text-primary-500 font-semibold' : ''}
                      >
                        {monthLabel}
                      </ActionsheetItemText>
                    </ActionsheetItem>
                  );
                })}
              </VStack>
            </ActionsheetScrollView>
          </ActionsheetContent>
        </Actionsheet>
      </SafeAreaView>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  activityItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '08',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


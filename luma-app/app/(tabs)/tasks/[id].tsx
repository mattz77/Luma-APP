import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Gluestack UI imports
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';

// Icons
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Trash2,
  User,
  AlertCircle,
  Zap,
} from 'lucide-react-native';

// Hooks
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useAuthStore } from '@/stores/auth.store';
import { Colors } from '@/constants/Colors';
import { Toast } from '@/components/ui/Toast';

/** Espaço reservado para o dock flutuante (TabBar); alinhado ao overlay em finances/index (iOS tabBar absolute). */
const TAB_DOCK_CLEARANCE = 120;
const META_ICON_SIZE = 19;

export default function TaskDetailsScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const taskId = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const houseId = useAuthStore((state) => state.houseId);

  const bottomReserve = insets.bottom + TAB_DOCK_CLEARANCE;

  const { data: task, isLoading } = useTask(taskId, houseId);
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleComplete = async () => {
    if (!task) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateTaskMutation.mutateAsync({
        id: task.id,
        updates: {
          house_id: task.houseId,
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        },
      });
      showToast('Tarefa concluída! 🎉');
      setTimeout(() => router.back(), 1000);
    } catch (error) {
      showToast('Erro ao concluir tarefa', 'error');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteTaskMutation.mutateAsync({ id: task.id, houseId: task.houseId });
      showToast('Tarefa excluída');
      setTimeout(() => router.back(), 500);
    } catch (error) {
      showToast('Erro ao excluir tarefa', 'error');
    }
  };

  if (taskId && isLoading) {
    return (
      <Box className="flex-1 bg-[#FAF8F2] items-center justify-center">
        <Spinner size="large" color={Colors.primary} />
      </Box>
    );
  }

  if (!taskId || !task) {
    return (
      <Box className="flex-1 bg-[#FAF8F2] items-center justify-center px-6">
        <AlertCircle size={48} color={Colors.textSecondary} />
        <Heading size="lg" className="text-[#1B1725] text-center mt-4">Tarefa não encontrada</Heading>
        <Button onPress={() => router.back()} className="mt-4" variant="outline">
          <ButtonText>Voltar</ButtonText>
        </Button>
      </Box>
    );
  }

  const isCompleted = task.status === 'COMPLETED';

  return (
    <Box style={{ flex: 1 }} className="bg-[#FAF8F2]">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Header fixo — conteúdo principal no ScrollView (evita layout quebrado no iOS: ScrollView flex + rodapé irmão). */}
          <Box className="px-6 pt-4 pb-4 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-[#EAE6DC] items-center justify-center shadow-sm active:scale-[0.95]"
            >
              <ArrowLeft size={20} color={Colors.text} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              className="w-10 h-10 rounded-full bg-[#FBE7E7] border border-red-100 items-center justify-center active:scale-[0.95]"
            >
              <Trash2 size={20} color="#D64545" />
            </Pressable>
          </Box>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: bottomReserve,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Priority Badge */}
            <Box
              className={`self-start px-3 py-1 rounded-full mb-4 ${
                task.priority === 'URGENT' ? 'bg-[#FBE7E7]' : task.priority === 'HIGH' ? 'bg-orange-100' : 'bg-[#FBEED0]'
              }`}
            >
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${
                  task.priority === 'URGENT' ? 'text-red-700' : task.priority === 'HIGH' ? 'text-orange-700' : 'text-[#1B1725]'
                }`}
              >
                {task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : 'Normal'}
              </Text>
            </Box>

            <Heading size="3xl" className="font-bold text-[#1B1725] mb-6 leading-tight">
              {task.title}
            </Heading>

            <VStack space="lg" className="mb-8">
              <HStack space="md" className="items-center">
                <CalendarDays size={META_ICON_SIZE} color={Colors.primary} />
                <VStack className="flex-1">
                  <Text className="text-xs text-[#A5A0AE] font-bold uppercase">Prazo</Text>
                  <Text className="text-[#1B1725] font-medium">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </Text>
                </VStack>
              </HStack>

              <HStack space="md" className="items-center">
                <User size={META_ICON_SIZE} color={Colors.primary} />
                <VStack className="flex-1">
                  <Text className="text-xs text-[#A5A0AE] font-bold uppercase">Responsável</Text>
                  <Text className="text-[#1B1725] font-medium">{task.assignee?.name || 'Sem responsável'}</Text>
                </VStack>
              </HStack>

              <HStack space="md" className="items-center">
                <Zap size={META_ICON_SIZE} color="#F6B51E" fill="#F6B51E" />
                <VStack className="flex-1">
                  <Text className="text-xs text-[#A5A0AE] font-bold uppercase">Recompensa</Text>
                  <Text className="text-[#1B1725] font-medium">+{task.points} pontos</Text>
                </VStack>
              </HStack>
            </VStack>

            {task.description ? (
              <VStack space="sm" className="mb-8">
                <Text className="text-lg font-bold text-[#1B1725]">Descrição</Text>
                <Text className="text-[#6F6A7A] leading-relaxed">{task.description}</Text>
              </VStack>
            ) : null}

            {!isCompleted ? (
              <Button
                onPress={handleComplete}
                className="bg-[#D9F99D] h-16 rounded-[14px] active:scale-[0.98] mt-2"
              >
                <ButtonIcon as={CheckCircle2} className="text-black mr-2" />
                <ButtonText className="text-black font-bold text-lg">Concluir Tarefa</ButtonText>
              </Button>
            ) : (
              <HStack space="sm" className="bg-emerald-100 px-4 py-2 rounded-full items-center self-center mt-2">
                <CheckCircle2 size={16} color="#047857" />
                <Text className="text-emerald-700 font-bold">Tarefa Concluída</Text>
              </HStack>
            )}
          </ScrollView>
        </View>

        {toast && (
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </SafeAreaView>
    </Box>
  );
}

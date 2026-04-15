import React, { useState } from 'react';
import { ScrollView } from 'react-native';
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

/** Espaço reservado para o dock flutuante (TabBar) + folga; somar a insets.bottom */
const TAB_DOCK_CLEARANCE = 100;
const META_ICON_SIZE = 19;

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const houseId = useAuthStore((state) => state.houseId);

  const bottomReserve = insets.bottom + TAB_DOCK_CLEARANCE;

  const { data: task, isLoading } = useTask(id as string, houseId);
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

  if (isLoading) {
    return (
      <Box className="flex-1 bg-[#FDFBF7] items-center justify-center">
        <Spinner size="large" color={Colors.primary} />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box className="flex-1 bg-[#FDFBF7] items-center justify-center px-6">
        <AlertCircle size={48} color={Colors.textSecondary} />
        <Heading size="lg" className="text-slate-900 text-center mt-4">Tarefa não encontrada</Heading>
        <Button onPress={() => router.back()} className="mt-4" variant="outline">
          <ButtonText>Voltar</ButtonText>
        </Button>
      </Box>
    );
  }

  const isCompleted = task.status === 'COMPLETED';

  return (
    <Box className="flex-1 bg-[#FDFBF7]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Box className="px-6 pt-4 pb-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm active:scale-95"
          >
            <ArrowLeft size={20} color={Colors.text} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            className="w-10 h-10 rounded-full bg-red-50 border border-red-100 items-center justify-center active:scale-95"
          >
            <Trash2 size={20} color="#ef4444" />
          </Pressable>
        </Box>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Priority Badge */}
          <Box className={`self-start px-3 py-1 rounded-full mb-4 ${task.priority === 'URGENT' ? 'bg-red-100' :
              task.priority === 'HIGH' ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
            <Text className={`text-xs font-bold uppercase tracking-wider ${task.priority === 'URGENT' ? 'text-red-700' :
                task.priority === 'HIGH' ? 'text-orange-700' : 'text-blue-700'
              }`}>
              {task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : 'Normal'}
            </Text>
          </Box>

          <Heading size="3xl" className="font-bold text-slate-900 mb-6 leading-tight">
            {task.title}
          </Heading>

          {/* Meta — alinhado ao detalhe de despesa + pill de pontos Bento */}
          <VStack space="lg" className="mb-8">
            <HStack space="md" className="items-center">
              <CalendarDays size={META_ICON_SIZE} color={Colors.primary} />
              <VStack className="flex-1">
                <Text className="text-xs text-slate-400 font-bold uppercase">Prazo</Text>
                <Text className="text-slate-900 font-medium">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </Text>
              </VStack>
            </HStack>

            <HStack space="md" className="items-center">
              <User size={META_ICON_SIZE} color={Colors.primary} />
              <VStack className="flex-1">
                <Text className="text-xs text-slate-400 font-bold uppercase">Responsável</Text>
                <Text className="text-slate-900 font-medium">
                  {task.assignee?.name || 'Sem responsável'}
                </Text>
              </VStack>
            </HStack>

            <HStack space="md" className="items-center">
              <Zap
                size={META_ICON_SIZE}
                color="#FDE047"
                fill="#FDE047"
              />
              <VStack className="flex-1">
                <Text className="text-xs text-slate-400 font-bold uppercase">Recompensa</Text>
                <Text className="text-slate-900 font-medium">+{task.points} pontos</Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Description */}
          {task.description && (
            <VStack space="sm" className="mb-8">
              <Text className="text-lg font-bold text-slate-900">Descrição</Text>
              <Text className="text-slate-500 leading-relaxed">
                {task.description}
              </Text>
            </VStack>
          )}
        </ScrollView>

        {/* Footer — reserva inferior para o dock não cobrir o CTA */}
        {!isCompleted && (
          <Box className="px-6 pt-0" style={{ paddingBottom: bottomReserve }}>
            <Button
              onPress={handleComplete}
              className="bg-[#D9F99D] h-16 rounded-[24px] active:scale-[0.98]"
            >
              <ButtonIcon as={CheckCircle2} className="text-black mr-2" />
              <ButtonText className="text-black font-bold text-lg">Concluir Tarefa</ButtonText>
            </Button>
          </Box>
        )}

        {isCompleted && (
          <Box className="px-6 pt-0 items-center" style={{ paddingBottom: bottomReserve }}>
            <HStack space="sm" className="bg-emerald-100 px-4 py-2 rounded-full items-center">
              <CheckCircle2 size={16} color="#047857" />
              <Text className="text-emerald-700 font-bold">Tarefa Concluída</Text>
            </HStack>
          </Box>
        )}

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

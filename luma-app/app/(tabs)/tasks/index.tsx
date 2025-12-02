import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, Platform, View, ScrollView as RNScrollView, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Gluestack UI imports
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { FlatList } from '@/components/ui/flat-list';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Home,
  MessageSquare,
  Bell,
  CheckCircle2,
  Clock,
  MoreVertical,
  ChevronLeft,
  X,
  User,
  Zap,
  LayoutList,
  AlertCircle
} from 'lucide-react-native';

// Hooks and services
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useHouseMembers } from '@/hooks/useHouses';
import { useAuthStore } from '@/stores/auth.store';
import type { Task, TaskStatus, TaskPriority } from '@/types/models';
import { Colors } from '@/constants/Colors';
import { TagInput } from '@/components/TagInput';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// --- Constants & Helpers ---

const THEMES = {
  yellow: { bg: 'bg-[#FDE047]', text: 'text-black', badge: 'bg-black/10 text-black', iconBg: 'bg-white/50' },
  lavender: { bg: 'bg-[#DDD6FE]', text: 'text-black', badge: 'bg-black/10 text-black', iconBg: 'bg-white/50' },
  dark: { bg: 'bg-[#27272A]', text: 'text-white', badge: 'bg-zinc-800 text-zinc-300', iconBg: 'bg-zinc-700' },
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const formatRelativeDate = (dateString: string | null): string => {
  if (!dateString) return 'Sem prazo';
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays === -1) return 'Ontem';
  if (diffDays > 0 && diffDays <= 7) {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return weekDays[taskDate.getDay()];
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// --- Components ---

const DateStrip = ({ compact }: { compact: boolean }) => {
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = -1; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        day: d.getDate(),
        week: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
        active: i === 0,
        fullDate: d
      });
    }
    return arr;
  }, []);

  return (
    <Animated.View layout={Layout.springify()}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}>
        <HStack space="md">
          {dates.map((date, i) => (
            <Pressable
              key={i}
              onPress={() => Haptics.selectionAsync()}
              className={`items-center justify-center border transition-all duration-300 ${compact
                ? 'w-12 h-12'
                : 'w-[60px] h-[85px]'
                } ${date.active
                  ? 'bg-[#FDE047] border-[#FDE047] shadow-lg shadow-yellow-900/20'
                  : 'bg-white border-slate-200'
                }`}
              style={[
                { 
                  overflow: 'hidden',
                  borderRadius: compact ? 24 : 24
                },
                date.active && { transform: [{ scale: 1.05 }] }
              ]}
            >
              <Text className={`font-bold ${compact ? 'text-lg' : 'text-2xl mb-1'
                } ${date.active ? 'text-black' : 'text-slate-900'}`}>
                {date.day}
              </Text>
              {!compact && (
                <Text className={`text-xs font-bold uppercase ${date.active ? 'text-black' : 'text-slate-400'}`}>
                  {date.week}
                </Text>
              )}
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Animated.View>
  );
};

const StatsWidget = ({ totalPoints, completedCount, totalCount }: { totalPoints: number, completedCount: number, totalCount: number }) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Box className="mx-6 mb-8">
      <HStack className="justify-between items-end mb-4">
        <Heading size="lg" className="font-bold text-slate-900">Meu Progresso</Heading>
        <Text className="text-slate-500 text-sm font-medium">{totalCount - completedCount} restantes</Text>
      </HStack>

      <Box className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex-row items-center justify-between">
        <VStack>
          <Text className="text-4xl font-bold text-slate-900 mb-1">{totalPoints}</Text>
          <Text className="text-sm text-slate-400 font-medium">Pontos totais</Text>
        </VStack>

        {/* Simple Circular Progress Simulation */}
        <Box className="w-16 h-16 rounded-full border-4 border-slate-100 items-center justify-center relative">
          <Box className="absolute w-full h-full rounded-full border-4 border-t-[#FDE047] border-r-[#FDE047] rotate-45" />
          <Text className="text-xs font-bold text-slate-900">{percentage}%</Text>
        </Box>
      </Box>
    </Box>
  );
};

const BentoTaskCard = ({ task, onPress }: { task: Task, onPress: () => void }) => {
  // Assign a theme based on priority or random (consistent by ID)
  const themeKey = useMemo(() => {
    if (task.priority === 'URGENT') return 'yellow';
    if (task.priority === 'HIGH') return 'dark';
    return 'lavender';
  }, [task.priority]);

  const theme = THEMES[themeKey];
  const dueDateLabel = formatRelativeDate(task.dueDate);

  return (
    <Animated.View entering={FadeInDown.springify()} layout={Layout.springify()}>
      <Pressable
        onPress={onPress}
        className={`p-5 rounded-[32px] mb-4 relative overflow-hidden active:scale-[0.98] transition-all ${theme.bg}`}
      >
        {/* Header Chips */}
        <HStack className="justify-between items-start mb-4">
          <Box className={`px-3 py-1 rounded-full ${theme.badge}`}>
            <Text className={`text-xs font-bold uppercase tracking-wider ${theme.text} opacity-80`}>
              {task.tags && task.tags.length > 0 ? task.tags[0] : 'Geral'}
            </Text>
          </Box>
          {task.priority === 'URGENT' && (
            <HStack space="xs" className="items-center">
              <Box className="w-2 h-2 rounded-full bg-red-500" />
              <Text className={`text-xs font-bold ${theme.text}`}>Urgente</Text>
            </HStack>
          )}
        </HStack>

        {/* Content */}
        <Heading size="xl" className={`font-bold leading-tight mb-2 ${theme.text}`} numberOfLines={2}>
          {task.title}
        </Heading>

        <HStack space="xs" className="items-center mb-6 opacity-80">
          <Clock size={16} color={themeKey === 'dark' ? 'white' : 'black'} />
          <Text className={`text-sm font-medium ${theme.text}`}>
            {dueDateLabel}
          </Text>
        </HStack>

        {/* Footer info */}
        <HStack className="items-center justify-between mt-auto">
          <HStack className="-space-x-2">
            {task.assignee ? (
              <Avatar size="sm" className="border-2 border-white">
                <AvatarFallbackText>{task.assignee.name?.charAt(0) || 'U'}</AvatarFallbackText>
                {task.assignee.avatarUrl && <AvatarImage source={{ uri: task.assignee.avatarUrl }} />}
              </Avatar>
            ) : (
              <Box className={`w-8 h-8 rounded-full items-center justify-center border-2 border-transparent ${theme.iconBg}`}>
                <User size={14} color={themeKey === 'dark' ? 'white' : 'black'} />
              </Box>
            )}
            <Box className={`w-8 h-8 rounded-full items-center justify-center ${theme.iconBg}`}>
              <Plus size={14} color={themeKey === 'dark' ? 'white' : 'black'} />
            </Box>
          </HStack>

          <Box className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${themeKey === 'dark' ? 'bg-emerald-500/20' : 'bg-black'}`}>
            <Zap size={12} color={themeKey === 'dark' ? '#34d399' : '#FDE047'} fill="currentColor" />
            <Text className={`text-xs font-bold ${themeKey === 'dark' ? 'text-emerald-400' : 'text-[#FDE047]'}`}>
              +{task.points} pts
            </Text>
          </Box>
        </HStack>
      </Pressable>
    </Animated.View>
  );
};

// --- Main Screen ---

export default function TasksScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action: string }>();
  const houseId = useAuthStore((state) => state.houseId);
  const user = useAuthStore((state) => state.user);
  const { top, bottom } = useSafeAreaInsets();

  const { data: tasks = [], isLoading, isRefetching, refetch } = useTasks(houseId);
  const { data: members = [] } = useHouseMembers(houseId);
  useRealtimeTasks(houseId);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  // State
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<TaskPriority>('MEDIUM');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(null);
  const [isClosingByGesture, setIsClosingByGesture] = useState(false);

  // Gesture values for drag to close
  const translateY = useSharedValue(0);
  const { height: screenHeight } = useWindowDimensions();

  // Handle 'create' action from global dock
  useEffect(() => {
    if (action === 'create') {
      setCreateOpen(true);
    }
  }, [action]);

  // Reset translateY when modal opens/closes
  useEffect(() => {
    if (isCreateOpen) {
      translateY.value = 0;
      setIsClosingByGesture(false);
    }
  }, [isCreateOpen]);

  // Close modal function
  const closeModal = () => {
    Keyboard.dismiss();
    setCreateOpen(false);
    router.setParams({ action: '' });
  };

  // Pan gesture for drag to close
  const panGesture = Gesture.Pan()
    .activeOffsetY(10) // Require 10px downward movement before activating
    .onUpdate((event) => {
      // Only allow downward drag
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;
      
      if (shouldClose) {
        // Mark as closing by gesture to prevent double animation
        runOnJS(setIsClosingByGesture)(true);
        // Animate out and close
        translateY.value = withTiming(screenHeight, {
          duration: 300,
        }, () => {
          runOnJS(closeModal)();
          translateY.value = 0; // Reset for next open
        });
      } else {
        // Spring back to original position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  // Animated style for modal based on gesture
  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const completedCount = useMemo(() => tasks.filter(t => t.status === 'COMPLETED').length, [tasks]);
  const totalPoints = useMemo(() => tasks.reduce((acc, t) => acc + (t.status === 'COMPLETED' ? t.points : 0), 0), [tasks]);

  const displayedTasks = useMemo(() => {
    if (showCompleted) {
      return tasks.filter(t => t.status === 'COMPLETED');
    }
    return tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  }, [tasks, showCompleted]);

  const handleSaveTask = async () => {
    if (!titleInput.trim() || !houseId || !user) {
      showToast('Preencha o título', 'error');
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        house_id: houseId,
        created_by_id: user.id,
        assigned_to_id: selectedAssigneeIds[0] || user.id,
        title: titleInput.trim(),
        description: descriptionInput.trim() || null,
        priority: priorityInput,
        due_date: deadline?.toISOString() || null,
        tags: [],
      });
      showToast('Tarefa criada! 🎉');
      closeModal();
      setTitleInput('');
      setDescriptionInput('');
      setPriorityInput('MEDIUM');
      setDeadline(null);
      setSelectedAssigneeIds([]);
      refetch();
    } catch (error) {
      showToast('Erro ao criar tarefa', 'error');
    }
  };

  const toggleAssignee = (userId: string) => {
    Haptics.selectionAsync();
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (!houseId) {
    return (
      <Box className="flex-1 bg-[#FDFBF7] items-center justify-center px-6">
        <AlertCircle size={48} color={Colors.textSecondary} />
        <Heading size="lg" className="text-slate-900 text-center mt-4">Selecione uma casa</Heading>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box className="flex-1 bg-[#FDFBF7]">
        <SafeAreaView className="flex-1" edges={['top']}>

          {/* Header */}
          <Box className="px-6 pt-12 pb-6 flex-row justify-between items-center">
            <VStack>
              <Text className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                Bom dia, {user?.name?.split(' ')[0] || 'Usuário'}!
              </Text>
              <HStack space="xs" className="items-center">
                <Heading size="xl" className="font-bold text-slate-900">Hoje, {new Date().getDate()}</Heading>
                <ChevronLeft size={18} className="text-slate-400 -rotate-90" />
              </HStack>
            </VStack>
            <HStack space="sm">
              <Pressable
                onPress={() => setCreateOpen(true)}
                className="w-10 h-10 rounded-full bg-[#FDE047] border border-yellow-200 items-center justify-center shadow-sm active:scale-95"
              >
                <Plus size={20} className="text-slate-900" />
              </Pressable>
              <Pressable className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm active:scale-95">
                <Search size={18} className="text-slate-900" />
              </Pressable>
            </HStack>
          </Box>

          {/* Date Strip */}
          <DateStrip compact={isCreateOpen} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Stats Widget */}
            <StatsWidget totalPoints={totalPoints} completedCount={completedCount} totalCount={tasks.length} />

            {/* Task List */}
            <Box className="px-6 space-y-4">
              <HStack className="justify-between items-center mb-2">
                <Heading size="xl" className="font-bold text-slate-900">
                  {showCompleted ? 'Concluídas' : 'Tarefas'}
                </Heading>
                <Pressable onPress={() => {
                  Haptics.selectionAsync();
                  setShowCompleted(!showCompleted);
                }}>
                  <Text className="text-sm text-yellow-600 font-bold">
                    {showCompleted ? 'Ver pendentes' : 'Ver concluídas'}
                  </Text>
                </Pressable>
              </HStack>

              {isLoading ? (
                <VStack space="md">
                  {[1, 2].map((i) => <Skeleton key={i} width="100%" height={160} borderRadius={32} />)}
                </VStack>
              ) : (
                displayedTasks.map((task) => (
                  <BentoTaskCard
                    key={task.id}
                    task={task}
                    onPress={() => router.push(`/(tabs)/tasks/${task.id}` as any)}
                  />
                ))
              )}
              {displayedTasks.length === 0 && !isLoading && (
                <Box className="py-10 items-center opacity-50">
                  <CheckCircle2 size={48} color="#cbd5e1" />
                  <Text className="text-slate-400 mt-4 font-medium">
                    {showCompleted ? 'Nenhuma tarefa concluída ainda.' : 'Tudo feito por hoje!'}
                  </Text>
                </Box>
              )}
            </Box>
          </ScrollView>

          {/* New Task Bottom Sheet (Custom Implementation) */}
          {isCreateOpen && (
            <View className="absolute inset-0 z-[2000] justify-end">
              {/* Backdrop */}
              <Animated.View
                entering={FadeIn.duration(Platform.OS === 'ios' ? 250 : 300)}
                className="absolute inset-0"
              >
                <BlurView
                  intensity={Platform.OS === 'ios' ? 20 : 30}
                  tint="light"
                  style={StyleSheet.absoluteFill}
                />
                <View className="absolute inset-0 bg-black/15" />
                <Pressable
                  className="flex-1"
                  onPress={closeModal}
                />
              </Animated.View>

              {/* Dock Area Blur - covers dock area without blocking interactions */}
              <Animated.View
                entering={FadeIn.duration(Platform.OS === 'ios' ? 250 : 300)}
                className="absolute bottom-0 left-0 right-0"
                style={{ 
                  height: 120, // Height to cover dock area
                  zIndex: 1500, // Above backdrop but below modal
                  pointerEvents: 'none' // Don't block dock interactions
                }}
              >
                <BlurView
                  intensity={Platform.OS === 'ios' ? 20 : 30}
                  tint="light"
                  style={StyleSheet.absoluteFill}
                />
                {/* Gradient overlay to blend smoothly */}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.15)']}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Vignette Effect - reduzido para não competir com o modal */}
              <Animated.View
                entering={FadeIn.duration(400).delay(50)}
                className="absolute inset-0"
                pointerEvents="none"
                style={{ zIndex: 1 }}
              >
                {/* Top Vignette */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0)']}
                  locations={[0, 0.3, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%' }}
                />
                {/* Bottom Vignette */}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.15)']}
                  locations={[0, 0.7, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
                />
                {/* Left Vignette */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0)']}
                  locations={[0, 0.4, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '28%' }}
                />
                {/* Right Vignette */}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.10)']}
                  locations={[0, 0.6, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '28%' }}
                />
              </Animated.View>

              {/* Sheet Content */}
              <GestureHandlerRootView style={{ width: '100%' }}>
                <GestureDetector gesture={panGesture}>
                  <Animated.View
                    entering={SlideInDown.springify()
                      .damping(Platform.OS === 'ios' ? 18 : 20)
                      .stiffness(Platform.OS === 'ios' ? 280 : 250)
                      .mass(Platform.OS === 'ios' ? 0.8 : 1)}
                    exiting={isClosingByGesture ? undefined : SlideOutDown}
                    className="bg-white rounded-t-[40px] p-8 h-[90%] w-full shadow-2xl"
                    style={[
                      { backgroundColor: '#FFFFFF' }, // Force white background
                      modalAnimatedStyle
                    ]}
                  >
                <View className="w-full items-center mb-6" style={{ paddingVertical: 8 }}>
                  <View className="w-12 h-1 bg-slate-200 rounded-full" />
                </View>

                <HStack className="justify-between items-center mb-6">
                  <Pressable onPress={Keyboard.dismiss}>
                    <Heading size="2xl" className="font-bold text-slate-900 tracking-tight">Nova Tarefa</Heading>
                  </Pressable>
                  <Pressable
                    onPress={closeModal}
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 items-center justify-center active:bg-slate-100"
                  >
                    <X size={16} className="text-slate-900" />
                  </Pressable>
                </HStack>

                <ScrollView 
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  onScrollBeginDrag={Keyboard.dismiss}
                >
                  <VStack space="lg" className="flex-1">
                  <VStack space="xs">
                    <Text className="text-slate-500 text-xs font-bold ml-1 uppercase tracking-wider">Título</Text>
                    <Input className="h-14 border border-slate-200 bg-white rounded-2xl focus:border-[#FDE047] focus:border-2">
                      <InputField
                        placeholder="Ex: Comprar leite..."
                        value={titleInput}
                        onChangeText={setTitleInput}
                        className="text-lg font-medium text-slate-900"
                        placeholderTextColor="#94a3b8"
                        // No iOS, evitamos abrir o teclado junto com a animação do modal
                        autoFocus={Platform.OS !== 'ios'}
                      />
                    </Input>
                  </VStack>

                  <VStack space="xs">
                    <Text className="text-slate-500 text-xs font-bold ml-1 uppercase tracking-wider">Descrição</Text>
                    <Input className="h-24 border border-slate-200 bg-white rounded-2xl focus:border-[#FDE047] focus:border-2">
                      <InputField
                        placeholder="Adicione detalhes..."
                        value={descriptionInput}
                        onChangeText={setDescriptionInput}
                        multiline
                        textAlignVertical="top"
                        className="py-3 text-sm text-slate-900 leading-5"
                        placeholderTextColor="#94a3b8"
                      />
                    </Input>
                  </VStack>

                  {/* Deadline Section */}
                  <VStack space="xs">
                    <Text className="text-slate-500 text-xs font-bold ml-1 uppercase tracking-wider">Prazo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {[
                        { label: 'Hoje', value: new Date() },
                        { label: 'Amanhã', value: new Date(Date.now() + 86400000) },
                        { label: 'Próx. Semana', value: new Date(Date.now() + 7 * 86400000) },
                        { label: 'Sem prazo', value: null }
                      ].map((opt, i) => {
                        const isSelected = opt.value === null
                          ? deadline === null
                          : deadline?.toDateString() === opt.value.toDateString();

                        return (
                          <Pressable
                            key={i}
                            onPress={() => {
                              Keyboard.dismiss();
                              Haptics.selectionAsync();
                              setDeadline(opt.value);
                            }}
                            className={`px-4 py-2.5 rounded-xl border ${isSelected
                              ? 'bg-[#FDE047] border-[#FDE047]'
                              : 'bg-slate-50 border-slate-100'
                              }`}
                          >
                            <Text className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </VStack>

                  <HStack space="md">
                    <VStack space="xs" className="flex-1">
                      <Text className="text-slate-500 text-xs font-bold ml-1 uppercase tracking-wider">Prioridade</Text>
                      <HStack className="bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        {(['MEDIUM', 'HIGH'] as TaskPriority[]).map(p => (
                          <Pressable
                            key={p}
                            onPress={() => {
                              Keyboard.dismiss();
                              setPriorityInput(p);
                            }}
                            className={`flex-1 py-2.5 rounded-xl items-center ${priorityInput === p ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                          >
                            <Text className={`text-xs font-bold ${priorityInput === p ? 'text-slate-900' : 'text-slate-400'}`}>
                              {PRIORITY_LABELS[p]}
                            </Text>
                          </Pressable>
                        ))}
                      </HStack>
                    </VStack>

                    <VStack space="xs" className="flex-1">
                      <Text className="text-slate-500 text-xs font-bold ml-1 uppercase tracking-wider">Atribuir a</Text>
                      <HStack space="sm" className="items-center h-[50px]">
                        <Pressable className="w-10 h-10 rounded-full bg-white border border-dashed border-slate-300 items-center justify-center active:border-[#FDE047] active:bg-[#FDE047]/10">
                          <Plus size={18} className="text-slate-400" />
                        </Pressable>
                        {members.slice(0, 2).map(m => (
                          <Pressable 
                            key={m.userId} 
                            onPress={() => {
                              Keyboard.dismiss();
                              toggleAssignee(m.userId);
                            }}
                          >
                            <Avatar size="sm" className={`border-2 ${selectedAssigneeIds.includes(m.userId) ? 'border-[#FDE047]' : 'border-white'}`}>
                              <AvatarFallbackText>{m.user.name?.charAt(0)}</AvatarFallbackText>
                              {m.user.avatarUrl && <AvatarImage source={{ uri: m.user.avatarUrl }} />}
                            </Avatar>
                          </Pressable>
                        ))}
                      </HStack>
                    </VStack>
                  </HStack>

                  <Box className="flex-1" />

                  <Button
                    onPress={handleSaveTask}
                    className="bg-[#FDE047] h-14 rounded-[24px] mb-32 active:scale-[0.98] shadow-lg shadow-yellow-200"
                  >
                    <ButtonText className="text-slate-900 font-bold text-md">Salvar Tarefa</ButtonText>
                  </Button>
                </VStack>
                </ScrollView>
                </Animated.View>
                </GestureDetector>
              </GestureHandlerRootView>
            </View>
          )}

          {/* Toast */}
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
    </ErrorBoundary>
  );
}

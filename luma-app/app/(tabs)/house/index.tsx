import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ArrowLeft,
  Home as HomeIcon,
  Users,
  Plus,
  LogIn,
  Copy,
  Settings,
  Shield,
  LogOut,
  Camera,
  X,
  UserMinus,
} from 'lucide-react-native';

import {
  useCreateHouse,
  useHouseMembers,
  useJoinHouse,
  useLeaveHouse,
  useRemoveMember,
  useUpdateMemberRole,
  useUserHouses,
} from '@/hooks/useHouses';
import { useAuthStore } from '@/stores/auth.store';
import type { HouseMemberRole, HouseMemberWithUser } from '@/types/models';
import { Colors } from '@/constants/Colors';
import { pickImageFromGallery, takePhoto, uploadImageToStorage } from '@/lib/storage';
import { getTabScrollBottomPadding } from '@/lib/screenLayout';
import { LumaModalOverlay } from '@/components/ui/luma-modal-overlay';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { ScrollView } from '@/components/ui/scroll-view';
import { Input, InputField } from '@/components/ui/input';
import { Toast } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenGreeting } from '@/components/ScreenGreeting';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button, ButtonText } from '@/components/ui/button';

const ROLE_LABELS: Record<HouseMemberRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador',
};

const formatRole = (role: HouseMemberRole) => ROLE_LABELS[role] ?? 'Membro';

type ConfirmState =
  | null
  | { type: 'removeMember'; member: HouseMemberWithUser }
  | { type: 'updateRole'; member: HouseMemberWithUser }
  | { type: 'leaveHouse' }
  | { type: 'signOut' };

export default function HouseScreen() {
  const user = useAuthStore((state) => state.user);
  const houseId = useAuthStore((state) => state.houseId);
  const setHouseId = useAuthStore((state) => state.setHouseId);
  const signOut = useAuthStore((state) => state.signOut);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();

  const { data: houses = [], isLoading: housesLoading } = useUserHouses(user?.id);
  const { data: members = [], isLoading: membersLoading } = useHouseMembers(houseId);

  const createHouseMutation = useCreateHouse(user?.id);
  const joinHouseMutation = useJoinHouse(user?.id);
  const removeMemberMutation = useRemoveMember(houseId, user?.id);
  const leaveHouseMutation = useLeaveHouse(houseId, user?.id);
  const updateMemberRoleMutation = useUpdateMemberRole(houseId, user?.id);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [houseNameInput, setHouseNameInput] = useState('');
  const [houseAddressInput, setHouseAddressInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [housePhotoUri, setHousePhotoUri] = useState<string | null>(null);
  const [housePhotoBase64, setHousePhotoBase64] = useState<string | null>(null);
  const [housePhotoMime, setHousePhotoMime] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(
    null
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const currentHouse = useMemo(
    () => houses.find((item) => item.house.id === houseId) ?? null,
    [houses, houseId],
  );

  const isAdmin = currentHouse?.membership.role === 'ADMIN';

  const overlayRootStyle = useMemo(
    () => ({
      flex: 1,
      width: '100%' as const,
      ...(Platform.OS === 'web' ? { minHeight: screenHeight } : {}),
    }),
    [screenHeight],
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
    [],
  );

  const sheetOuterStyle = useMemo(
    () => ({
      width: '100%' as const,
      maxHeight: screenHeight * 0.92,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      paddingBottom: Math.max(insets.bottom, 8),
      overflow: 'hidden' as const,
    }),
    [screenHeight, insets.bottom],
  );

  useEffect(() => {
    if (!houses.length) {
      setHouseId(null);
      return;
    }

    if (!houseId) {
      setHouseId(houses[0].house.id);
      return;
    }

    const exists = houses.some((item) => item.house.id === houseId);
    if (!exists) {
      setHouseId(houses[0].house.id);
    }
  }, [houses, houseId, setHouseId]);

  const copyInviteCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      showToast('Código copiado!', 'success');
    } catch {
      showToast(`Código: ${code}`, 'error');
    }
  };

  const handleRemoveMember = (member: HouseMemberWithUser) => {
    if (member.userId === user?.id) {
      setConfirm({ type: 'leaveHouse' });
      return;
    }
    setConfirm({ type: 'removeMember', member });
  };

  const handleUpdateRole = (member: HouseMemberWithUser) => {
    setConfirm({ type: 'updateRole', member });
  };

  const handleLeaveHouse = () => {
    setConfirm({ type: 'leaveHouse' });
  };

  const closeConfirm = () => {
    if (
      removeMemberMutation.isPending ||
      leaveHouseMutation.isPending ||
      updateMemberRoleMutation.isPending
    ) {
      return;
    }
    setConfirm(null);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'removeMember') {
        await removeMemberMutation.mutateAsync(confirm.member.id);
        showToast('Membro removido.', 'success');
      } else if (confirm.type === 'leaveHouse') {
        if (!houseId) return;
        await leaveHouseMutation.mutateAsync();
        setHouseId(null);
        showToast('Você saiu da casa.', 'success');
      } else if (confirm.type === 'updateRole') {
        const member = confirm.member;
        const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
        await updateMemberRoleMutation.mutateAsync({
          membershipId: member.id,
          role: newRole,
        });
        showToast('Permissão atualizada.', 'success');
      } else if (confirm.type === 'signOut') {
        await signOut();
        router.replace('/(auth)/login');
      }
      setConfirm(null);
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const confirmPending =
    removeMemberMutation.isPending || leaveHouseMutation.isPending || updateMemberRoleMutation.isPending;

  const confirmTitle = (() => {
    if (!confirm) return '';
    if (confirm.type === 'removeMember') return 'Remover membro';
    if (confirm.type === 'updateRole') return 'Alterar permissão';
    if (confirm.type === 'leaveHouse') return 'Sair da casa';
    return 'Sair da conta';
  })();

  const confirmBody = (() => {
    if (!confirm) return '';
    if (confirm.type === 'removeMember') {
      return `Deseja remover ${confirm.member.user.name ?? confirm.member.user.email} da casa?`;
    }
    if (confirm.type === 'updateRole') {
      const newRole = confirm.member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
      return `Alterar a permissão de ${confirm.member.user.name ?? confirm.member.user.email} para ${ROLE_LABELS[newRole]}?`;
    }
    if (confirm.type === 'leaveHouse') {
      return 'Tem certeza que deseja sair desta casa?';
    }
    return 'Tem certeza que deseja sair? Você precisará entrar novamente com e-mail e senha.';
  })();

  const greetingFirstName = user?.name?.split(' ')[0] ?? '';
  const scrollBottomPadding = getTabScrollBottomPadding(insets.bottom);

  const pickFromGallery = async () => {
    try {
      const result = await pickImageFromGallery();
      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setHousePhotoUri(a.uri);
        setHousePhotoBase64(a.base64 ?? null);
        setHousePhotoMime(a.mimeType ?? null);
      }
    } catch {
      showToast('Não foi possível selecionar a imagem.', 'error');
    }
  };

  const pickFromCamera = async () => {
    try {
      const result = await takePhoto();
      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setHousePhotoUri(a.uri);
        setHousePhotoBase64(a.base64 ?? null);
        setHousePhotoMime(a.mimeType ?? null);
      }
    } catch {
      showToast('Não foi possível usar a câmera.', 'error');
    }
  };

  const submitCreateHouse = async () => {
    if (!houseNameInput.trim()) {
      showToast('Informe um nome para a casa.', 'error');
      return;
    }
    if (!user?.id) return;

    try {
      let photoUrl: string | null = null;

      if (housePhotoUri) {
        setIsUploadingPhoto(true);
        try {
          const uploadResult = await uploadImageToStorage(housePhotoUri, 'houses', 'photos', {
            base64: housePhotoBase64,
            mimeType: housePhotoMime,
          });
          if (uploadResult.url) {
            photoUrl = uploadResult.url;
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload da foto:', uploadError);
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const house = await createHouseMutation.mutateAsync({
        creatorUserId: user.id,
        name: houseNameInput,
        address: houseAddressInput ? houseAddressInput : null,
        photoUrl,
      });

      setCreateModalVisible(false);
      setHouseNameInput('');
      setHouseAddressInput('');
      setHousePhotoUri(null);
      setHousePhotoBase64(null);
      setHousePhotoMime(null);

      setHouseId(house.id);
      showToast(`Casa criada! Convide com o código ${house.inviteCode}.`, 'success');
    } catch (error) {
      console.error('Erro ao criar casa:', error);
      showToast((error as Error).message, 'error');
    }
  };

  const submitJoinHouse = async () => {
    if (!inviteCodeInput.trim()) {
      showToast('Informe o código de convite.', 'error');
      return;
    }

    try {
      const house = await joinHouseMutation.mutateAsync({
        inviteCode: inviteCodeInput.trim(),
      });
      setJoinModalVisible(false);
      setInviteCodeInput('');
      setHouseId(house.id);
      showToast(`Bem-vindo à casa ${house.name}!`, 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  return (
    <ErrorBoundary>
      <Box className="flex-1 bg-[#FDFBF7]">
        <SafeAreaView className="flex-1" edges={['top']}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
            {...(Platform.OS === 'ios' ? { contentInsetAdjustmentBehavior: 'automatic' as const } : {})}
          >
            <Box className="px-6 pt-8 pb-4">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm active:scale-[0.95] mb-4 self-start"
              >
                <ArrowLeft size={20} color="#0f172a" />
              </Pressable>
              <ScreenGreeting firstName={greetingFirstName} variant="ola" />
              <Heading size="xl" className="font-bold text-slate-900 mt-1">
                Casa & Membros
              </Heading>
              <Text className="text-sm text-slate-500 mt-1">{houses.length} casa(s)</Text>
              <Text className="text-xs text-slate-400 mt-2 leading-5">
                Gerencie membros, convites e permissões da residência.
              </Text>
            </Box>

            <Box className="mx-6 mb-5 p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm">
              <HStack className="items-center gap-2 mb-4">
                <Users size={20} color="#0f172a" />
                <Heading size="md" className="font-bold text-slate-900">
                  Minhas casas
                </Heading>
              </HStack>

              {housesLoading ? (
                <VStack className="items-center py-8 gap-2">
                  <ActivityIndicator color={Colors.primary} />
                  <Text className="text-slate-500 text-sm">Carregando...</Text>
                </VStack>
              ) : houses.length === 0 ? (
                <VStack className="items-center py-8 gap-2">
                  <Text className="text-slate-900 font-semibold">Nenhuma casa ainda</Text>
                  <Text className="text-slate-500 text-sm text-center">
                    Crie uma nova ou entre com um código de convite.
                  </Text>
                </VStack>
              ) : (
                <VStack className="gap-3">
                  {houses.map(({ house, membership }) => {
                    const active = house.id === houseId;
                    return (
                      <Pressable
                        key={house.id}
                        onPress={() => setHouseId(house.id)}
                        className={`flex-row items-center gap-3 p-4 rounded-2xl border ${
                          active
                            ? 'border-2 border-[#FDE047] bg-[#FDE047]/10'
                            : 'border border-slate-100 bg-slate-50'
                        }`}
                      >
                        <Box className="w-10 h-10 rounded-xl bg-white border border-slate-100 items-center justify-center">
                          <HomeIcon size={18} color={active ? '#0f172a' : '#64748b'} />
                        </Box>
                        <VStack className="flex-1">
                          <Text className={`text-base font-semibold ${active ? 'text-slate-900' : 'text-slate-800'}`}>
                            {house.name}
                          </Text>
                          <Text className="text-xs text-slate-500 mt-1">
                            {membership.role === 'ADMIN' ? 'Admin' : 'Membro'} ·{' '}
                            {new Date(membership.joinedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </Text>
                        </VStack>
                      </Pressable>
                    );
                  })}
                </VStack>
              )}

              <HStack className="gap-3 mt-5">
                <Pressable
                  onPress={() => {
                    setHouseNameInput('');
                    setHouseAddressInput('');
                    setHousePhotoUri(null);
                    setHousePhotoBase64(null);
                    setHousePhotoMime(null);
                    setCreateModalVisible(true);
                  }}
                  className="flex-1 flex-row items-center justify-center bg-[#FDE047] h-14 rounded-[24px] gap-2 shadow-lg shadow-yellow-200 active:scale-[0.98]"
                >
                  <Plus size={20} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-[15px]">Criar casa</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setInviteCodeInput('');
                    setJoinModalVisible(true);
                  }}
                  className="flex-1 flex-row items-center justify-center bg-white border border-slate-100 h-14 rounded-[24px] gap-2 shadow-sm active:scale-[0.98]"
                >
                  <LogIn size={20} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-[14px]">Entrar</Text>
                </Pressable>
              </HStack>
            </Box>

            {currentHouse ? (
              <>
                <Box className="mx-6 mb-5 p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                  <HStack className="items-center gap-2 mb-4">
                    <Settings size={20} color="#0f172a" />
                    <Heading size="md" className="font-bold text-slate-900">
                      Resumo da casa
                    </Heading>
                  </HStack>
                  <HStack className="justify-between items-center py-2">
                    <Text className="text-sm text-slate-500">Casa atual</Text>
                    <Text className="text-base font-semibold text-slate-900">{currentHouse.house.name}</Text>
                  </HStack>
                  <HStack className="justify-between items-center py-2">
                    <Text className="text-sm text-slate-500">Membros</Text>
                    <Text className="text-base font-semibold text-slate-900">{members.length}</Text>
                  </HStack>
                  <Pressable
                    onPress={() => void copyInviteCode(currentHouse.house.inviteCode)}
                    className="flex-row items-center justify-center gap-2 bg-[#FDE047] h-12 rounded-[24px] mt-3 shadow-lg shadow-yellow-200 active:scale-[0.98]"
                  >
                    <Copy size={18} color="#0f172a" />
                    <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                      Copiar código: {currentHouse.house.inviteCode}
                    </Text>
                  </Pressable>
                </Box>

                <Box className="mx-6 mb-5 p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                  <HStack className="items-center gap-2 mb-4">
                    <Users size={20} color="#0f172a" />
                    <Heading size="md" className="font-bold text-slate-900">
                      Membros
                    </Heading>
                  </HStack>
                  {membersLoading ? (
                    <Box className="items-center py-8">
                      <ActivityIndicator color={Colors.primary} />
                    </Box>
                  ) : members.length === 0 ? (
                    <Text className="text-slate-500 text-sm">Nenhum membro encontrado.</Text>
                  ) : (
                    <VStack className="gap-0">
                      {members.map((member, index) => (
                        <HStack
                          key={member.id}
                          className={`items-center gap-3 py-4 ${
                            index < members.length - 1 ? 'border-b border-slate-100' : ''
                          }`}
                        >
                          <Box className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-100 items-center justify-center">
                            {member.role === 'ADMIN' ? (
                              <Shield size={16} color="#0f172a" />
                            ) : (
                              <Users size={16} color="#64748b" />
                            )}
                          </Box>
                          <VStack className="flex-1">
                            <Text className="text-base font-semibold text-slate-900">
                              {member.user.name ?? member.user.email}
                            </Text>
                            <Text className="text-xs text-slate-500 mt-0.5">
                              {member.user.email} · {formatRole(member.role)}
                            </Text>
                          </VStack>
                          <HStack className="gap-2">
                            {member.userId === user?.id ? (
                              <Pressable
                                onPress={handleLeaveHouse}
                                className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 items-center justify-center"
                              >
                                <LogOut size={14} color="#ef4444" />
                              </Pressable>
                            ) : isAdmin ? (
                              <>
                                <Pressable
                                  onPress={() => handleUpdateRole(member)}
                                  className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center"
                                >
                                  <Shield size={14} color="#0f172a" />
                                </Pressable>
                                <Pressable
                                  onPress={() => handleRemoveMember(member)}
                                  className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 items-center justify-center"
                                >
                                  <UserMinus size={14} color="#ef4444" />
                                </Pressable>
                              </>
                            ) : null}
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Box>
              </>
            ) : null}

            <Box className="mx-6 mb-8 p-5 bg-white rounded-[32px] border border-red-100 shadow-sm">
              <HStack className="items-center gap-2 mb-2">
                <LogOut size={20} color="#dc2626" />
                <Heading size="md" className="font-bold text-red-600">
                  Sair da conta
                </Heading>
              </HStack>
              <Text className="text-sm text-slate-500 mb-4 leading-5">
                Encerre sua sessão. Você poderá entrar novamente com seu e-mail e senha.
              </Text>
              <Pressable
                onPress={() => setConfirm({ type: 'signOut' })}
                className="flex-row items-center justify-center gap-2 bg-red-50 border border-red-200 h-12 rounded-[24px] active:opacity-90"
              >
                <LogOut size={18} color="#dc2626" />
                <Text className="text-red-600 font-bold">Sair agora</Text>
              </Pressable>
            </Box>
          </ScrollView>

          <AlertDialog isOpen={confirm !== null && confirm.type !== 'signOut'} onClose={closeConfirm}>
            <AlertDialogBackdrop />
            <AlertDialogContent>
              <AlertDialogHeader>
                <Heading size="lg">{confirmTitle}</Heading>
              </AlertDialogHeader>
              <AlertDialogBody>
                <Text className="text-slate-600 leading-6">{confirmBody}</Text>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button variant="outline" action="secondary" onPress={closeConfirm}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button
                  action="negative"
                  onPress={() => void runConfirm()}
                  isDisabled={confirmPending}
                >
                  <ButtonText>
                    {confirmPending
                      ? confirm?.type === 'leaveHouse'
                        ? 'Saindo...'
                        : 'Aguarde...'
                      : confirm?.type === 'removeMember'
                        ? 'Remover'
                        : confirm?.type === 'updateRole'
                          ? 'Confirmar'
                          : 'Sair'}
                  </ButtonText>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog isOpen={confirm?.type === 'signOut'} onClose={closeConfirm}>
            <AlertDialogBackdrop />
            <AlertDialogContent>
              <AlertDialogHeader>
                <Heading size="lg">Sair da conta</Heading>
              </AlertDialogHeader>
              <AlertDialogBody>
                <Text className="text-slate-600 leading-6">{confirmBody}</Text>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button variant="outline" action="secondary" onPress={closeConfirm}>
                  <ButtonText>Cancelar</ButtonText>
                </Button>
                <Button action="negative" onPress={() => void runConfirm()} isDisabled={confirmPending}>
                  <ButtonText>Sair</ButtonText>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {toast ? (
            <Toast
              visible={toast.visible}
              message={toast.message}
              type={toast.type}
              onDismiss={() => setToast(null)}
            />
          ) : null}
        </SafeAreaView>

        {/* Criar casa */}
        <RNModal
          visible={isCreateModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => !createHouseMutation.isPending && !isUploadingPhoto && setCreateModalVisible(false)}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
            style={{ flex: 1 }}
          >
            <View className="flex-1 justify-end" style={overlayRootStyle}>
              <LumaModalOverlay
                onRequestClose={() =>
                  !createHouseMutation.isPending && !isUploadingPhoto && setCreateModalVisible(false)
                }
              />
              <GestureHandlerRootView style={sheetWrapperStyle}>
                <Animated.View
                  entering={SlideInDown.springify()
                    .damping(Platform.OS === 'ios' ? 22 : 24)
                    .stiffness(Platform.OS === 'ios' ? 340 : 300)
                    .mass(Platform.OS === 'ios' ? 0.75 : 0.85)}
                  style={sheetOuterStyle}
                  className="shadow-2xl"
                >
                  <Box className="w-full items-center pt-2 pb-2">
                    <Box className="w-12 h-1 bg-slate-200 rounded-full" />
                  </Box>
                  <HStack className="justify-between items-center px-8 mb-4">
                    <Heading size="2xl" className="font-bold text-slate-900">
                      Nova casa
                    </Heading>
                    <Pressable
                      onPress={() => setCreateModalVisible(false)}
                      isDisabled={createHouseMutation.isPending || isUploadingPhoto}
                      className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 items-center justify-center"
                    >
                      <X size={18} color="#0f172a" />
                    </Pressable>
                  </HStack>

                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 24 }}
                  >
                    <VStack className="gap-4 pb-6">
                      <VStack className="gap-2">
                        <Text className="text-sm text-slate-500 font-medium">Nome da casa</Text>
                        <Input className="h-14 border border-slate-200 bg-white rounded-2xl">
                          <InputField
                            value={houseNameInput}
                            onChangeText={setHouseNameInput}
                            placeholder="Nome"
                            className="text-base text-slate-900 px-3"
                            placeholderTextColor="#94a3b8"
                          />
                        </Input>
                      </VStack>
                      <VStack className="gap-2">
                        <Text className="text-sm text-slate-500 font-medium">Endereço (opcional)</Text>
                        <Input className="h-14 border border-slate-200 bg-white rounded-2xl">
                          <InputField
                            value={houseAddressInput}
                            onChangeText={setHouseAddressInput}
                            placeholder="Endereço"
                            className="text-base text-slate-900 px-3"
                            placeholderTextColor="#94a3b8"
                          />
                        </Input>
                      </VStack>

                      <VStack className="gap-2">
                        <Text className="text-sm text-slate-500 font-medium">Foto (opcional)</Text>
                        {housePhotoUri ? (
                          <Box className="relative w-full h-[120px] rounded-2xl overflow-hidden">
                            <Image source={{ uri: housePhotoUri }} className="w-full h-full" resizeMode="cover" />
                            <Pressable
                              onPress={() => {
                                setHousePhotoUri(null);
                                setHousePhotoBase64(null);
                                setHousePhotoMime(null);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                            >
                              <X size={16} color="#fff" />
                            </Pressable>
                          </Box>
                        ) : (
                          <VStack className="gap-2">
                            <Pressable
                              onPress={() => void pickFromGallery()}
                              className="flex-row items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50"
                            >
                              <Camera size={22} color="#0f172a" />
                              <Text className="text-slate-900 font-medium">Galeria</Text>
                            </Pressable>
                            {Platform.OS !== 'web' ? (
                              <Pressable
                                onPress={() => void pickFromCamera()}
                                className="flex-row items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-slate-200 bg-white"
                              >
                                <Camera size={22} color="#0f172a" />
                                <Text className="text-slate-900 font-medium">Câmera</Text>
                              </Pressable>
                            ) : null}
                          </VStack>
                        )}
                      </VStack>

                      <HStack className="gap-3 justify-end mt-2">
                        <Button
                          variant="outline"
                          action="secondary"
                          onPress={() => setCreateModalVisible(false)}
                          isDisabled={createHouseMutation.isPending || isUploadingPhoto}
                        >
                          <ButtonText>Cancelar</ButtonText>
                        </Button>
                        <Button
                          action="primary"
                          onPress={() => void submitCreateHouse()}
                          isDisabled={createHouseMutation.isPending || isUploadingPhoto}
                        >
                          <ButtonText>
                            {createHouseMutation.isPending || isUploadingPhoto
                              ? isUploadingPhoto
                                ? 'Enviando foto...'
                                : 'Salvando...'
                              : 'Criar casa'}
                          </ButtonText>
                        </Button>
                      </HStack>
                    </VStack>
                  </ScrollView>
                </Animated.View>
              </GestureHandlerRootView>
            </View>
          </KeyboardAvoidingView>
        </RNModal>

        {/* Entrar com código */}
        <RNModal
          visible={isJoinModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => !joinHouseMutation.isPending && setJoinModalVisible(false)}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
            style={{ flex: 1 }}
          >
            <View className="flex-1 justify-end" style={overlayRootStyle}>
              <LumaModalOverlay onRequestClose={() => !joinHouseMutation.isPending && setJoinModalVisible(false)} />
              <GestureHandlerRootView style={sheetWrapperStyle}>
                <Animated.View
                  entering={SlideInDown.springify()
                    .damping(Platform.OS === 'ios' ? 22 : 24)
                    .stiffness(Platform.OS === 'ios' ? 340 : 300)
                    .mass(Platform.OS === 'ios' ? 0.75 : 0.85)}
                  style={sheetOuterStyle}
                  className="shadow-2xl"
                >
                  <Box className="w-full items-center pt-2 pb-2">
                    <Box className="w-12 h-1 bg-slate-200 rounded-full" />
                  </Box>
                  <HStack className="justify-between items-center px-8 mb-4">
                    <Heading size="2xl" className="font-bold text-slate-900">
                      Entrar com código
                    </Heading>
                    <Pressable
                      onPress={() => setJoinModalVisible(false)}
                      isDisabled={joinHouseMutation.isPending}
                      className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 items-center justify-center"
                    >
                      <X size={18} color="#0f172a" />
                    </Pressable>
                  </HStack>

                  <VStack className="px-8 pb-8 gap-4" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
                    <VStack className="gap-2">
                      <Text className="text-sm text-slate-500 font-medium">Código de convite</Text>
                      <Input className="h-14 border border-slate-200 bg-white rounded-2xl">
                        <InputField
                          value={inviteCodeInput}
                          onChangeText={setInviteCodeInput}
                          autoCapitalize="none"
                          placeholder="Cole o código"
                          className="text-base text-slate-900 px-3"
                          placeholderTextColor="#94a3b8"
                        />
                      </Input>
                    </VStack>
                    <HStack className="gap-3 justify-end">
                      <Button
                        variant="outline"
                        action="secondary"
                        onPress={() => setJoinModalVisible(false)}
                        isDisabled={joinHouseMutation.isPending}
                      >
                        <ButtonText>Cancelar</ButtonText>
                      </Button>
                      <Button action="primary" onPress={() => void submitJoinHouse()} isDisabled={joinHouseMutation.isPending}>
                        <ButtonText>{joinHouseMutation.isPending ? 'Entrando...' : 'Entrar na casa'}</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                </Animated.View>
              </GestureHandlerRootView>
            </View>
          </KeyboardAvoidingView>
        </RNModal>
      </Box>
    </ErrorBoundary>
  );
}

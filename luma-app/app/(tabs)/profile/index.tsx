import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, ChevronLeft, User, Mail, Phone, Save, LogOut, Cake, Trophy, Flame, Star } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth.store';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { updateUser, getUser, getGameProfile, computeAge, type UserGameProfile } from '@/services/user.service';
import { getTabScrollBottomPadding } from '@/lib/screenLayout';
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

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  const [gameProfile, setGameProfile] = useState<UserGameProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' } | null>(
    null
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    void loadUserData();
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const userData = await getUser(user.id);
      if (userData) {
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setAvatarUrl(userData.avatar_url);
        setBirthDate(userData.birth_date);
        setIsMinor(!!userData.is_minor);

        if (userData.is_minor) {
          const gp = await getGameProfile(user.id).catch(() => null);
          setGameProfile(gp);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      showToast('Não foi possível carregar os dados do perfil.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      await updateUser(user.id, {
        name: name.trim() ? name.trim() : undefined,
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
      });

      useAuthStore.setState({
        user: {
          ...user,
          name: name.trim() || null,
          avatarUrl,
        },
      });

      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showToast('Não foi possível salvar as alterações. Tente novamente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSignOut = async () => {
    try {
      await signOut();
      setShowSignOutDialog(false);
      router.replace('/(auth)/login');
    } catch {
      showToast('Não foi possível sair da conta.', 'error');
      setShowSignOutDialog(false);
    }
  };

  const scrollBottomPadding = getTabScrollBottomPadding(insets.bottom);
  const greetingFirstName = user?.name?.split(' ')[0] ?? '';

  if (isLoading) {
    return (
      <Box className="flex-1 bg-[#FAF8F2] items-center justify-center">
        <ActivityIndicator size="large" color="#A5A0AE" />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box className="flex-1 bg-[#FAF8F2]">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          className="flex-1"
        >
          <SafeAreaView className="flex-1" edges={['top']}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
              keyboardShouldPersistTaps="handled"
              {...(Platform.OS === 'ios' ? { contentInsetAdjustmentBehavior: 'automatic' as const } : {})}
            >
              <Box className="px-6 pt-12 pb-6">
                <HStack className="justify-between items-center mb-4">
                  <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white border border-[#EAE6DC] items-center justify-center shadow-sm active:scale-[0.95]"
                  >
                    <ArrowLeft size={20} color="#1B1725" />
                  </Pressable>
                  <Box className="w-[88px]" />
                </HStack>
                <ScreenGreeting firstName={greetingFirstName} variant="ola" />
                <HStack space="xs" className="items-center mt-1">
                  <Heading size="xl" className="font-bold text-[#1B1725]">
                    Meu Perfil
                  </Heading>
                  <ChevronLeft size={18} className="text-[#A5A0AE] -rotate-90" />
                </HStack>
              </Box>

              <Box className="mx-6 mb-5 p-6 bg-white rounded-[20px] border border-[#EAE6DC] shadow-sm">
                <ProfilePhotoUpload
                  userId={user?.id || ''}
                  currentAvatarUrl={avatarUrl}
                  onUploadComplete={(newUrl) => {
                    setAvatarUrl(newUrl);
                    useAuthStore.setState((s) =>
                      s.user ? { user: { ...s.user, avatarUrl: newUrl } } : {}
                    );
                  }}
                  onRemoveComplete={() => {
                    setAvatarUrl(null);
                    useAuthStore.setState((s) =>
                      s.user ? { user: { ...s.user, avatarUrl: null } } : {}
                    );
                  }}
                  size={120}
                />
              </Box>

              <Box className="mx-6 mb-5 p-6 bg-white rounded-[20px] border border-[#EAE6DC] shadow-sm gap-5">
                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <User size={20} color="#1B1725" />
                    <Text className="text-sm font-semibold text-[#1B1725]">Nome</Text>
                  </HStack>
                  <Input className="h-14 border border-[#EAE6DC] bg-[#F1EEE6] rounded-2xl">
                    <InputField
                      value={name}
                      onChangeText={setName}
                      placeholder="Seu nome"
                      className="text-base text-[#1B1725] px-3"
                      placeholderTextColor="#A5A0AE"
                    />
                  </Input>
                </VStack>

                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <Mail size={20} color="#1B1725" />
                    <Text className="text-sm font-semibold text-[#1B1725]">E-mail</Text>
                  </HStack>
                  <Input className="h-14 border border-[#EAE6DC] bg-[#F1EEE6] rounded-2xl opacity-90">
                    <InputField
                      value={user?.email || ''}
                      editable={false}
                      className="text-base text-[#6F6A7A] px-3"
                      placeholderTextColor="#A5A0AE"
                    />
                  </Input>
                  <Text className="text-xs text-[#6F6A7A]">O e-mail não pode ser alterado</Text>
                </VStack>

                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <Cake size={20} color="#1B1725" />
                    <Text className="text-sm font-semibold text-[#1B1725]">
                      Data de nascimento
                    </Text>
                  </HStack>
                  <Input className="h-14 border border-[#EAE6DC] bg-[#F1EEE6] rounded-2xl opacity-90">
                    <InputField
                      value={
                        birthDate
                          ? `${birthDate.slice(8, 10)}/${birthDate.slice(5, 7)}/${birthDate.slice(0, 4)}` +
                            (computeAge(birthDate) !== null ? `  •  ${computeAge(birthDate)} anos` : '')
                          : 'Não informada'
                      }
                      editable={false}
                      className="text-base text-[#6F6A7A] px-3"
                    />
                  </Input>
                </VStack>

                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <Phone size={20} color="#1B1725" />
                    <Text className="text-sm font-semibold text-[#1B1725]">Telefone</Text>
                  </HStack>
                  <Input className="h-14 border border-[#EAE6DC] bg-[#F1EEE6] rounded-2xl">
                    <InputField
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="(00) 00000-0000"
                      keyboardType="phone-pad"
                      className="text-base text-[#1B1725] px-3"
                      placeholderTextColor="#A5A0AE"
                    />
                  </Input>
                </VStack>

                <Pressable
                  onPress={() => void handleSave()}
                  disabled={isSaving}
                  className={`flex-row items-center justify-center gap-2 bg-[#F6B51E] h-14 rounded-[14px] shadow-lg shadow-amber-200 active:scale-[0.98] mt-2 ${isSaving ? 'opacity-60' : ''}`}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#1B1725" />
                  ) : (
                    <>
                      <Save size={20} color="#1B1725" />
                      <Text className="text-[#1B1725] font-bold text-[16px]">Salvar alterações</Text>
                    </>
                  )}
                </Pressable>
              </Box>

              {isMinor ? (
                <Box testID="gamification-card" className="mx-6 mb-5 p-6 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-[20px] border border-amber-200 shadow-sm">
                  <HStack className="items-center gap-2 mb-4">
                    <Trophy size={22} color="#b45309" />
                    <Heading size="lg" className="font-bold text-amber-900">
                      Conquistas
                    </Heading>
                  </HStack>
                  <HStack className="justify-between mb-4">
                    <VStack className="items-center flex-1">
                      <Star size={20} color="#b45309" />
                      <Text className="text-2xl font-bold text-amber-900 mt-1">
                        {gameProfile?.xp ?? 0}
                      </Text>
                      <Text className="text-xs text-amber-700">XP</Text>
                    </VStack>
                    <VStack className="items-center flex-1">
                      <Trophy size={20} color="#b45309" />
                      <Text className="text-2xl font-bold text-amber-900 mt-1">
                        {gameProfile?.level ?? 1}
                      </Text>
                      <Text className="text-xs text-amber-700">Nível</Text>
                    </VStack>
                    <VStack className="items-center flex-1">
                      <Flame size={20} color="#D64545" />
                      <Text className="text-2xl font-bold text-amber-900 mt-1">
                        {gameProfile?.streak_days ?? 0}
                      </Text>
                      <Text className="text-xs text-amber-700">Dias seguidos</Text>
                    </VStack>
                  </HStack>
                  <Text className="text-xs text-amber-800 leading-5">
                    {gameProfile?.badges?.length
                      ? `🎖️ ${gameProfile.badges.length} conquista${gameProfile.badges.length > 1 ? 's' : ''} desbloqueada${gameProfile.badges.length > 1 ? 's' : ''}`
                      : 'Complete tarefas para ganhar XP e desbloquear conquistas!'}
                  </Text>
                </Box>
              ) : null}

              <Box className="mx-6 mb-8 p-5 bg-white rounded-[20px] border border-red-100 shadow-sm">
                <HStack className="items-center gap-2 mb-2">
                  <LogOut size={20} color="#D64545" />
                  <Heading size="lg" className="font-bold text-[#D64545]">
                    Sair da conta
                  </Heading>
                </HStack>
                <Text className="text-sm text-[#6F6A7A] mb-4 leading-5">
                  Encerre sua sessão. Você poderá entrar novamente com seu e-mail e senha.
                </Text>
                <Pressable
                  onPress={() => setShowSignOutDialog(true)}
                  className="flex-row items-center justify-center gap-2 bg-[#FBE7E7] border border-red-200 h-12 rounded-[14px] active:opacity-90"
                >
                  <LogOut size={18} color="#D64545" />
                  <Text className="text-[#D64545] font-bold">Sair da conta</Text>
                </Pressable>
              </Box>
            </ScrollView>

            <AlertDialog isOpen={showSignOutDialog} onClose={() => setShowSignOutDialog(false)}>
              <AlertDialogBackdrop />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <Heading size="lg">Sair da conta</Heading>
                </AlertDialogHeader>
                <AlertDialogBody>
                  <Text className="text-[#6F6A7A] leading-6">
                    Tem certeza que deseja sair? Você precisará entrar novamente com e-mail e senha.
                  </Text>
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button variant="outline" action="secondary" onPress={() => setShowSignOutDialog(false)}>
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                  <Button action="negative" onPress={() => void confirmSignOut()}>
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
        </KeyboardAvoidingView>
      </Box>
    </ErrorBoundary>
  );
}

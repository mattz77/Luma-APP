import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, User, Mail, Phone, Save, LogOut } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth.store';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { updateUser, getUser } from '@/services/user.service';
import { Colors } from '@/constants/Colors';
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
      <Box className="flex-1 bg-[#FDFBF7] items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box className="flex-1 bg-[#FDFBF7]">
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
              <Box className="px-6 pt-8 pb-4">
                <HStack className="items-center justify-between mb-2">
                  <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm active:scale-[0.95]"
                  >
                    <ArrowLeft size={20} color="#0f172a" />
                  </Pressable>
                  <Box className="w-10" />
                </HStack>
                <ScreenGreeting firstName={greetingFirstName} variant="ola" />
                <Heading size="xl" className="font-bold text-slate-900 mt-1">
                  Meu Perfil
                </Heading>
              </Box>

              <Box className="mx-6 mb-5 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
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

              <Box className="mx-6 mb-5 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm gap-5">
                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <User size={20} color="#0f172a" />
                    <Text className="text-sm font-semibold text-slate-900">Nome</Text>
                  </HStack>
                  <Input className="h-14 border border-slate-200 bg-slate-50 rounded-2xl">
                    <InputField
                      value={name}
                      onChangeText={setName}
                      placeholder="Seu nome"
                      className="text-base text-slate-900 px-3"
                      placeholderTextColor="#94a3b8"
                    />
                  </Input>
                </VStack>

                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <Mail size={20} color="#0f172a" />
                    <Text className="text-sm font-semibold text-slate-900">E-mail</Text>
                  </HStack>
                  <Input className="h-14 border border-slate-200 bg-slate-100 rounded-2xl opacity-90">
                    <InputField
                      value={user?.email || ''}
                      editable={false}
                      className="text-base text-slate-500 px-3"
                      placeholderTextColor="#94a3b8"
                    />
                  </Input>
                  <Text className="text-xs text-slate-500">O e-mail não pode ser alterado</Text>
                </VStack>

                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <Phone size={20} color="#0f172a" />
                    <Text className="text-sm font-semibold text-slate-900">Telefone</Text>
                  </HStack>
                  <Input className="h-14 border border-slate-200 bg-slate-50 rounded-2xl">
                    <InputField
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="(00) 00000-0000"
                      keyboardType="phone-pad"
                      className="text-base text-slate-900 px-3"
                      placeholderTextColor="#94a3b8"
                    />
                  </Input>
                </VStack>

                <Pressable
                  onPress={() => void handleSave()}
                  isDisabled={isSaving}
                  className={`flex-row items-center justify-center gap-2 bg-[#FDE047] h-14 rounded-[24px] shadow-lg shadow-yellow-200 active:scale-[0.98] mt-2 ${isSaving ? 'opacity-60' : ''}`}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <>
                      <Save size={20} color="#0f172a" />
                      <Text className="text-slate-900 font-bold text-[16px]">Salvar alterações</Text>
                    </>
                  )}
                </Pressable>
              </Box>

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
                  onPress={() => setShowSignOutDialog(true)}
                  className="flex-row items-center justify-center gap-2 bg-red-50 border border-red-200 h-12 rounded-[24px] active:opacity-90"
                >
                  <LogOut size={18} color="#dc2626" />
                  <Text className="text-red-600 font-bold">Sair da conta</Text>
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
                  <Text className="text-slate-600 leading-6">
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

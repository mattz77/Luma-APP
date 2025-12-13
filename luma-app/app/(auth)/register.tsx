import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthIllustration } from '@/components/auth/AuthIllustration';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Box } from '@/components/ui/box';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signUp = useAuthStore((state) => state.signUp);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  const translateErrorMessage = (message: string) => {
    if (message.includes('invalid')) {
      return 'E-mail inválido. Utilize um endereço válido.';
    }

    if (message.includes('Password should be at least')) {
      return 'A senha deve conter pelo menos 6 caracteres.';
    }

    if (message.includes('User already registered')) {
      return 'Este e-mail já está registrado. Faça login ou use outro endereço.';
    }

    return message || 'Não foi possível concluir o cadastro.';
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMessage('Informe nome, e-mail e uma senha segura.');
      return;
    }

    try {
      setErrorMessage(null);
      await signUp(trimmedEmail, password, trimmedName);
      // Redirecionar para verificação de email
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: trimmedEmail },
      } as any);
    } catch (error) {
      console.error(error);
      setErrorMessage(translateErrorMessage((error as Error).message));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      await signInWithGoogle();
      
      // Verificar se o email foi confirmado (social login geralmente já confirma)
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && !userData.user.email_confirmed_at) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: userData.user.email || '' },
        } as any);
        return;
      }
      
      router.replace('/(auth)/onboarding');
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || 'Erro ao fazer login com Google');
    }
  };

  const handleAppleLogin = async () => {
    try {
      setErrorMessage(null);
      await signInWithApple();
      
      // Verificar se o email foi confirmado (social login geralmente já confirma)
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && !userData.user.email_confirmed_at) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: userData.user.email || '' },
        } as any);
        return;
      }
      
      router.replace('/(auth)/onboarding');
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || 'Erro ao fazer login com Apple');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-100"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack space="lg" className="flex-1">
          {/* Illustration */}
          <AuthIllustration type="sign-up" />

          {/* Title */}
          <VStack space="xs" className="items-center">
            <Heading size="3xl" bold className="text-gray-900">
              Cadastrar
            </Heading>
            <Text size="sm" className="text-gray-500 text-center px-5">
              Use informações válidas para continuar
            </Text>
          </VStack>

          {/* Form */}
          <Box className="bg-white rounded-3xl p-6 shadow-sm">
            <VStack space="md">
              <AuthInput
                label="Nome completo"
                value={name}
                onChangeText={setName}
                placeholder="Nome completo"
                type="text"
                autoCapitalize="words"
                error={!!errorMessage}
              />

              <AuthInput
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                type="email"
                keyboardType="email-address"
                error={!!errorMessage}
              />

              <AuthInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                type="password"
                error={!!errorMessage}
              />

              {errorMessage ? (
                <Text size="sm" className="text-error-500 text-center">
                  {errorMessage}
                </Text>
              ) : null}

              <Text size="sm" className="text-gray-500 text-center px-2 leading-5">
                Ao se cadastrar, você concorda com nossos{' '}
                <Text size="sm" className="text-blue-600 font-medium">
                  Termos e Condições
                </Text>{' '}
                e{' '}
                <Text size="sm" className="text-blue-600 font-medium">
                  Política de Privacidade
                </Text>
              </Text>

              <Button
                size="xl"
                variant="solid"
                action="primary"
                onPress={handleRegister}
                isDisabled={loading}
                className="bg-blue-600 h-14 rounded-xl"
              >
                {loading ? (
                  <ButtonSpinner />
                ) : (
                  <ButtonText className="text-white text-base font-semibold">
                    Criar Conta
                  </ButtonText>
                )}
              </Button>

              {/* Social Login Section */}
              <VStack space="md" className="mt-2">
                <Text size="sm" className="text-gray-500 text-center">
                  Ou continue com
                </Text>
                <GoogleSignInButton
                  onPress={handleGoogleLogin}
                  loading={loading}
                />
              </VStack>
            </VStack>
          </Box>

          {/* Footer */}
          <HStack space="xs" className="justify-center items-center mt-6">
            <Text size="sm" className="text-gray-500">
              Já tem uma conta?
            </Text>
            <Link href="/(auth)/login">
              <Text size="sm" className="text-blue-600 font-semibold">
                Entrar
              </Text>
            </Link>
          </HStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



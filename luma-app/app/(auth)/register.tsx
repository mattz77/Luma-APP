import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
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
              Sign Up
            </Heading>
            <Text size="sm" className="text-gray-500 text-center px-5">
              Use proper information to continue
            </Text>
          </VStack>

          {/* Form */}
          <Box className="bg-white rounded-3xl p-6 shadow-sm">
            <VStack space="md">
              <AuthInput
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                type="text"
                autoCapitalize="words"
                error={!!errorMessage}
              />

              <AuthInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                type="email"
                keyboardType="email-address"
                error={!!errorMessage}
              />

              <AuthInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                type="password"
                error={!!errorMessage}
              />

              {errorMessage ? (
                <Text size="sm" className="text-error-500 text-center">
                  {errorMessage}
                </Text>
              ) : null}

              <Text size="sm" className="text-gray-500 text-center px-2 leading-5">
                By signing up, you are agree to our{' '}
                <Text size="sm" className="text-blue-600 font-medium">
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text size="sm" className="text-blue-600 font-medium">
                  Privacy Policy
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
                    Create Account
                  </ButtonText>
                )}
              </Button>

              {/* Social Login Section */}
              <VStack space="md" className="mt-2">
                <Text size="sm" className="text-gray-500 text-center">
                  Or Continue with
                </Text>
                <HStack space="sm">
                  <SocialLoginButton
                    provider="google"
                    onPress={handleGoogleLogin}
                    loading={loading}
                  />
                  <SocialLoginButton
                    provider="facebook"
                    onPress={() => {}}
                    loading={false}
                  />
                </HStack>
              </VStack>
            </VStack>
          </Box>

          {/* Footer */}
          <HStack space="xs" className="justify-center items-center mt-6">
            <Text size="sm" className="text-gray-500">
              Already have an Account?
            </Text>
            <Link href="/(auth)/login">
              <Text size="sm" className="text-blue-600 font-semibold">
                Sign in
              </Text>
            </Link>
          </HStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



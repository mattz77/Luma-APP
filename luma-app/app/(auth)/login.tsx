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
import { useI18n } from '@/hooks/useI18n';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  const translateErrorMessage = (message: string) => {
    if (message === 'Invalid login credentials') {
      return t('errors.invalidCredentials');
    }

    if (message === 'Email not confirmed') {
      return t('errors.emailNotConfirmed');
    }

    return message || t('errors.generic');
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setErrorMessage(t('errors.invalidCredentials'));
      return;
    }

    try {
      setErrorMessage(null);
      await signIn(trimmedEmail, password);
      
      // Verificar se o email foi confirmado
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && !userData.user.email_confirmed_at) {
        // Email não confirmado, redirecionar para verificação
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: trimmedEmail },
        } as any);
        return;
      }
      
      router.replace('/(tabs)');
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
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || t('errors.generic'));
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
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message || t('errors.generic'));
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
          <AuthIllustration type="sign-in" />

          {/* Title */}
          <VStack space="xs" className="items-center">
            <Heading size="3xl" bold className="text-gray-900">
              {t('auth.login.title')}
            </Heading>
            <Text size="sm" className="text-gray-500 text-center px-5">
              {t('auth.login.subtitle')}
            </Text>
          </VStack>

          {/* Form */}
          <Box className="bg-white rounded-3xl p-6 shadow-sm">
            <VStack space="md">
              <AuthInput
                label={t('auth.login.email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.login.email')}
                type="email"
                keyboardType="email-address"
                error={!!errorMessage}
              />

              <AuthInput
                label={t('auth.login.password')}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.login.password')}
                type="password"
                error={!!errorMessage}
              />

              {errorMessage ? (
                <Text size="sm" className="text-error-500 text-center">
                  {errorMessage}
                </Text>
              ) : null}

              <Link href="/(auth)/forgot-password">
                <Text size="sm" className="text-blue-600 font-medium text-right mb-2">
                  {t('auth.login.forgotPassword')}
                </Text>
              </Link>

              <Button
                size="xl"
                variant="solid"
                action="primary"
                onPress={handleLogin}
                isDisabled={loading}
                className="bg-blue-600 h-14 rounded-xl"
              >
                {loading ? (
                  <ButtonSpinner />
                ) : (
                  <ButtonText className="text-white text-base font-semibold">
                    {t('auth.login.button')}
                  </ButtonText>
                )}
              </Button>

              {/* Social Login Section */}
              <VStack space="md" className="mt-2">
                <Text size="sm" className="text-gray-500 text-center">
                  {t('auth.login.continueWith')}
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
              {t('auth.login.noAccount')}
            </Text>
            <Link href="/(auth)/register">
              <Text size="sm" className="text-blue-600 font-semibold">
                {t('auth.login.signUp')}
              </Text>
            </Link>
          </HStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



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

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useI18n();
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
      return t('errors.invalidEmail');
    }

    if (message.includes('Password should be at least')) {
      return t('errors.passwordTooShort');
    }

    if (message.includes('User already registered')) {
      return t('errors.userAlreadyRegistered');
    }

    return message || t('errors.generic');
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMessage(t('auth.register.fieldsRequired'));
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
      
      router.replace('/(auth)/onboarding');
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
          <AuthIllustration type="sign-up" />

          {/* Title */}
          <VStack space="xs" className="items-center">
            <Heading size="3xl" bold className="text-gray-900">
              {t('auth.register.title')}
            </Heading>
            <Text size="sm" className="text-gray-500 text-center px-5">
              {t('auth.register.subtitle')}
            </Text>
          </VStack>

          {/* Form */}
          <Box className="bg-white rounded-3xl p-6 shadow-sm">
            <VStack space="md">
              <AuthInput
                label={t('auth.register.fullName')}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.register.fullName')}
                type="text"
                autoCapitalize="words"
                error={!!errorMessage}
              />

              <AuthInput
                label={t('auth.register.email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.register.email')}
                type="email"
                keyboardType="email-address"
                error={!!errorMessage}
              />

              <AuthInput
                label={t('auth.register.password')}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.register.password')}
                type="password"
                error={!!errorMessage}
              />

              {errorMessage ? (
                <Text size="sm" className="text-error-500 text-center">
                  {errorMessage}
                </Text>
              ) : null}

              <Text size="sm" className="text-gray-500 text-center px-2 leading-5">
                {t('auth.register.terms')}{' '}
                <Text size="sm" className="text-blue-600 font-medium">
                  {t('auth.register.termsLink')}
                </Text>{' '}
                {t('auth.register.and')}{' '}
                <Text size="sm" className="text-blue-600 font-medium">
                  {t('auth.register.privacyLink')}
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
                    {t('auth.register.button')}
                  </ButtonText>
                )}
              </Button>

              {/* Social Login Section */}
              <VStack space="md" className="mt-2">
                <Text size="sm" className="text-gray-500 text-center">
                  {t('auth.register.continueWith')}
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
              {t('auth.register.alreadyHaveAccount')}
            </Text>
            <Link href="/(auth)/login">
              <Text size="sm" className="text-blue-600 font-semibold">
                {t('auth.register.signIn')}
              </Text>
            </Link>
          </HStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



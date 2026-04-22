import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { useI18n } from '@/hooks/useI18n';
import { authFontFamilies, authTheme } from '@/lib/auth/authTheme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signUp = useAuthStore((state) => state.signUp);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
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
    <AuthBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 28),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader brandName={t('auth.brand.name')} tagline={t('auth.brand.tagline')} />

          <Text style={styles.screenSubtitle}>{t('auth.register.subtitle')}</Text>

          <VStack space="md" style={styles.formBlock}>
            <AuthInput
              variant="authDark"
              label={t('auth.register.fullName')}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.register.fullName')}
              type="text"
              autoCapitalize="words"
              error={!!errorMessage}
            />

            <AuthInput
              variant="authDark"
              label={t('auth.register.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.register.email')}
              type="email"
              keyboardType="email-address"
              error={!!errorMessage}
            />

            <AuthInput
              variant="authDark"
              label={t('auth.register.password')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.register.password')}
              type="password"
              error={!!errorMessage}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <Text style={styles.terms}>
              {t('auth.register.terms')}{' '}
              <Text style={styles.termsLink}>{t('auth.register.termsLink')}</Text>{' '}
              {t('auth.register.and')}{' '}
              <Text style={styles.termsLink}>{t('auth.register.privacyLink')}</Text>
            </Text>

            <AuthPrimaryButton
              label={t('auth.register.button')}
              onPress={handleRegister}
              loading={loading}
            />

            <AuthDivider label={t('auth.register.continueWith')} />

            <GoogleSignInButton
              onPress={handleGoogleLogin}
              loading={loading}
              label={t('auth.register.googleContinue')}
              variant="authDark"
            />
          </VStack>

          <HStack space="xs" style={styles.footer}>
            <Text style={styles.footerMuted}>{t('auth.register.alreadyHaveAccount')} </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.linkSignup}>{t('auth.register.signIn')}</Text>
              </Pressable>
            </Link>
          </HStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenSubtitle: {
    fontFamily: authFontFamilies.sans,
    fontSize: 14,
    color: authTheme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  formBlock: {
    gap: 2,
  },
  errorText: {
    fontFamily: authFontFamilies.sans,
    fontSize: 12,
    color: authTheme.error,
    paddingLeft: 2,
  },
  terms: {
    fontFamily: authFontFamilies.sans,
    fontSize: 13,
    color: authTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  termsLink: {
    fontFamily: authFontFamilies.sansMedium,
    fontSize: 13,
    color: authTheme.amber,
    fontWeight: '500',
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  footerMuted: {
    fontFamily: authFontFamilies.sans,
    fontSize: 14,
    color: authTheme.textSecondary,
  },
  linkSignup: {
    fontFamily: authFontFamilies.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: authTheme.amber,
  },
});

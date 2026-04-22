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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
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

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && !userData.user.email_confirmed_at) {
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

          <Text style={styles.screenSubtitle}>{t('auth.login.subtitle')}</Text>

          <VStack space="md" style={styles.formBlock}>
            <AuthInput
              variant="authDark"
              label={t('auth.login.email')}
              testID="login-email"
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.login.email')}
              type="email"
              keyboardType="email-address"
              error={!!errorMessage}
            />

            <AuthInput
              variant="authDark"
              label={t('auth.login.password')}
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.login.password')}
              type="password"
              error={!!errorMessage}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <HStack style={styles.forgotRow}>
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable accessibilityRole="link" hitSlop={12}>
                  <Text style={styles.linkForgot}>{t('auth.login.forgotPassword')}</Text>
                </Pressable>
              </Link>
            </HStack>

            <AuthPrimaryButton
              label={t('auth.login.button')}
              testID="login-submit"
              onPress={handleLogin}
              loading={loading}
            />

            <AuthDivider label={t('auth.login.continueWith')} />

            <GoogleSignInButton
              testID="auth-google"
              onPress={handleGoogleLogin}
              loading={loading}
              label={t('auth.login.googleContinue')}
              variant="authDark"
            />
          </VStack>

          <HStack space="xs" style={styles.footer}>
            <Text style={styles.footerMuted}>{t('auth.login.noAccount')} </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.linkSignup}>{t('auth.login.signUp')}</Text>
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
    fontWeight: '400',
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
    fontWeight: '400',
    color: authTheme.error,
    textAlign: 'center',
    paddingLeft: 2,
  },
  forgotRow: {
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  linkForgot: {
    fontFamily: authFontFamilies.sans,
    fontSize: 13,
    fontWeight: '400',
    color: authTheme.amber,
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
    fontWeight: '400',
    color: authTheme.textSecondary,
  },
  linkSignup: {
    fontFamily: authFontFamilies.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: authTheme.amber,
  },
});

import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { useI18n } from '@/hooks/useI18n';
import { authFontFamilies, authTheme } from '@/lib/auth/authTheme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const redirectTo =
    process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL ?? 'https://example.com/auth/callback';

  const handleResetPassword = async () => {
    if (!email) {
      setIsSuccess(false);
      setFeedbackMessage(t('auth.forgotPassword.emailRequired'));
      return;
    }

    setSubmitting(true);
    try {
      setFeedbackMessage(null);
      setIsSuccess(false);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setFeedbackMessage(t('auth.forgotPassword.emailSent'));
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1800);
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setFeedbackMessage((error as Error).message || t('auth.forgotPassword.emailError'));
    } finally {
      setSubmitting(false);
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader brandName={t('auth.brand.name')} tagline={t('auth.brand.tagline')} />

          <Text style={styles.screenTitle}>{t('auth.forgotPassword.title')}</Text>
          <Text style={styles.screenDesc}>{t('auth.forgotPassword.subtitle')}</Text>

          <VStack space="md" style={styles.formInner}>
            <AuthInput
              variant="authDark"
              label={t('auth.forgotPassword.email')}
              testID="forgot-email"
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.forgotPassword.email')}
              type="email"
              keyboardType="email-address"
              error={!!feedbackMessage && !isSuccess}
            />

            {feedbackMessage ? (
              <Text
                style={[
                  styles.feedback,
                  isSuccess ? styles.feedbackOk : styles.feedbackErr,
                ]}
              >
                {feedbackMessage}
              </Text>
            ) : null}

            <AuthPrimaryButton
              label={t('auth.forgotPassword.button')}
              testID="forgot-submit"
              onPress={handleResetPassword}
              loading={submitting}
            />

            <Pressable
              onPress={() => router.back()}
              style={styles.ghostBtn}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={styles.ghostLabel}>{t('common.cancel')}</Text>
            </Pressable>

            <HStack space="xs" style={styles.inlineFooter}>
              <Text style={styles.footerMuted}>{t('auth.forgotPassword.rememberPassword')} </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable accessibilityRole="link">
                  <Text style={styles.linkSignup}>{t('auth.forgotPassword.signIn')}</Text>
                </Pressable>
              </Link>
            </HStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenTitle: {
    fontFamily: authFontFamilies.display,
    fontSize: 22,
    fontWeight: '700',
    color: authTheme.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  screenDesc: {
    fontFamily: authFontFamilies.sans,
    fontSize: 14,
    fontWeight: '400',
    color: authTheme.textSecondary,
    lineHeight: 21,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  formInner: {
    gap: 4,
  },
  feedback: {
    fontFamily: authFontFamilies.sans,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  feedbackOk: {
    color: authTheme.success,
  },
  feedbackErr: {
    color: authTheme.error,
  },
  ghostBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ghostLabel: {
    fontFamily: authFontFamilies.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    color: authTheme.textSecondary,
  },
  inlineFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  footerMuted: {
    fontFamily: authFontFamilies.sans,
    fontSize: 13,
    fontWeight: '400',
    color: authTheme.textSecondary,
  },
  linkSignup: {
    fontFamily: authFontFamilies.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: authTheme.amber,
  },
});

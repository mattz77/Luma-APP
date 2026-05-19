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

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { useI18n } from '@/hooks/useI18n';
import { authFontFamilies, authTheme } from '@/lib/auth/authTheme';
import { passwordResetService } from '@/services/password-reset.service';

const TOTAL_STEPS = 3;
const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 6;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const sanitizedCode = code.replace(/\D/g, '').slice(0, CODE_LENGTH);

  const handleRequestCode = async () => {
    if (!normalizedEmail) {
      setIsSuccess(false);
      setFeedbackMessage(t('auth.forgotPassword.emailRequired'));
      return;
    }

    setSubmitting(true);
    try {
      setFeedbackMessage(null);
      setIsSuccess(false);
      await passwordResetService.requestResetCode(normalizedEmail);

      setIsSuccess(true);
      setFeedbackMessage(t('auth.forgotPassword.codeSent'));
      setCurrentStep(2);
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setFeedbackMessage((error as Error).message || t('auth.forgotPassword.codeRequestError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (sanitizedCode.length !== CODE_LENGTH) {
      setIsSuccess(false);
      setFeedbackMessage(t('auth.forgotPassword.codeInvalid'));
      return;
    }

    setSubmitting(true);
    try {
      setFeedbackMessage(null);
      setIsSuccess(false);

      const token = await passwordResetService.verifyResetCode(normalizedEmail, sanitizedCode);
      setVerificationToken(token);

      setIsSuccess(true);
      setFeedbackMessage(t('auth.forgotPassword.codeVerified'));
      setCurrentStep(3);
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setFeedbackMessage((error as Error).message || t('auth.forgotPassword.codeVerifyError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeReset = async () => {
    if (!verificationToken) {
      setIsSuccess(false);
      setFeedbackMessage(t('auth.forgotPassword.verificationMissing'));
      return;
    }

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      setIsSuccess(false);
      setFeedbackMessage(t('auth.forgotPassword.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsSuccess(false);
      setFeedbackMessage(t('auth.forgotPassword.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      setFeedbackMessage(null);
      setIsSuccess(false);

      await passwordResetService.finalizePasswordReset({
        email: normalizedEmail,
        code: sanitizedCode,
        newPassword,
        verificationToken,
      });

      setIsSuccess(true);
      setFeedbackMessage(t('auth.forgotPassword.passwordUpdated'));
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1800);
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setFeedbackMessage((error as Error).message || t('auth.forgotPassword.passwordUpdateError'));
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
          <Text style={styles.screenDesc}>
            {currentStep === 1
              ? t('auth.forgotPassword.subtitleStep1')
              : currentStep === 2
                ? t('auth.forgotPassword.subtitleStep2')
                : t('auth.forgotPassword.subtitleStep3')}
          </Text>

          <Text style={styles.stepIndicator}>
            {`${t('auth.forgotPassword.stepLabel')} ${currentStep}/${TOTAL_STEPS}`}
          </Text>

          <VStack space="md" style={styles.formInner}>
            {currentStep === 1 ? (
              <AuthInput
                variant="authDark"
                label={t('auth.forgotPassword.email')}
                testID="forgot-email"
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.forgotPassword.email')}
                type="email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!feedbackMessage && !isSuccess}
              />
            ) : null}

            {currentStep === 2 ? (
              <>
                <AuthInput
                  variant="authDark"
                  label={t('auth.forgotPassword.code')}
                  testID="forgot-code"
                  value={sanitizedCode}
                  onChangeText={setCode}
                  placeholder={t('auth.forgotPassword.codePlaceholder')}
                  keyboardType="numeric"
                  error={!!feedbackMessage && !isSuccess}
                />
                <Pressable
                  onPress={handleRequestCode}
                  style={styles.resendBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.forgotPassword.resendCode')}
                >
                  <Text style={styles.resendLabel}>{t('auth.forgotPassword.resendCode')}</Text>
                </Pressable>
              </>
            ) : null}

            {currentStep === 3 ? (
              <>
                <AuthInput
                  variant="authDark"
                  label={t('auth.forgotPassword.newPassword')}
                  testID="forgot-new-password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t('auth.forgotPassword.newPassword')}
                  type="password"
                  error={!!feedbackMessage && !isSuccess}
                />
                <AuthInput
                  variant="authDark"
                  label={t('auth.forgotPassword.confirmPassword')}
                  testID="forgot-confirm-password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('auth.forgotPassword.confirmPassword')}
                  type="password"
                  error={!!feedbackMessage && !isSuccess}
                />
              </>
            ) : null}

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
              label={
                currentStep === 1
                  ? t('auth.forgotPassword.buttonSendCode')
                  : currentStep === 2
                    ? t('auth.forgotPassword.buttonVerifyCode')
                    : t('auth.forgotPassword.buttonResetPassword')
              }
              testID="forgot-submit"
              onPress={
                currentStep === 1
                  ? handleRequestCode
                  : currentStep === 2
                    ? handleVerifyCode
                    : handleFinalizeReset
              }
              loading={submitting}
            />

            {currentStep > 1 ? (
              <Pressable
                onPress={() => {
                  setIsSuccess(false);
                  setFeedbackMessage(null);
                  setCurrentStep((prev) => Math.max(1, prev - 1));
                }}
                style={styles.ghostBtn}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
              >
                <Text style={styles.ghostLabel}>{t('common.back')}</Text>
              </Pressable>
            ) : null}

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
  stepIndicator: {
    fontFamily: authFontFamilies.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    color: authTheme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.4,
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
  resendBtn: {
    alignSelf: 'center',
    minHeight: 32,
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  resendLabel: {
    fontFamily: authFontFamilies.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    color: authTheme.amber,
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

import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthIllustration } from '@/components/auth/AuthIllustration';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Box } from '@/components/ui/box';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const redirectTo =
    process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL ?? 'https://example.com/auth/callback';

  const handleResetPassword = async () => {
    if (!email) {
      setIsSuccess(false);
      setFeedbackMessage('Digite o e-mail cadastrado para receber o link.');
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
      setFeedbackMessage('E-mail enviado! Verifique sua caixa de entrada para redefinir a senha.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setFeedbackMessage((error as Error).message || 'Não foi possível enviar o e-mail.');
    } finally {
      setSubmitting(false);
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
          <AuthIllustration type="forgot-password" />

          {/* Title */}
          <VStack space="xs" className="items-center">
            <Heading size="3xl" bold className="text-gray-900">
              Forget Password
            </Heading>
            <Text size="sm" className="text-gray-500 text-center px-5 leading-5">
              Don't worry it happens. Please enter the address associate with your account
            </Text>
          </VStack>

          {/* Form */}
          <Box className="bg-white rounded-3xl p-6 shadow-sm">
            <VStack space="md">
              <AuthInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                type="email"
                keyboardType="email-address"
                error={!!feedbackMessage && !isSuccess}
              />

              {feedbackMessage ? (
                <Text
                  size="sm"
                  className={`text-center ${
                    isSuccess ? 'text-success-600' : 'text-error-500'
                  }`}
                >
                  {feedbackMessage}
                </Text>
              ) : null}

              <Button
                size="xl"
                variant="solid"
                action="primary"
                onPress={handleResetPassword}
                isDisabled={submitting}
                className="bg-blue-600 h-14 rounded-xl"
              >
                {submitting ? (
                  <ButtonSpinner />
                ) : (
                  <ButtonText className="text-white text-base font-semibold">
                    Send OTP
                  </ButtonText>
                )}
              </Button>

              <HStack space="xs" className="justify-center items-center mt-2">
                <Text size="sm" className="text-gray-500">
                  You remember you password?
                </Text>
                <Link href="/(auth)/login">
                  <Text size="sm" className="text-blue-600 font-semibold">
                    Sign in
                  </Text>
                </Link>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



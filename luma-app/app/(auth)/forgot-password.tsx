import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { cardShadowStyle } from '@/lib/styles';

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
      style={styles.container}
    >
      <View style={[styles.form, cardShadowStyle]}>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>
          Informe seu e-mail para receber instruções de redefinição de senha.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        {feedbackMessage ? (
          <Text style={[styles.feedbackMessage, isSuccess && styles.feedbackMessageSuccess]}>
            {feedbackMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          onPress={handleResetPassword}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Enviando...' : 'Enviar e-mail'}
          </Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          Voltar ao login
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    fontSize: 16,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackMessage: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  feedbackMessageSuccess: {
    color: '#15803d',
  },
  link: {
    marginTop: 8,
    textAlign: 'center',
    color: '#1d4ed8',
    fontSize: 14,
  },
});


import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { cardShadowStyle } from '@/lib/styles';
import { Colors } from '@/constants/Colors';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  // Verificar se o email já foi confirmado
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user) return;

      try {
        const { data } = await supabase.auth.getUser();
        if (data.user?.email_confirmed_at) {
          // Email já confirmado, redirecionar para onboarding
          router.replace('/(auth)/onboarding');
        }
      } catch (error) {
        console.error('Erro ao verificar confirmação de email:', error);
      }
    };

    checkEmailVerification();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        router.replace('/(auth)/onboarding');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, router]);

  const handleResendEmail = async () => {
    if (!email) {
      setErrorMessage('Email não encontrado. Faça login novamente.');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      setErrorMessage((error as Error).message || 'Erro ao reenviar email de verificação.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={64} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Verifique seu e-mail</Text>
        <Text style={styles.subtitle}>
          Enviamos um link de verificação para{'\n'}
          <Text style={styles.emailText}>{email || 'seu e-mail'}</Text>
        </Text>

        <View style={[styles.card, cardShadowStyle]}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              1. Abra sua caixa de entrada{'\n'}
              2. Clique no link de verificação{'\n'}
              3. Volte ao app para continuar
            </Text>
          </View>

          {resendSuccess && (
            <View style={styles.successContainer}>
              <CheckCircle size={20} color={Colors.primary} />
              <Text style={styles.successText}>Email reenviado com sucesso!</Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.resendButtonText}>Reenviar email</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Text style={styles.backButtonText}>Voltar para login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  instructionContainer: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  resendButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});


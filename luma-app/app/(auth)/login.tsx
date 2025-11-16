import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signIn = useAuthStore((state) => state.signIn);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  const translateErrorMessage = (message: string) => {
    if (message === 'Invalid login credentials') {
      return 'Credenciais inválidas. Verifique e-mail e senha.';
    }

    if (message === 'Email not confirmed') {
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
    }

    return message || 'Não foi possível iniciar a sessão.';
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Informe e-mail e senha.');
      return;
    }

    try {
      setErrorMessage(null);
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      setErrorMessage(translateErrorMessage((error as Error).message));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.form, cardShadowStyle]}>
        <Text style={styles.title}>Bem-vindo(a) ao Luma</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry
          style={styles.input}
        />

        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/forgot-password" style={styles.link}>
          Esqueci minha senha
        </Link>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Ainda não tem conta?</Text>
        <Link href="/(auth)/register" style={styles.footerLink}>
          Criar conta
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 8,
    textAlign: 'center',
    color: '#1d4ed8',
    fontSize: 14,
  },
  errorMessage: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
  },
});


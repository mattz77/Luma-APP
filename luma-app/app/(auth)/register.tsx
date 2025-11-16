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

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signUp = useAuthStore((state) => state.signUp);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  const translateErrorMessage = (message: string) => {
    if (message.includes('invalid')) {
      return 'E-mail inválido. Utilize um endereço válido.';
    }

    if (message.includes('Password should be at least')) {
      return 'A senha deve conter pelo menos 6 caracteres.';
    }

    if (message.includes('User already registered')) {
      return 'Este e-mail já está registrado. Faça login ou use outro endereço.';
    }

    return message || 'Não foi possível concluir o cadastro.';
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setErrorMessage('Informe nome, e-mail e senha.');
      return;
    }

    try {
      setErrorMessage(null);
      await signUp(email.trim().toLowerCase(), password, name.trim());
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
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Organize sua casa com a Luma</Text>

        <TextInput value={name} onChangeText={setName} placeholder="Nome" style={styles.input} />

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

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Criar conta</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já possui conta?</Text>
        <Link href="/(auth)/login" style={styles.footerLink}>
          Fazer login
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
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
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


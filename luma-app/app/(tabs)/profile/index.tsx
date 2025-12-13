import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, User, Mail, Phone, Save, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth.store';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { updateUser, getUser } from '@/services/user.service';
import { Colors } from '@/constants/Colors';
import { cardShadowStyle } from '@/lib/styles';

export default function ProfileScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const userData = await getUser(user.id);
      if (userData) {
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setAvatarUrl(userData.avatar_url);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      await updateUser(user.id, {
        name: name.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
      });

      // Atualizar store de auth
      useAuthStore.setState({
        user: {
          ...user,
          name: name.trim() || null,
          avatarUrl,
        },
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair da conta.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Meu Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Photo Upload */}
        <View style={[styles.card, cardShadowStyle]}>
          <ProfilePhotoUpload
            userId={user?.id || ''}
            currentAvatarUrl={avatarUrl}
            onUploadComplete={(newUrl) => setAvatarUrl(newUrl)}
            onRemoveComplete={() => setAvatarUrl(null)}
            size={120}
          />
        </View>

        {/* Form */}
        <View style={[styles.card, cardShadowStyle]}>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <User size={20} color={Colors.primary} />
              <Text style={styles.label}>Nome</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              style={styles.input}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Mail size={20} color={Colors.primary} />
              <Text style={styles.label}>E-mail</Text>
            </View>
            <TextInput
              value={user?.email || ''}
              editable={false}
              style={[styles.input, styles.inputDisabled]}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.helperText}>O e-mail não pode ser alterado</Text>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Phone size={20} color={Colors.primary} />
              <Text style={styles.label}>Telefone</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.card, styles.signOutCard]} onPress={handleSignOut}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '4D',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerSpacer: {
    width: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    fontSize: 16,
    color: Colors.text,
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: Colors.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});


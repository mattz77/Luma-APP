import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Camera, Image as ImageIcon, X, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { pickImageFromGallery, takePhoto } from '@/lib/storage';
import { uploadProfilePhoto, removeProfilePhoto } from '@/services/user.service';
import { Colors } from '@/constants/Colors';

interface ProfilePhotoUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploadComplete: (newAvatarUrl: string) => void;
  onRemoveComplete: () => void;
  size?: number;
}

export function ProfilePhotoUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
  onRemoveComplete,
  size = 120,
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const handlePickImage = async (source: 'gallery' | 'camera') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'gallery') {
        result = await pickImageFromGallery();
      } else {
        result = await takePhoto();
      }

      if (result.canceled) {
        return;
      }

      const uri = result.assets[0]?.uri;
      if (!uri) {
        return;
      }

      // Mostrar preview
      setPreviewUri(uri);

      // Perguntar se quer usar esta imagem
      Alert.alert(
        'Confirmar foto',
        'Deseja usar esta foto como perfil?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setPreviewUri(null) },
          {
            text: 'Usar',
            onPress: () => handleUpload(uri),
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Verifique as permissões.');
    }
  };

  const handleUpload = async (uri: string) => {
    setIsUploading(true);
    try {
      const newAvatarUrl = await uploadProfilePhoto(userId, uri);
      setPreviewUri(null);
      onUploadComplete(newAvatarUrl);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      Alert.alert('Erro', 'Não foi possível fazer upload da foto. Tente novamente.');
      setPreviewUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remover foto',
      'Deseja remover sua foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setIsUploading(true);
            try {
              await removeProfilePhoto(userId);
              onRemoveComplete();
            } catch (error) {
              console.error('Erro ao remover foto:', error);
              Alert.alert('Erro', 'Não foi possível remover a foto. Tente novamente.');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  const showImagePickerOptions = () => {
    const options: { text: string; onPress: () => void }[] = [
      {
        text: 'Galeria',
        onPress: () => handlePickImage('gallery'),
      },
    ];

    // Adicionar opção de câmera apenas se não for web
    if (Platform.OS !== 'web') {
      options.push({
        text: 'Câmera',
        onPress: () => handlePickImage('camera'),
      });
    }

    options.push({ text: 'Cancelar', onPress: () => {} });

    Alert.alert('Selecionar foto', 'Escolha uma opção', options);
  };

  const displayUri = previewUri || currentAvatarUrl;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={showImagePickerOptions}
        disabled={isUploading}
      >
        {isUploading ? (
          <View style={[styles.avatarPlaceholder, { width: size, height: size }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : displayUri ? (
          <Image source={{ uri: displayUri }} style={[styles.avatar, { width: size, height: size }]} />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: size, height: size }]}>
            <User size={size * 0.5} color={Colors.textSecondary} />
          </View>
        )}

        <View style={styles.editButton}>
          {displayUri ? (
            <ImageIcon size={16} color="#fff" />
          ) : (
            <Camera size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      {currentAvatarUrl && !isUploading && (
        <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
          <X size={16} color={Colors.textSecondary} />
          <Text style={styles.removeButtonText}>Remover</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '40',
  },
  removeButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});


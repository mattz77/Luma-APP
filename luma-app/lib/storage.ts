import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Solicita permissão para acessar a galeria de imagens
 */
export async function requestImagePermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Solicita permissão para acessar a câmera
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Abre o seletor de imagens da galeria
 */
export async function pickImageFromGallery(): Promise<ImagePicker.ImagePickerResult> {
  const hasPermission = await requestImagePermission();
  if (!hasPermission) {
    throw new Error('Permissão para acessar a galeria foi negada');
  }

  return await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
}

/**
 * Abre a câmera para capturar uma foto
 */
export async function takePhoto(): Promise<ImagePicker.ImagePickerResult> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    throw new Error('Permissão para acessar a câmera foi negada');
  }

  return await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param uri - URI local da imagem
 * @param bucket - Nome do bucket (padrão: 'receipts')
 * @param folder - Pasta dentro do bucket (padrão: 'expenses')
 * @returns URL pública da imagem ou erro
 */
export async function uploadImageToStorage(
  uri: string,
  bucket: string = 'receipts',
  folder: string = 'expenses',
): Promise<UploadResult> {
  try {
    // Gerar nome único para o arquivo
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    // Converter URI para blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) {
      return { url: null, error: error.message };
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: (error as Error).message };
  }
}

/**
 * Remove uma imagem do Supabase Storage
 * @param url - URL pública da imagem
 * @param bucket - Nome do bucket (padrão: 'receipts')
 */
export async function deleteImageFromStorage(
  url: string,
  bucket: string = 'receipts',
): Promise<{ error: string | null }> {
  try {
    // Extrair o nome do arquivo da URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    const folder = urlParts[urlParts.length - 2];
    const fullPath = `${folder}/${fileName}`;

    const { error } = await supabase.storage.from(bucket).remove([fullPath]);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}


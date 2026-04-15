import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { supabase } from './supabase';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/** Opções extras para upload — no React Native, `fetch(uri)` costuma retornar blob vazio; use `base64` do ImagePicker. */
export interface UploadImageOptions {
  base64?: string | null;
  mimeType?: string | null;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.includes('base64,') ? (b64.split('base64,')[1] ?? b64) : b64;
  if (typeof globalThis.atob !== 'function') {
    throw new Error('Decodificação base64 indisponível neste ambiente');
  }
  const binaryString = globalThis.atob(clean.replace(/\s/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Obtém bytes da imagem para upload. No iOS/Android o `fetch(file://)` pode retornar corpo vazio — prefira `base64` do expo-image-picker (`base64: true`).
 */
async function resolveImageBytes(
  uri: string,
  options?: UploadImageOptions,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const contentType = options?.mimeType?.trim() || 'image/jpeg';

  if (options?.base64 && options.base64.length > 0) {
    const bytes = base64ToUint8Array(options.base64);
    if (bytes.byteLength === 0) {
      throw new Error('Imagem em base64 vazia');
    }
    return { bytes, contentType };
  }

  const response = await fetch(uri);
  const ab = await response.arrayBuffer();
  if (ab.byteLength === 0) {
    throw new Error(
      Platform.OS === 'web'
        ? 'Não foi possível ler a imagem (arquivo vazio). Tente outra foto.'
        : 'Não foi possível ler a imagem no dispositivo. Tente novamente ou use base64.',
    );
  }
  return { bytes: new Uint8Array(ab), contentType };
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
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
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
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
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
  uploadOptions?: UploadImageOptions,
): Promise<UploadResult> {
  try {
    const extFromMime = (mime: string): string => {
      if (mime.includes('png')) return 'png';
      if (mime.includes('webp')) return 'webp';
      if (mime.includes('gif')) return 'gif';
      if (mime.includes('heic')) return 'heic';
      return 'jpg';
    };

    const { bytes, contentType } = await resolveImageBytes(uri, uploadOptions);
    const ext = extFromMime(contentType);
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, bytes, {
      contentType,
      upsert: false,
    });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: (error as Error).message };
  }
}

/** Pasta padrão para fotos de perfil dentro do bucket de storage. */
export const PROFILE_PHOTOS_FOLDER = 'profile-photos';

/**
 * Bucket para avatares. Padrão `receipts` (costuma existir no projeto com despesas).
 * Crie o bucket `avatars` no Supabase e defina EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET=avatars se preferir separado.
 */
export function getAvatarStorageBucket(): string {
  const b = process.env.EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET;
  return typeof b === 'string' && b.trim().length > 0 ? b.trim() : 'receipts';
}

/**
 * Remove uma imagem do Supabase Storage.
 * URLs públicas `.../storage/v1/object/public/<bucket>/<caminho>` extraem bucket e caminho completos (inclui pastas aninhadas).
 */
export async function deleteImageFromStorage(
  url: string,
  /** Usado só quando a URL não segue o formato público do Supabase */
  bucketFallback: string = 'receipts',
): Promise<{ error: string | null }> {
  try {
    const marker = '/storage/v1/object/public/';
    const idx = url.indexOf(marker);
    let bucket: string;
    let objectPath: string;

    if (idx !== -1) {
      const rest = url.slice(idx + marker.length).split('?')[0];
      const slash = rest.indexOf('/');
      if (slash === -1) {
        return { error: 'URL de storage inválida' };
      }
      bucket = rest.slice(0, slash);
      objectPath = decodeURIComponent(rest.slice(slash + 1));
    } else {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const folder = urlParts[urlParts.length - 2];
      bucket = bucketFallback;
      objectPath = `${folder}/${fileName}`;
    }

    const { error } = await supabase.storage.from(bucket).remove([objectPath]);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}


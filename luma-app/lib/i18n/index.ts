import * as Localization from 'expo-localization';
import type { SupportedLocale, Translations } from './types';
import { ptBR } from './locales/pt-BR';
import { enUS } from './locales/en-US';
import { esES } from './locales/es-ES';
import { useI18nStore } from '@/stores/i18n.store';

const translations: Record<SupportedLocale, Translations> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
};

/**
 * Mapeia o locale do dispositivo para um locale suportado
 */
export function getDeviceLocale(): SupportedLocale {
  try {
    const deviceLocales = Localization.getLocales();
    if (deviceLocales && deviceLocales.length > 0) {
      const deviceLocale = deviceLocales[0];
      const languageCode = deviceLocale.languageCode?.toLowerCase();
      const regionCode = deviceLocale.regionCode?.toUpperCase();
      
      // Tenta match exato (ex: pt-BR, en-US)
      const exactMatch = `${languageCode}-${regionCode}` as SupportedLocale;
      if (translations[exactMatch]) {
        return exactMatch;
      }
      
      // Tenta match por idioma (ex: pt -> pt-BR, en -> en-US, es -> es-ES)
      if (languageCode === 'pt') return 'pt-BR';
      if (languageCode === 'en') return 'en-US';
      if (languageCode === 'es') return 'es-ES';
    }
  } catch (error) {
    console.error('[I18n] Erro ao detectar locale do dispositivo:', error);
  }
  
  // Fallback para pt-BR
  return 'pt-BR';
}

/**
 * Inicializa o sistema de i18n
 * Detecta o idioma do dispositivo e carrega preferência salva
 */
export async function initializeI18n(): Promise<SupportedLocale> {
  // Carrega preferência salva
  await useI18nStore.getState().initialize();
  
  const savedLocale = useI18nStore.getState().locale;
  
  // Se não há preferência salva, detecta do dispositivo
  if (!savedLocale || savedLocale === 'pt-BR') {
    const deviceLocale = getDeviceLocale();
    await useI18nStore.getState().setLocale(deviceLocale);
    return deviceLocale;
  }
  
  return savedLocale;
}

/**
 * Função de tradução
 * @param key - Chave de tradução no formato "namespace.key.subkey" (ex: "auth.login.title")
 * @param locale - Locale opcional (usa o locale atual se não fornecido)
 */
export function t(key: string, locale?: SupportedLocale): string {
  const currentLocale = locale || useI18nStore.getState().locale;
  const translation = translations[currentLocale];
  
  if (!translation) {
    console.warn(`[I18n] Locale não encontrado: ${currentLocale}`);
    return key;
  }
  
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`[I18n] Chave de tradução não encontrada: ${key}`);
      return key;
    }
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  console.warn(`[I18n] Valor de tradução inválido para chave: ${key}`);
  return key;
}

/**
 * Obtém o locale atual
 */
export function getCurrentLocale(): SupportedLocale {
  return useI18nStore.getState().locale;
}

/**
 * Muda o locale
 */
export async function changeLocale(locale: SupportedLocale): Promise<void> {
  await useI18nStore.getState().setLocale(locale);
}


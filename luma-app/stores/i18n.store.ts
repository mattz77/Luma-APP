import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedLocale } from '@/lib/i18n/types';

const I18N_STORAGE_KEY = '@luma:locale';

interface I18nState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: 'pt-BR',
  
  setLocale: async (locale: SupportedLocale) => {
    try {
      await AsyncStorage.setItem(I18N_STORAGE_KEY, locale);
      set({ locale });
    } catch (error) {
      console.error('[I18nStore] Erro ao salvar idioma:', error);
    }
  },
  
  initialize: async () => {
    try {
      const savedLocale = await AsyncStorage.getItem(I18N_STORAGE_KEY);
      if (savedLocale && ['pt-BR', 'en-US', 'es-ES'].includes(savedLocale)) {
        set({ locale: savedLocale as SupportedLocale });
      }
    } catch (error) {
      console.error('[I18nStore] Erro ao carregar idioma:', error);
    }
  },
}));


import { useI18nStore } from '@/stores/i18n.store';
import { t as translate, changeLocale, getCurrentLocale } from '@/lib/i18n';
import type { SupportedLocale } from '@/lib/i18n/types';

/**
 * Hook para usar traduções no app
 * 
 * @example
 * ```tsx
 * const { t } = useI18n();
 * <Text>{t('auth.login.title')}</Text>
 * ```
 */
export function useI18n() {
  const locale = useI18nStore((state) => state.locale);
  
  const t = (key: string): string => {
    return translate(key, locale);
  };
  
  const setLocale = async (newLocale: SupportedLocale) => {
    await changeLocale(newLocale);
  };
  
  return {
    t,
    locale,
    setLocale,
    getCurrentLocale,
  };
}


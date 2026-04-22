import * as Localization from 'expo-localization';

jest.mock('expo-localization');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockLocalization = Localization as jest.Mocked<typeof Localization>;

describe('i18n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeviceLocale', () => {
    test('retorna locale exato quando suportado', () => {
      mockLocalization.getLocales.mockReturnValue([
        { languageCode: 'pt', regionCode: 'BR', languageTag: 'pt-BR', isRTL: false, textDirection: 'ltr' },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDeviceLocale } = require('../i18n/index');
      expect(getDeviceLocale()).toBe('pt-BR');
    });

    test('mapeia en para en-US', () => {
      mockLocalization.getLocales.mockReturnValue([
        { languageCode: 'en', regionCode: 'GB', languageTag: 'en-GB', isRTL: false, textDirection: 'ltr' },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDeviceLocale } = require('../i18n/index');
      expect(getDeviceLocale()).toBe('en-US');
    });

    test('mapeia es para es-ES', () => {
      mockLocalization.getLocales.mockReturnValue([
        { languageCode: 'es', regionCode: 'MX', languageTag: 'es-MX', isRTL: false, textDirection: 'ltr' },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDeviceLocale } = require('../i18n/index');
      expect(getDeviceLocale()).toBe('es-ES');
    });

    test('retorna pt-BR como fallback para locale não suportado', () => {
      mockLocalization.getLocales.mockReturnValue([
        { languageCode: 'fr', regionCode: 'FR', languageTag: 'fr-FR', isRTL: false, textDirection: 'ltr' },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDeviceLocale } = require('../i18n/index');
      expect(getDeviceLocale()).toBe('pt-BR');
    });

    test('retorna pt-BR quando getLocales retorna array vazio', () => {
      mockLocalization.getLocales.mockReturnValue([]);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDeviceLocale } = require('../i18n/index');
      expect(getDeviceLocale()).toBe('pt-BR');
    });

    test('retorna pt-BR quando getLocales lança erro', () => {
      mockLocalization.getLocales.mockImplementation(() => {
        throw new Error('Localization error');
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDeviceLocale } = require('../i18n/index');
      expect(getDeviceLocale()).toBe('pt-BR');
    });
  });

  describe('t (função de tradução)', () => {
    test('retorna tradução para chave existente em pt-BR', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { t } = require('../i18n/index');
      expect(t('auth.login.title', 'pt-BR')).toBe('Entrar');
    });

    test('retorna tradução para chave existente em en-US', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { t } = require('../i18n/index');
      expect(t('auth.login.title', 'en-US')).toBe('Sign In');
    });

    test('retorna tradução para chave existente em es-ES', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { t } = require('../i18n/index');
      expect(t('auth.login.title', 'es-ES')).toBe('Iniciar Sesión');
    });

    test('retorna chave quando tradução não existe', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { t } = require('../i18n/index');
      expect(t('nonexistent.key', 'pt-BR')).toBe('nonexistent.key');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Chave de tradução não encontrada'));
      
      consoleSpy.mockRestore();
    });

    test('retorna chave para locale não suportado', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { t } = require('../i18n/index');
      expect(t('auth.login.title', 'invalid-locale' as 'pt-BR')).toBe('auth.login.title');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Locale não encontrado'));

      consoleSpy.mockRestore();
    });

    test('navega corretamente em chaves aninhadas', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { t } = require('../i18n/index');
      expect(t('auth.login.email', 'pt-BR')).toBe('E-mail');
      expect(t('auth.login.password', 'pt-BR')).toBe('Senha');
    });
  });
});

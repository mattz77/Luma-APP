describe('utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvVar', () => {
    test('retorna valor da variável de ambiente', () => {
      process.env.TEST_VAR = 'test-value';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEnvVar } = require('../utils');
      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    test('lança erro para variável inexistente', () => {
      delete process.env.MISSING_VAR;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEnvVar } = require('../utils');
      expect(() => getEnvVar('MISSING_VAR')).toThrow(/Variável de ambiente ausente: MISSING_VAR/);
    });

    test('lança erro para variável vazia', () => {
      process.env.EMPTY_VAR = '';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEnvVar } = require('../utils');
      expect(() => getEnvVar('EMPTY_VAR')).toThrow(/Variável de ambiente ausente: EMPTY_VAR/);
    });

    test('mensagem de erro inclui instruções', () => {
      delete process.env.MISSING_VAR;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEnvVar } = require('../utils');
      expect(() => getEnvVar('MISSING_VAR')).toThrow(/Para corrigir:/);
      expect(() => getEnvVar('MISSING_VAR')).toThrow(/\.env\.local/);
    });
  });
});

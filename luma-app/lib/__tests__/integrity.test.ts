const mockIsSupported = jest.fn();
const mockGetIntegrityToken = jest.fn();

jest.mock('expo-app-integrity', () => ({
  isSupported: mockIsSupported,
  getIntegrityToken: mockGetIntegrityToken,
}));

describe('integrity', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.EXPO_PUBLIC_INTEGRITY_VERIFY_URL = 'https://api.example.com/verify';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('verifyAppIntegrity', () => {
    test('retorna verified: false quando não suportado', async () => {
      mockIsSupported.mockReturnValue(false);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { verifyAppIntegrity } = require('../integrity');
      const result = await verifyAppIntegrity();

      expect(result).toEqual({ verified: false });
      expect(mockGetIntegrityToken).not.toHaveBeenCalled();
    });

    test('retorna verified: false quando token está vazio', async () => {
      mockIsSupported.mockReturnValue(true);
      mockGetIntegrityToken.mockResolvedValue({ token: '' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { verifyAppIntegrity } = require('../integrity');
      const result = await verifyAppIntegrity();

      expect(result.verified).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('retorna token quando URL está configurada', async () => {
      mockIsSupported.mockReturnValue(true);
      mockGetIntegrityToken.mockResolvedValue({ token: 'some-token' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { verifyAppIntegrity } = require('../integrity');
      const result = await verifyAppIntegrity();

      expect(result.token).toBe('some-token');
    });

    test('verifica token com backend e retorna verified: true', async () => {
      mockIsSupported.mockReturnValue(true);
      mockGetIntegrityToken.mockResolvedValue({ token: 'valid-token' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { verifyAppIntegrity } = require('../integrity');
      const result = await verifyAppIntegrity();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/verify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'valid-token' }),
        }),
      );
      expect(result).toEqual({ token: 'valid-token', verified: true });
    });

    test('retorna verified: false quando backend rejeita token', async () => {
      mockIsSupported.mockReturnValue(true);
      mockGetIntegrityToken.mockResolvedValue({ token: 'invalid-token' });
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { verifyAppIntegrity } = require('../integrity');
      const result = await verifyAppIntegrity();

      expect(result.verified).toBe(false);
    });
  });
});

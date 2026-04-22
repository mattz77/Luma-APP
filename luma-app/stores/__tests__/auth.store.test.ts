import { useAuthStore } from '@/stores/auth.store';
import { supabaseTest } from '@/test/supabase-test-registry';

jest.mock('@/lib/utils', () => ({
  getEnvVar: jest.fn((key: string) => {
    if (key === 'EXPO_PUBLIC_SUPABASE_URL') return 'https://test.supabase.co';
    return '';
  }),
}));

jest.mock('@/services/user.service', () => ({
  getUser: jest.fn().mockResolvedValue(null),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'success' }),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (obj: { default?: unknown; web?: unknown }) => obj.default ?? obj.web,
  },
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    supabaseTest.reset();
    useAuthStore.setState({
      user: null,
      houseId: null,
      loading: false,
      initialized: false,
    });
  });

  describe('setHouseId', () => {
    test('define o houseId', () => {
      useAuthStore.getState().setHouseId('house-1');
      expect(useAuthStore.getState().houseId).toBe('house-1');
    });

    test('limpa o houseId quando null', () => {
      useAuthStore.getState().setHouseId('house-1');
      useAuthStore.getState().setHouseId(null);
      expect(useAuthStore.getState().houseId).toBeNull();
    });
  });

  describe('initialize', () => {
    test('define user quando sessão existe', async () => {
      (supabaseTest.authMock.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user-1');
      expect(state.user?.email).toBe('test@example.com');
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
    });

    test('define user como null quando não há sessão', async () => {
      (supabaseTest.authMock.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: { name: 'AuthSessionMissingError', message: 'No session' },
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
    });

    test('trata exceção durante inicialização', async () => {
      (supabaseTest.authMock.getUser as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.initialized).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('signIn', () => {
    test('autentica com email e senha', async () => {
      (supabaseTest.authMock.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: {} },
        error: null,
      });

      await useAuthStore.getState().signIn('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.loading).toBe(false);
    });

    test('propaga erro de autenticação', async () => {
      const authError = { code: 'invalid_credentials', message: 'Invalid login credentials' };
      (supabaseTest.authMock.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: authError,
      });

      await expect(
        useAuthStore.getState().signIn('test@example.com', 'wrongpassword'),
      ).rejects.toEqual(authError);

      expect(useAuthStore.getState().loading).toBe(false);
    });

    test('define loading durante autenticação', async () => {
      let loadingDuringAuth = false;
      (supabaseTest.authMock.signInWithPassword as jest.Mock).mockImplementationOnce(async () => {
        loadingDuringAuth = useAuthStore.getState().loading;
        return { data: { user: mockUser, session: {} }, error: null };
      });

      await useAuthStore.getState().signIn('test@example.com', 'password');

      expect(loadingDuringAuth).toBe(true);
    });
  });

  describe('signUp', () => {
    test('registra novo usuário', async () => {
      (supabaseTest.authMock.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: {} },
        error: null,
      });

      await useAuthStore.getState().signUp('new@example.com', 'password123', 'New User');

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.loading).toBe(false);
    });

    test('propaga erro de registro', async () => {
      const signUpError = { code: 'user_already_exists', message: 'User already exists' };
      (supabaseTest.authMock.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: signUpError,
      });

      await expect(
        useAuthStore.getState().signUp('existing@example.com', 'password', 'Name'),
      ).rejects.toEqual(signUpError);

      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('signInWithGoogle', () => {
    beforeEach(() => {
      (global as typeof globalThis & { window: { location: { origin: string } } }).window = {
        location: { origin: 'http://localhost:3000' },
      };
    });

    afterEach(() => {
      delete (global as typeof globalThis & { window?: unknown }).window;
    });

    test('define loading ao iniciar OAuth', async () => {
      let loadingAtStart = false;
      (supabaseTest.authMock.signInWithOAuth as jest.Mock).mockImplementationOnce(async () => {
        loadingAtStart = useAuthStore.getState().loading;
        return { data: { url: 'https://accounts.google.com/auth', provider: 'google' }, error: null };
      });

      await useAuthStore.getState().signInWithGoogle();

      expect(loadingAtStart).toBe(true);
    });

    test('propaga erro do OAuth', async () => {
      const oauthError = { code: 'oauth_error', message: 'OAuth failed' };
      (supabaseTest.authMock.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: oauthError,
      });

      await expect(useAuthStore.getState().signInWithGoogle()).rejects.toEqual(oauthError);
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('signOut', () => {
    test('desloga e limpa estado', async () => {
      useAuthStore.setState({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', avatarUrl: null },
        houseId: 'house-1',
      });

      (supabaseTest.authMock.signOut as jest.Mock).mockResolvedValueOnce({
        error: null,
      });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.houseId).toBeNull();
      expect(state.loading).toBe(false);
    });

    test('propaga erro de signOut', async () => {
      const signOutError = { code: 'sign_out_error', message: 'Sign out failed' };
      (supabaseTest.authMock.signOut as jest.Mock).mockResolvedValueOnce({
        error: signOutError,
      });

      await expect(useAuthStore.getState().signOut()).rejects.toEqual(signOutError);
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });
});

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: mockRequestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync: mockRequestCameraPermissionsAsync,
  launchImageLibraryAsync: mockLaunchImageLibraryAsync,
  launchCameraAsync: mockLaunchCameraAsync,
}));

jest.mock('../supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  },
}));

describe('storage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('requestImagePermission', () => {
    test('retorna true quando permissão é concedida', async () => {
      mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        expires: 'never',
        canAskAgain: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { requestImagePermission } = require('../storage');
      const result = await requestImagePermission();

      expect(result).toBe(true);
    });

    test('retorna false quando permissão é negada', async () => {
      mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        expires: 'never',
        canAskAgain: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { requestImagePermission } = require('../storage');
      const result = await requestImagePermission();

      expect(result).toBe(false);
    });
  });

  describe('requestCameraPermission', () => {
    test('retorna true quando permissão é concedida', async () => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        expires: 'never',
        canAskAgain: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { requestCameraPermission } = require('../storage');
      const result = await requestCameraPermission();

      expect(result).toBe(true);
    });

    test('retorna false quando permissão é negada', async () => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        expires: 'never',
        canAskAgain: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { requestCameraPermission } = require('../storage');
      const result = await requestCameraPermission();

      expect(result).toBe(false);
    });
  });

  describe('pickImageFromGallery', () => {
    test('abre galeria após permissão concedida', async () => {
      mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        expires: 'never',
        canAskAgain: true,
      });

      const mockResult = {
        canceled: false,
        assets: [{ uri: 'file://image.jpg', base64: 'abc123' }],
      };
      mockLaunchImageLibraryAsync.mockResolvedValue(mockResult);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { pickImageFromGallery } = require('../storage');
      const result = await pickImageFromGallery();

      expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      expect(result).toEqual(mockResult);
    });

    test('lança erro quando permissão é negada', async () => {
      mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        expires: 'never',
        canAskAgain: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { pickImageFromGallery } = require('../storage');

      await expect(pickImageFromGallery()).rejects.toThrow(
        'Permissão para acessar a galeria foi negada',
      );
    });
  });

  describe('takePhoto', () => {
    test('abre câmera após permissão concedida', async () => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        expires: 'never',
        canAskAgain: true,
      });

      const mockResult = {
        canceled: false,
        assets: [{ uri: 'file://photo.jpg', base64: 'xyz789' }],
      };
      mockLaunchCameraAsync.mockResolvedValue(mockResult);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { takePhoto } = require('../storage');
      const result = await takePhoto();

      expect(mockLaunchCameraAsync).toHaveBeenCalledWith({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      expect(result).toEqual(mockResult);
    });

    test('lança erro quando permissão é negada', async () => {
      mockRequestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        expires: 'never',
        canAskAgain: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { takePhoto } = require('../storage');

      await expect(takePhoto()).rejects.toThrow('Permissão para acessar a câmera foi negada');
    });
  });

  describe('getAvatarStorageBucket', () => {
    test('retorna bucket configurado quando definido', () => {
      process.env.EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET = 'avatars';

      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAvatarStorageBucket } = require('../storage');
      expect(getAvatarStorageBucket()).toBe('avatars');
    });

    test('retorna receipts como fallback', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET;

      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAvatarStorageBucket } = require('../storage');
      expect(getAvatarStorageBucket()).toBe('receipts');
    });

    test('retorna receipts para string vazia', () => {
      process.env.EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET = '   ';

      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAvatarStorageBucket } = require('../storage');
      expect(getAvatarStorageBucket()).toBe('receipts');
    });
  });

  describe('PROFILE_PHOTOS_FOLDER', () => {
    test('tem valor correto', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PROFILE_PHOTOS_FOLDER } = require('../storage');
      expect(PROFILE_PHOTOS_FOLDER).toBe('profile-photos');
    });
  });
});

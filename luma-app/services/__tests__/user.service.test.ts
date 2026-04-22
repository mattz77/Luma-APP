import { updateUser, uploadProfilePhoto, removeProfilePhoto, getUser } from '@/services/user.service';
import { supabaseTest } from '@/test/supabase-test-registry';
import * as storageModule from '@/lib/storage';

jest.mock('@/lib/storage', () => {
  const originalModule = jest.requireActual('@/lib/storage');
  return {
    ...originalModule,
    uploadImageToStorage: jest.fn(),
    deleteImageFromStorage: jest.fn(),
    getAvatarStorageBucket: jest.fn(() => 'avatars'),
    PROFILE_PHOTOS_FOLDER: 'profile-photos',
  };
});

const mockStorage = storageModule as jest.Mocked<typeof storageModule>;

const baseUser = {
  id: 'user-1',
  email: 'joao@example.com',
  name: 'João Silva',
  avatar_url: 'https://example.com/avatar.jpg',
  phone: '+5511999999999',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('userService', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    test('retorna dados do usuário por id', async () => {
      supabaseTest.setNextResult(baseUser, null);
      
      const result = await getUser('user-1');
      
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('joao@example.com');
      expect(result?.name).toBe('João Silva');
      expect(result?.phone).toBe('+5511999999999');
      
      const query = supabaseTest.lastQuery;
      expect(query?.table).toBe('users');
      expect(query?.operation).toBe('select');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'user-1', op: 'eq' }]),
      );
    });

    test('retorna null quando usuário não existe (PGRST116)', async () => {
      supabaseTest.setNextResult(null, { code: 'PGRST116', message: 'No rows found' });
      
      const result = await getUser('user-inexistente');
      
      expect(result).toBeNull();
    });

    test('propaga outros erros do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);
      
      await expect(getUser('user-1')).rejects.toEqual(error);
    });
  });

  describe('updateUser', () => {
    test('atualiza nome do usuário', async () => {
      const updatedUser = { ...baseUser, name: 'João Atualizado' };
      supabaseTest.setNextResult(updatedUser, null);
      
      const result = await updateUser('user-1', { name: 'João Atualizado' });
      
      expect(result.name).toBe('João Atualizado');
      
      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.updatePayload).toEqual({ name: 'João Atualizado' });
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'user-1', op: 'eq' }]),
      );
    });

    test('atualiza telefone do usuário', async () => {
      const updatedUser = { ...baseUser, phone: '+5511888888888' };
      supabaseTest.setNextResult(updatedUser, null);
      
      const result = await updateUser('user-1', { phone: '+5511888888888' });
      
      expect(result.phone).toBe('+5511888888888');
    });

    test('atualiza avatar_url do usuário', async () => {
      const updatedUser = { ...baseUser, avatar_url: 'https://new-avatar.com/pic.jpg' };
      supabaseTest.setNextResult(updatedUser, null);
      
      const result = await updateUser('user-1', { avatar_url: 'https://new-avatar.com/pic.jpg' });
      
      expect(result.avatar_url).toBe('https://new-avatar.com/pic.jpg');
    });

    test('permite definir avatar_url como null', async () => {
      const updatedUser = { ...baseUser, avatar_url: null };
      supabaseTest.setNextResult(updatedUser, null);
      
      const result = await updateUser('user-1', { avatar_url: null });
      
      expect(result.avatar_url).toBeNull();
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(updateUser('user-1', { name: 'Novo' })).rejects.toEqual(error);
    });
  });

  describe('uploadProfilePhoto', () => {
    test('faz upload e atualiza avatar_url', async () => {
      const newUrl = 'https://storage.supabase.co/avatars/profile-photos/user-1/photo.jpg';
      (mockStorage.uploadImageToStorage as jest.Mock).mockResolvedValue({ url: newUrl, error: null });
      (mockStorage.deleteImageFromStorage as jest.Mock).mockResolvedValue({ error: null });
      
      supabaseTest.enqueueResults(
        { data: { avatar_url: 'https://old-avatar.com/old.jpg' }, error: null },
        { data: { ...baseUser, avatar_url: newUrl }, error: null },
      );
      
      const result = await uploadProfilePhoto('user-1', 'file:///path/to/photo.jpg');
      
      expect(result).toBe(newUrl);
      expect(mockStorage.uploadImageToStorage).toHaveBeenCalled();
      const uploadCall = (mockStorage.uploadImageToStorage as jest.Mock).mock.calls[0];
      expect(uploadCall[0]).toBe('file:///path/to/photo.jpg');
      expect(uploadCall[2]).toBe('profile-photos/user-1');
      expect(uploadCall[3]).toBeUndefined();
      expect(mockStorage.deleteImageFromStorage).toHaveBeenCalledWith('https://old-avatar.com/old.jpg');
    });

    test('lança erro quando upload falha', async () => {
      (mockStorage.uploadImageToStorage as jest.Mock).mockResolvedValue({ url: null, error: 'Upload failed' });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(
        uploadProfilePhoto('user-1', 'file:///path/to/photo.jpg'),
      ).rejects.toThrow('Upload failed');
      
      consoleSpy.mockRestore();
    });

    test('lança erro quando uploadImageToStorage retorna url null', async () => {
      (mockStorage.uploadImageToStorage as jest.Mock).mockResolvedValue({ url: null, error: null });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(
        uploadProfilePhoto('user-1', 'file:///path/to/photo.jpg'),
      ).rejects.toThrow('Erro ao fazer upload da imagem');
      
      consoleSpy.mockRestore();
    });

    test('não falha se deletar avatar antigo der erro (warn no console)', async () => {
      const newUrl = 'https://storage.supabase.co/avatars/profile-photos/user-1/new.jpg';
      (mockStorage.uploadImageToStorage as jest.Mock).mockResolvedValue({ url: newUrl, error: null });
      (mockStorage.deleteImageFromStorage as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      supabaseTest.enqueueResults(
        { data: { avatar_url: 'https://old-avatar.com/old.jpg' }, error: null },
        { data: { ...baseUser, avatar_url: newUrl }, error: null },
      );
      
      const result = await uploadProfilePhoto('user-1', 'file:///path/to/photo.jpg');
      
      expect(result).toBe(newUrl);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[UserService] Erro ao deletar avatar antigo:',
        expect.any(Error),
      );
      
      consoleSpy.mockRestore();
    });

    test('não tenta deletar se não há avatar antigo', async () => {
      const newUrl = 'https://storage.supabase.co/avatars/profile-photos/user-1/photo.jpg';
      (mockStorage.uploadImageToStorage as jest.Mock).mockResolvedValue({ url: newUrl, error: null });
      
      supabaseTest.enqueueResults(
        { data: { avatar_url: null }, error: null },
        { data: { ...baseUser, avatar_url: newUrl }, error: null },
      );
      
      await uploadProfilePhoto('user-1', 'file:///path/to/photo.jpg');
      
      expect(mockStorage.deleteImageFromStorage).not.toHaveBeenCalled();
    });

    test('passa imageBytes quando fornecido', async () => {
      const newUrl = 'https://storage.supabase.co/avatars/profile-photos/user-1/photo.jpg';
      (mockStorage.uploadImageToStorage as jest.Mock).mockResolvedValue({ url: newUrl, error: null });
      
      supabaseTest.enqueueResults(
        { data: { avatar_url: null }, error: null },
        { data: { ...baseUser, avatar_url: newUrl }, error: null },
      );
      
      const imageBytes = { base64: 'base64data', mimeType: 'image/jpeg' };
      await uploadProfilePhoto('user-1', 'file:///path/to/photo.jpg', imageBytes);
      
      expect(mockStorage.uploadImageToStorage).toHaveBeenCalled();
      const uploadCall = (mockStorage.uploadImageToStorage as jest.Mock).mock.calls[0];
      expect(uploadCall[0]).toBe('file:///path/to/photo.jpg');
      expect(uploadCall[2]).toBe('profile-photos/user-1');
      expect(uploadCall[3]).toEqual(imageBytes);
    });
  });

  describe('removeProfilePhoto', () => {
    test('deleta avatar do storage e limpa avatar_url no banco', async () => {
      (mockStorage.deleteImageFromStorage as jest.Mock).mockResolvedValue({ error: null });
      
      supabaseTest.enqueueResults(
        { data: { avatar_url: 'https://storage.supabase.co/avatars/profile-photos/user-1/photo.jpg' }, error: null },
        { data: { ...baseUser, avatar_url: null }, error: null },
      );
      
      await removeProfilePhoto('user-1');
      
      expect(mockStorage.deleteImageFromStorage).toHaveBeenCalledWith(
        'https://storage.supabase.co/avatars/profile-photos/user-1/photo.jpg',
      );
      
      const updateQuery = supabaseTest.queries.find(q => q.operation === 'update');
      expect(updateQuery?.updatePayload).toEqual({ avatar_url: null });
    });

    test('não chama deleteImageFromStorage se não há avatar', async () => {
      supabaseTest.enqueueResults(
        { data: { avatar_url: null }, error: null },
        { data: { ...baseUser, avatar_url: null }, error: null },
      );
      
      await removeProfilePhoto('user-1');
      
      expect(mockStorage.deleteImageFromStorage).not.toHaveBeenCalled();
    });

    test('propaga erro do deleteImageFromStorage', async () => {
      (mockStorage.deleteImageFromStorage as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      supabaseTest.setNextResult({ avatar_url: 'https://example.com/avatar.jpg' }, null);
      
      await expect(removeProfilePhoto('user-1')).rejects.toThrow('Storage error');
      
      consoleSpy.mockRestore();
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Select failed' };
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      supabaseTest.setNextResult(null, error);
      
      await expect(removeProfilePhoto('user-1')).rejects.toEqual(error);
      
      consoleSpy.mockRestore();
    });
  });
});

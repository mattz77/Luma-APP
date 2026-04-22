import { houseService } from '@/services/house.service';
import { supabaseTest } from '@/test/supabase-test-registry';

const baseHouse = {
  id: 'house-a',
  name: 'Casa Principal',
  address: 'Rua A, 123',
  photo_url: null,
  invite_code: 'ABC123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const baseMembership = {
  id: 'm1',
  house_id: 'house-a',
  user_id: 'user-1',
  role: 'ADMIN',
  joined_at: new Date().toISOString(),
  is_active: true,
};

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'João',
  avatar_url: null,
  phone: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login_at: null,
};

describe('houseService', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  describe('getUserHouses', () => {
    test('retorna vazio quando não há memberships', async () => {
      supabaseTest.setNextResult([], null);
      const r = await houseService.getUserHouses('user-1');
      expect(r).toEqual([]);
      expect(supabaseTest.lastQuery?.table).toBe('house_members');
    });

    test('busca casas por ids das memberships', async () => {
      supabaseTest.enqueueResults(
        { data: [baseMembership], error: null },
        { data: [baseHouse], error: null },
      );
      const r = await houseService.getUserHouses('user-1');
      expect(r).toHaveLength(1);
      expect(r[0].house.name).toBe('Casa Principal');
      const housesQuery = supabaseTest.queries.find((q) => q.table === 'houses');
      expect(housesQuery?.ins).toEqual(
        expect.arrayContaining([{ column: 'id', values: ['house-a'] }]),
      );
    });

    test('filtra apenas memberships ativas', async () => {
      supabaseTest.enqueueResults(
        { data: [baseMembership], error: null },
        { data: [baseHouse], error: null },
      );
      await houseService.getUserHouses('user-1');
      
      const memberQuery = supabaseTest.queries.find((q) => q.table === 'house_members');
      expect(memberQuery?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'user_id', value: 'user-1', op: 'eq' },
          { column: 'is_active', value: true, op: 'eq' },
        ]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);
      
      await expect(houseService.getUserHouses('user-1')).rejects.toEqual(error);
    });
  });

  describe('createHouse', () => {
    test('cria casa via RPC', async () => {
      (supabaseTest.client.rpc as jest.Mock).mockResolvedValue({
        data: baseHouse,
        error: null,
      });

      const result = await houseService.createHouse({
        name: 'Casa Principal',
        address: 'Rua A, 123',
        creatorUserId: 'user-1',
      });

      expect(result.name).toBe('Casa Principal');
      expect(supabaseTest.client.rpc).toHaveBeenCalledWith('create_house_with_membership', {
        p_name: 'Casa Principal',
        p_address: 'Rua A, 123',
      });
    });

    test('cria casa sem endereço', async () => {
      (supabaseTest.client.rpc as jest.Mock).mockResolvedValue({
        data: { ...baseHouse, address: null },
        error: null,
      });

      await houseService.createHouse({
        name: 'Casa Simples',
        creatorUserId: 'user-1',
      });

      expect(supabaseTest.client.rpc).toHaveBeenCalledWith('create_house_with_membership', {
        p_name: 'Casa Simples',
        p_address: null,
      });
    });

    test('atualiza foto da casa se fornecida', async () => {
      (supabaseTest.client.rpc as jest.Mock).mockResolvedValue({
        data: baseHouse,
        error: null,
      });
      supabaseTest.setNextResult({ ...baseHouse, photo_url: 'https://photo.jpg' }, null);

      const result = await houseService.createHouse({
        name: 'Casa com Foto',
        photoUrl: 'https://photo.jpg',
        creatorUserId: 'user-1',
      });

      expect(result.photoUrl).toBe('https://photo.jpg');
    });

    test('propaga erro do RPC', async () => {
      const error = { code: 'PGRST500', message: 'RPC failed' };
      (supabaseTest.client.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error,
      });

      await expect(
        houseService.createHouse({ name: 'Casa', creatorUserId: 'user-1' }),
      ).rejects.toEqual(error);
    });

    test('lança erro quando RPC retorna null', async () => {
      (supabaseTest.client.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        houseService.createHouse({ name: 'Casa', creatorUserId: 'user-1' }),
      ).rejects.toThrow('Não foi possível criar a casa.');
    });
  });

  describe('joinHouse', () => {
    test('busca casa pelo invite_code', async () => {
      supabaseTest.setNextResult(null, { code: 'PGRST116', message: 'Not found' });

      try {
        await houseService.joinHouse('user-2', 'ABC123');
      } catch {
        // Expected to fail
      }

      const selectQuery = supabaseTest.queries.find(
        (q) => q.table === 'houses' && q.operation === 'select',
      );
      expect(selectQuery?.eqs).toEqual(
        expect.arrayContaining([{ column: 'invite_code', value: 'ABC123', op: 'eq' }]),
      );
    });

    test('reativa membership inativa', async () => {
      const inactiveMembership = { ...baseMembership, is_active: false };
      supabaseTest.enqueueResults(
        { data: baseHouse, error: null },
        { data: inactiveMembership, error: null },
        { data: null, error: null },
      );

      await houseService.joinHouse('user-1', 'ABC123');

      const updateQuery = supabaseTest.queries.find(
        (q) => q.operation === 'update' && q.table === 'house_members',
      );
      expect(updateQuery?.updatePayload).toEqual(
        expect.objectContaining({ is_active: true, role: 'MEMBER' }),
      );
    });

    test('lança erro se usuário já é membro ativo', async () => {
      supabaseTest.enqueueResults(
        { data: baseHouse, error: null },
        { data: { ...baseMembership, is_active: true }, error: null },
      );

      await expect(houseService.joinHouse('user-1', 'ABC123')).rejects.toThrow(
        'Você já faz parte dessa casa.',
      );
    });

    test('propaga erro ao buscar casa', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);

      await expect(houseService.joinHouse('user-1', 'ABC123')).rejects.toEqual(error);
    });
  });

  describe('getHouseMembers', () => {
    test('retorna membros ativos com dados do usuário', async () => {
      const memberWithUser = { ...baseMembership, user: baseUser };
      supabaseTest.setNextResult([memberWithUser], null);

      const result = await houseService.getHouseMembers('house-a');

      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe('João');
      expect(result[0].role).toBe('ADMIN');

      const query = supabaseTest.lastQuery;
      expect(query?.table).toBe('house_members');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'house_id', value: 'house-a', op: 'eq' },
          { column: 'is_active', value: true, op: 'eq' },
        ]),
      );
    });

    test('retorna lista vazia quando não há membros', async () => {
      supabaseTest.setNextResult([], null);

      const result = await houseService.getHouseMembers('house-a');

      expect(result).toHaveLength(0);
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);

      await expect(houseService.getHouseMembers('house-a')).rejects.toEqual(error);
    });
  });

  describe('removeMember', () => {
    test('desativa membership por id', async () => {
      supabaseTest.setNextResult(null, null);

      await houseService.removeMember('m1');

      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.table).toBe('house_members');
      expect(query?.updatePayload).toEqual({ is_active: false });
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'm1', op: 'eq' }]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);

      await expect(houseService.removeMember('m1')).rejects.toEqual(error);
    });
  });

  describe('leaveHouse', () => {
    test('desativa membership do usuário na casa', async () => {
      supabaseTest.setNextResult(null, null);

      await houseService.leaveHouse('user-1', 'house-a');

      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.updatePayload).toEqual({ is_active: false });
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'house_id', value: 'house-a', op: 'eq' },
          { column: 'user_id', value: 'user-1', op: 'eq' },
        ]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);

      await expect(houseService.leaveHouse('user-1', 'house-a')).rejects.toEqual(error);
    });
  });

  describe('updateHouse', () => {
    test('atualiza nome da casa', async () => {
      const updatedHouse = { ...baseHouse, name: 'Casa Atualizada' };
      supabaseTest.setNextResult(updatedHouse, null);

      const result = await houseService.updateHouse('house-a', { name: 'Casa Atualizada' });

      expect(result.name).toBe('Casa Atualizada');

      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'house-a', op: 'eq' }]),
      );
    });

    test('atualiza múltiplos campos', async () => {
      const updatedHouse = { ...baseHouse, name: 'Nova Casa', address: 'Novo Endereço' };
      supabaseTest.setNextResult(updatedHouse, null);

      const result = await houseService.updateHouse('house-a', {
        name: 'Nova Casa',
        address: 'Novo Endereço',
        photoUrl: 'https://nova-foto.jpg',
      });

      expect(result.name).toBe('Nova Casa');
    });

    test('lança erro quando casa não existe', async () => {
      supabaseTest.setNextResult(null, null);

      await expect(
        houseService.updateHouse('house-inexistente', { name: 'Nova' }),
      ).rejects.toThrow('Não foi possível atualizar a casa.');
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);

      await expect(houseService.updateHouse('house-a', { name: 'Nova' })).rejects.toEqual(error);
    });
  });

  describe('updateMemberRole', () => {
    test('atualiza role do membro', async () => {
      supabaseTest.setNextResult(null, null);

      await houseService.updateMemberRole({
        membershipId: 'm1',
        role: 'ADMIN',
      });

      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.table).toBe('house_members');
      expect(query?.updatePayload).toEqual({ role: 'ADMIN' });
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'm1', op: 'eq' }]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);

      await expect(
        houseService.updateMemberRole({ membershipId: 'm1', role: 'MEMBER' }),
      ).rejects.toEqual(error);
    });
  });
});

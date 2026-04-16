import { houseService } from '@/services/house.service';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('houseService.getUserHouses', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna vazio quando não há memberships', async () => {
    supabaseTest.setNextResult([], null);
    const r = await houseService.getUserHouses('user-1');
    expect(r).toEqual([]);
    expect(supabaseTest.lastQuery?.table).toBe('house_members');
  });

  test('busca casas por ids das memberships', async () => {
    const memberships = [
      {
        id: 'm1',
        house_id: 'house-a',
        user_id: 'user-1',
        role: 'ADMIN',
        joined_at: new Date().toISOString(),
        is_active: true,
      },
    ];
    const house = {
      id: 'house-a',
      name: 'Casa',
      address: null,
      photo_url: null,
      invite_code: 'ABC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    supabaseTest.enqueueResults({ data: memberships, error: null }, { data: [house], error: null });
    const r = await houseService.getUserHouses('user-1');
    expect(r).toHaveLength(1);
    expect(r[0].house.name).toBe('Casa');
    const housesQuery = supabaseTest.queries.find((q) => q.table === 'houses');
    expect(housesQuery?.ins).toEqual(expect.arrayContaining([{ column: 'id', values: ['house-a'] }]));
  });
});

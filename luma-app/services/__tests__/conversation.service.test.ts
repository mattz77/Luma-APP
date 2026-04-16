import { conversationService } from '@/services/conversation.service';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('conversationService', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  const row = {
    id: 'c1',
    house_id: 'h1',
    user_id: 'u1',
    message: 'Oi',
    response: 'Olá',
    metadata: null,
    created_at: new Date().toISOString(),
  };

  test('getByHouse filtra house_id', async () => {
    supabaseTest.setNextResult([row], null);
    const list = await conversationService.getByHouse('h1');
    expect(list).toHaveLength(1);
    expect(supabaseTest.lastQuery?.eqs.some((e) => e.column === 'house_id' && e.value === 'h1')).toBe(true);
  });

  test('create insere conversa', async () => {
    supabaseTest.setNextResult(row, null);
    const c = await conversationService.create({
      house_id: 'h1',
      user_id: 'u1',
      message: 'Oi',
      response: null,
    });
    expect(c.id).toBe('c1');
    expect(supabaseTest.lastQuery?.operation).toBe('insert');
  });
});

import { RAGService } from '@/services/rag.service';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('RAGService', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('hybridSearch invoca edge function hybrid-search com house_id', async () => {
    supabaseTest.registerFunctionInvoke('hybrid-search', async (body) => {
      const b = body as { house_id?: string; query?: string };
      expect(b.house_id).toBe('h1');
      expect(b.query).toBe('teste');
      return { data: { success: true, results: [] }, error: null };
    });
    const r = await RAGService.hybridSearch({ query: 'teste', house_id: 'h1' });
    expect(r).toEqual([]);
    expect(supabaseTest.client.functions.invoke).toHaveBeenCalledWith(
      'hybrid-search',
      expect.objectContaining({
        body: expect.objectContaining({ house_id: 'h1', query: 'teste' }),
      }),
    );
  });

  test('addDocument retorna id quando invoke ok', async () => {
    supabaseTest.registerFunctionInvoke('add-to-rag', async () => ({
      data: { document_ids: ['doc-1'] },
      error: null,
    }));
    const id = await RAGService.addDocument({
      house_id: 'h1',
      content: 'x',
      doc_type: 'expense',
    });
    expect(id).toBe('doc-1');
  });

  test('addDocuments retorna contagem', async () => {
    supabaseTest.registerFunctionInvoke('add-to-rag', async () => ({
      data: { inserted: 3 },
      error: null,
    }));
    const n = await RAGService.addDocuments('h1', [
      { content: 'a', doc_type: 'task' },
    ]);
    expect(n).toBe(3);
  });

  test('cleanOldDocuments usa delete com lt em created_at', async () => {
    supabaseTest.setNextResult(null, null);
    await RAGService.cleanOldDocuments('h1', 90);
    const q = supabaseTest.lastQuery;
    expect(q?.table).toBe('documents');
    expect(q?.operation).toBe('delete');
    expect(q?.eqs.some((e) => e.column === 'house_id' && e.value === 'h1')).toBe(true);
    expect(q?.eqs.some((e) => e.op === 'lt')).toBe(true);
  });
});

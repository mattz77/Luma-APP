/**
 * Mock fluente do cliente @supabase/supabase-js para testes de serviços.
 * Permite inspecionar .eq('house_id', …) e simular { data, error } (fila de respostas).
 */

export type EqRecord = { column: string; value: unknown; op?: 'eq' | 'lt' };

export type InRecord = { column: string; values: unknown[] };

export type QuerySnapshot = {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  eqs: EqRecord[];
  ins: InRecord[];
  insertPayload?: unknown;
  updatePayload?: unknown;
};

type ResolvePayload = { data: unknown; error: unknown; count?: number | null };

export function createSupabaseMock() {
  const snapshots: QuerySnapshot[] = [];
  let fallbackResult: ResolvePayload = { data: null, error: null, count: null };
  const resultQueue: ResolvePayload[] = [];

  const invokeFunctions = new Map<
    string,
    (body?: unknown) => Promise<{ data: unknown; error: unknown }>
  >();

  const channelMocks = {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    })),
    removeChannel: jest.fn(),
  };

  function dequeueResult(): ResolvePayload {
    if (resultQueue.length > 0) {
      return { ...resultQueue.shift()! };
    }
    return { ...fallbackResult };
  }

  function recordAndResolve(snap: QuerySnapshot): Promise<ResolvePayload> {
    snapshots.push(snap);
    return Promise.resolve(dequeueResult());
  }

  function filterBuilder(
    table: string,
    operation: QuerySnapshot['operation'],
    extra: { insertPayload?: unknown; updatePayload?: unknown } = {},
  ) {
    const eqs: EqRecord[] = [];
    const ins: InRecord[] = [];

    const snap = (): QuerySnapshot => ({
      table,
      operation,
      eqs: [...eqs],
      ins: [...ins],
      insertPayload: extra.insertPayload,
      updatePayload: extra.updatePayload,
    });

    const builder = {
      eq: (column: string, value: unknown) => {
        eqs.push({ column, value, op: 'eq' });
        return builder;
      },
      lt: (column: string, value: unknown) => {
        eqs.push({ column, value, op: 'lt' });
        return builder;
      },
      /** update().eq().select().single() */
      select: (_cols?: string) => ({
        single: () => recordAndResolve(snap()),
        maybeSingle: () => recordAndResolve(snap()),
      }),
      in: (column: string, values: unknown[]) => {
        ins.push({ column, values });
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: () => recordAndResolve(snap()),
      single: () => recordAndResolve(snap()),
      then: (
        onFulfilled?: (v: ResolvePayload) => unknown,
        onRejected?: (e: unknown) => unknown,
      ) => recordAndResolve(snap()).then(onFulfilled, onRejected),
    };
    return builder;
  }

  const client = {
    rpc: jest.fn(async (_fn: string, _params?: unknown) => ({
      data: null,
      error: null,
    })),
    from: (table: string) => ({
      select: (_cols?: string, _options?: { count?: 'exact'; head?: boolean }) => filterBuilder(table, 'select'),
      insert: (payload: unknown) => ({
        select: () => filterBuilder(table, 'insert', { insertPayload: payload }),
      }),
      update: (payload: unknown) => filterBuilder(table, 'update', { updatePayload: payload }),
      upsert: (payload: unknown, _opts?: unknown) => ({
        select: () => filterBuilder(table, 'upsert', { insertPayload: payload }),
      }),
      delete: (_opts?: { count?: string }) => filterBuilder(table, 'delete'),
    }),
    channel: channelMocks.channel,
    removeChannel: channelMocks.removeChannel,
    functions: {
      invoke: jest.fn(async (name: string, options?: { body?: unknown }) => {
        const fn = invokeFunctions.get(name);
        if (fn) {
          return fn(options?.body);
        }
        return { data: null, error: null };
      }),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: null, provider: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ data: null, error: null }),
      resend: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };

  return {
    client,
    get lastQuery(): QuerySnapshot | undefined {
      return snapshots[snapshots.length - 1];
    },
    get queries(): QuerySnapshot[] {
      return [...snapshots];
    },
    /** Próxima resposta se a fila estiver vazia */
    setNextResult(data: unknown, error: unknown = null, count?: number | null) {
      fallbackResult = { data, error, count };
    },
    /** Define resultado de contagem para queries com head: true */
    setNextCountResult(count: number | null, error: unknown = null) {
      fallbackResult = { data: null, error, count };
    },
    /** Várias respostas na ordem (insert → splits → getById, etc.) */
    enqueueResults(...results: ResolvePayload[]) {
      resultQueue.push(...results);
    },
    reset() {
      snapshots.length = 0;
      resultQueue.length = 0;
      fallbackResult = { data: null, error: null, count: null };
      invokeFunctions.clear();
      channelMocks.channel.mockClear();
      channelMocks.removeChannel.mockClear();
      (client.functions.invoke as jest.Mock).mockClear();
      (client.rpc as jest.Mock).mockClear();
      (client.storage.from as jest.Mock).mockClear();
      (client.auth.getUser as jest.Mock).mockClear();
      (client.auth.signInWithPassword as jest.Mock).mockClear();
      (client.auth.signUp as jest.Mock).mockClear();
      (client.auth.signOut as jest.Mock).mockClear();
      (client.auth.signInWithOAuth as jest.Mock).mockClear();
      (client.auth.onAuthStateChange as jest.Mock).mockClear();
      (client.auth.resetPasswordForEmail as jest.Mock).mockClear();
      (client.auth.resend as jest.Mock).mockClear();
    },
    registerFunctionInvoke(
      name: string,
      impl: (body?: unknown) => Promise<{ data: unknown; error: unknown }>,
    ) {
      invokeFunctions.set(name, impl);
    },
    channelMocks,
    get storageMock() {
      return client.storage;
    },
    get authMock() {
      return client.auth;
    },
  };
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;

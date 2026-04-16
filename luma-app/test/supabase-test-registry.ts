import { createSupabaseMock, type SupabaseMock } from './mocks/supabaseClientMock';

/** Instância única por worker Jest; use `reset()` em beforeEach */
export const supabaseTest: SupabaseMock = createSupabaseMock();

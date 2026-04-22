import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RlsTestConfig {
  supabaseUrl: string;
  anonKey: string;
  userA: { email: string; password: string };
  userB: { email: string; password: string };
  houseAId: string;
  houseBId: string;
}

export function getTestConfig(): RlsTestConfig | null {
  const url = process.env.RLS_TEST_SUPABASE_URL;
  const anon = process.env.RLS_TEST_SUPABASE_ANON_KEY ?? process.env.RLS_TEST_SUPABASE_PUBLISHABLE_KEY;

  if (!url?.trim() || !anon?.trim()) {
    return null;
  }

  const emailA = process.env.RLS_TEST_USER_A_EMAIL;
  const passA = process.env.RLS_TEST_USER_A_PASSWORD;
  const emailB = process.env.RLS_TEST_USER_B_EMAIL;
  const passB = process.env.RLS_TEST_USER_B_PASSWORD;
  const houseAId = process.env.RLS_TEST_HOUSE_A_ID;
  const houseBId = process.env.RLS_TEST_HOUSE_B_ID;

  if (!emailA || !passA || !emailB || !passB || !houseAId || !houseBId) {
    return null;
  }

  return {
    supabaseUrl: url,
    anonKey: anon,
    userA: { email: emailA, password: passA },
    userB: { email: emailB, password: passB },
    houseAId,
    houseBId,
  };
}

export function createAnonClient(config: RlsTestConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.anonKey);
}

export async function createAuthenticatedClient(
  config: RlsTestConfig,
  user: 'A' | 'B',
): Promise<{ client: SupabaseClient; userId: string }> {
  const client = createClient(config.supabaseUrl, config.anonKey);
  const creds = user === 'A' ? config.userA : config.userB;

  const { data, error } = await client.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  });

  if (error) {
    throw new Error(`Falha ao autenticar usuário ${user}: ${error.message}`);
  }

  return {
    client,
    userId: data.user?.id ?? '',
  };
}

export async function signOutClient(client: SupabaseClient): Promise<void> {
  await client.auth.signOut();
}

import { SupabaseClient } from '@supabase/supabase-js';
import {
  RlsCheckResult,
  assertHasData,
  assertEmpty,
  assertInsertDenied,
  assertDenied,
  reportResults,
} from '../helpers/rls-assertions';
import { RlsTestConfig, createAuthenticatedClient, createAnonClient, signOutClient } from '../helpers/rls-test-client';

export async function runGameProfilesRlsChecks(config: RlsTestConfig): Promise<boolean> {
  const results: RlsCheckResult[] = [];

  const { client: clientA, userId: userIdA } = await createAuthenticatedClient(config, 'A');
  const { client: clientB, userId: userIdB } = await createAuthenticatedClient(config, 'B');
  const anonClient = createAnonClient(config);

  try {
    results.push(await checkSelectOwn(clientA, userIdA));
    results.push(await checkSelectOther(clientB, userIdA));
    results.push(await checkInsertOther(clientB, userIdA));
    results.push(await checkUpdateOther(clientB, userIdA));
    results.push(await checkAnonAccess(anonClient, userIdA));
  } finally {
    await signOutClient(clientA);
    await signOutClient(clientB);
  }

  return reportResults(results, 'user_game_profiles');
}

async function checkSelectOwn(client: SupabaseClient, userId: string): Promise<RlsCheckResult> {
  const response = await client.from('user_game_profiles').select('id, xp, level').eq('user_id', userId).limit(1);
  // User may not have a profile yet — no data is OK, error is not
  if (response.error) {
    return { passed: false, message: `[FALHA] SELECT próprio perfil: ${response.error.message}` };
  }
  return { passed: true, message: '[OK] SELECT próprio perfil: permitido' };
}

async function checkSelectOther(client: SupabaseClient, targetUserId: string): Promise<RlsCheckResult> {
  const response = await client.from('user_game_profiles').select('id, xp').eq('user_id', targetUserId).limit(1);
  return assertEmpty(response, 'SELECT perfil alheio');
}

async function checkInsertOther(client: SupabaseClient, targetUserId: string): Promise<RlsCheckResult> {
  const response = await client
    .from('user_game_profiles')
    .insert({
      user_id: targetUserId,
      xp: 9999,
      level: 99,
    })
    .select()
    .single();
  return assertInsertDenied(response, 'INSERT perfil alheio');
}

async function checkUpdateOther(client: SupabaseClient, targetUserId: string): Promise<RlsCheckResult> {
  const response = await client
    .from('user_game_profiles')
    .update({ xp: 9999 })
    .eq('user_id', targetUserId)
    .select()
    .single();

  if (response.error) {
    return { passed: true, message: `[OK] UPDATE perfil alheio: negado: ${response.error.message}` };
  }
  if (!response.data) {
    return { passed: true, message: '[OK] UPDATE perfil alheio: 0 linhas afetadas (RLS bloqueou)' };
  }
  return { passed: false, message: '[FALHA] UPDATE perfil alheio: deveria ser negado' };
}

async function checkAnonAccess(client: SupabaseClient, targetUserId: string): Promise<RlsCheckResult> {
  const response = await client.from('user_game_profiles').select('id').eq('user_id', targetUserId).limit(1);
  return assertDenied(response, 'SELECT anônimo');
}

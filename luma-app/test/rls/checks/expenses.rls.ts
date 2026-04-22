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

export async function runExpensesRlsChecks(config: RlsTestConfig): Promise<boolean> {
  const results: RlsCheckResult[] = [];

  const { client: clientA, userId: userIdA } = await createAuthenticatedClient(config, 'A');
  const { client: clientB } = await createAuthenticatedClient(config, 'B');
  const anonClient = createAnonClient(config);

  try {
    results.push(await checkSelectOwn(clientA, config.houseAId));
    results.push(await checkSelectCrossTenant(clientB, config.houseAId));
    results.push(await checkInsertCrossTenant(clientB, config.houseAId, userIdA));
    results.push(await checkUpdateCrossTenant(clientB, config.houseAId));
    results.push(await checkDeleteCrossTenant(clientB, config.houseAId));
    results.push(await checkAnonAccess(anonClient, config.houseAId));
  } finally {
    await signOutClient(clientA);
    await signOutClient(clientB);
  }

  return reportResults(results, 'expenses');
}

async function checkSelectOwn(client: SupabaseClient, houseId: string): Promise<RlsCheckResult> {
  const response = await client.from('expenses').select('id').eq('house_id', houseId).limit(10);
  if (response.error?.code === '42501') {
    return { passed: true, message: '[OK] SELECT própria casa: requer role ADMIN (esperado)' };
  }
  return assertHasData(response, 'SELECT própria casa');
}

async function checkSelectCrossTenant(client: SupabaseClient, targetHouseId: string): Promise<RlsCheckResult> {
  const response = await client.from('expenses').select('id').eq('house_id', targetHouseId).limit(10);
  return assertEmpty(response, 'SELECT casa alheia');
}

async function checkInsertCrossTenant(
  client: SupabaseClient,
  targetHouseId: string,
  targetUserId: string,
): Promise<RlsCheckResult> {
  const response = await client
    .from('expenses')
    .insert({
      house_id: targetHouseId,
      description: 'RLS Test Expense - should be denied',
      amount: 100,
      expense_date: new Date().toISOString().split('T')[0],
      is_paid: false,
      created_by: targetUserId,
    })
    .select()
    .single();
  return assertInsertDenied(response, 'INSERT em casa alheia');
}

async function checkUpdateCrossTenant(client: SupabaseClient, targetHouseId: string): Promise<RlsCheckResult> {
  const { data: expenses } = await client.from('expenses').select('id').eq('house_id', targetHouseId).limit(1);
  if (!expenses?.length) {
    return { passed: true, message: '[OK] UPDATE casa alheia: nenhuma expense encontrada (RLS bloqueou SELECT)' };
  }

  const response = await client
    .from('expenses')
    .update({ description: 'RLS Hacked' })
    .eq('id', expenses[0].id)
    .select()
    .single();

  if (response.error) {
    return { passed: true, message: `[OK] UPDATE casa alheia: negado: ${response.error.message}` };
  }
  return { passed: false, message: '[FALHA] UPDATE casa alheia: deveria ser negado' };
}

async function checkDeleteCrossTenant(client: SupabaseClient, targetHouseId: string): Promise<RlsCheckResult> {
  const { data: expenses } = await client.from('expenses').select('id').eq('house_id', targetHouseId).limit(1);
  if (!expenses?.length) {
    return { passed: true, message: '[OK] DELETE casa alheia: nenhuma expense encontrada (RLS bloqueou SELECT)' };
  }

  const response = await client.from('expenses').delete().eq('id', expenses[0].id);

  if (response.error) {
    return { passed: true, message: `[OK] DELETE casa alheia: negado: ${response.error.message}` };
  }
  if (response.count === 0) {
    return { passed: true, message: '[OK] DELETE casa alheia: 0 linhas afetadas (RLS bloqueou)' };
  }
  return { passed: false, message: '[FALHA] DELETE casa alheia: deveria ser negado' };
}

async function checkAnonAccess(client: SupabaseClient, houseId: string): Promise<RlsCheckResult> {
  const response = await client.from('expenses').select('id').eq('house_id', houseId).limit(1);
  return assertDenied(response, 'SELECT anônimo');
}

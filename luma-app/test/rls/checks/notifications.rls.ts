import { SupabaseClient } from '@supabase/supabase-js';
import {
  RlsCheckResult,
  assertEmpty,
  assertDenied,
  assertInsertDenied,
  reportResults,
} from '../helpers/rls-assertions';
import { RlsTestConfig, createAuthenticatedClient, createAnonClient, signOutClient } from '../helpers/rls-test-client';

export async function runNotificationsRlsChecks(config: RlsTestConfig): Promise<boolean> {
  const results: RlsCheckResult[] = [];

  const { client: clientA, userId: userIdA } = await createAuthenticatedClient(config, 'A');
  const { client: clientB, userId: userIdB } = await createAuthenticatedClient(config, 'B');
  const anonClient = createAnonClient(config);

  try {
    results.push(await checkSelectOwn(clientA, config.houseAId, userIdA));
    results.push(await checkSelectCrossTenant(clientB, config.houseAId, userIdA));
    results.push(await checkInsertCrossTenant(clientB, config.houseAId, userIdA));
    results.push(await checkUpdateCrossTenant(clientB, config.houseAId, userIdA));
    results.push(await checkDeleteCrossTenant(clientB, config.houseAId, userIdA));
    results.push(await checkAnonAccess(anonClient, config.houseAId));
  } finally {
    await signOutClient(clientA);
    await signOutClient(clientB);
  }

  return reportResults(results, 'notifications');
}

async function checkSelectOwn(client: SupabaseClient, houseId: string, userId: string): Promise<RlsCheckResult> {
  const response = await client
    .from('notifications')
    .select('id')
    .eq('house_id', houseId)
    .eq('user_id', userId)
    .limit(10);

  if (response.error) {
    return { passed: false, message: `[FALHA] SELECT próprio: erro: ${response.error.message}` };
  }
  return { passed: true, message: `[OK] SELECT próprio: retornou ${response.data?.length ?? 0} notificação(ões)` };
}

async function checkSelectCrossTenant(
  client: SupabaseClient,
  targetHouseId: string,
  targetUserId: string,
): Promise<RlsCheckResult> {
  const response = await client
    .from('notifications')
    .select('id')
    .eq('house_id', targetHouseId)
    .eq('user_id', targetUserId)
    .limit(10);
  return assertEmpty(response, 'SELECT notificações de outro usuário');
}

async function checkInsertCrossTenant(
  client: SupabaseClient,
  targetHouseId: string,
  targetUserId: string,
): Promise<RlsCheckResult> {
  const response = await client
    .from('notifications')
    .insert({
      house_id: targetHouseId,
      user_id: targetUserId,
      type: 'task_assigned',
      title: 'RLS Test - should be denied',
      message: 'This notification should not be created',
      is_read: false,
    })
    .select()
    .single();
  return assertInsertDenied(response, 'INSERT notificação para outro usuário');
}

async function checkUpdateCrossTenant(
  client: SupabaseClient,
  targetHouseId: string,
  targetUserId: string,
): Promise<RlsCheckResult> {
  const { data: notifications } = await client
    .from('notifications')
    .select('id')
    .eq('house_id', targetHouseId)
    .eq('user_id', targetUserId)
    .limit(1);

  if (!notifications?.length) {
    return { passed: true, message: '[OK] UPDATE outro usuário: nenhuma notificação encontrada (RLS bloqueou SELECT)' };
  }

  const response = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifications[0].id)
    .select()
    .single();

  if (response.error) {
    return { passed: true, message: `[OK] UPDATE outro usuário: negado: ${response.error.message}` };
  }
  return { passed: false, message: '[FALHA] UPDATE outro usuário: deveria ser negado' };
}

async function checkDeleteCrossTenant(
  client: SupabaseClient,
  targetHouseId: string,
  targetUserId: string,
): Promise<RlsCheckResult> {
  const { data: notifications } = await client
    .from('notifications')
    .select('id')
    .eq('house_id', targetHouseId)
    .eq('user_id', targetUserId)
    .limit(1);

  if (!notifications?.length) {
    return { passed: true, message: '[OK] DELETE outro usuário: nenhuma notificação encontrada (RLS bloqueou SELECT)' };
  }

  const response = await client.from('notifications').delete().eq('id', notifications[0].id);

  if (response.error) {
    return { passed: true, message: `[OK] DELETE outro usuário: negado: ${response.error.message}` };
  }
  if (response.count === 0) {
    return { passed: true, message: '[OK] DELETE outro usuário: 0 linhas afetadas (RLS bloqueou)' };
  }
  return { passed: false, message: '[FALHA] DELETE outro usuário: deveria ser negado' };
}

async function checkAnonAccess(client: SupabaseClient, houseId: string): Promise<RlsCheckResult> {
  const response = await client.from('notifications').select('id').eq('house_id', houseId).limit(1);
  return assertDenied(response, 'SELECT anônimo');
}

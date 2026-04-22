/**
 * Suíte de integração RLS — requer Supabase real (local ou staging).
 *
 * Variáveis de ambiente necessárias:
 * - RLS_TEST_SUPABASE_URL
 * - RLS_TEST_SUPABASE_ANON_KEY (ou RLS_TEST_SUPABASE_PUBLISHABLE_KEY)
 * - RLS_TEST_USER_A_EMAIL / RLS_TEST_USER_A_PASSWORD (membro da casa A)
 * - RLS_TEST_USER_B_EMAIL / RLS_TEST_USER_B_PASSWORD (membro da casa B)
 * - RLS_TEST_HOUSE_A_ID (ID da casa A)
 * - RLS_TEST_HOUSE_B_ID (ID da casa B)
 *
 * Sem variáveis, encerra com código 0 e mensagem (não falha CI).
 *
 * Uso: npx ts-node test/rls/run-rls-checks.ts
 */
import { getTestConfig } from './helpers/rls-test-client';
import { runTasksRlsChecks } from './checks/tasks.rls';
import { runExpensesRlsChecks } from './checks/expenses.rls';
import { runNotificationsRlsChecks } from './checks/notifications.rls';

interface CheckResult {
  table: string;
  passed: boolean;
}

async function main() {
  const config = getTestConfig();

  if (!config) {
    console.log('[RLS] Pulando: defina as variáveis de ambiente para teste RLS.');
    console.log('  Necessárias: RLS_TEST_SUPABASE_URL, RLS_TEST_SUPABASE_ANON_KEY');
    console.log('  Necessárias: RLS_TEST_USER_A_EMAIL, RLS_TEST_USER_A_PASSWORD');
    console.log('  Necessárias: RLS_TEST_USER_B_EMAIL, RLS_TEST_USER_B_PASSWORD');
    console.log('  Necessárias: RLS_TEST_HOUSE_A_ID, RLS_TEST_HOUSE_B_ID');
    process.exit(0);
  }

  console.log('\n========================================');
  console.log('   RLS Integration Tests - Luma APP');
  console.log('========================================\n');

  const results: CheckResult[] = [];

  try {
    console.log('Executando checks RLS para tasks...');
    results.push({ table: 'tasks', passed: await runTasksRlsChecks(config) });

    console.log('\nExecutando checks RLS para expenses...');
    results.push({ table: 'expenses', passed: await runExpensesRlsChecks(config) });

    console.log('\nExecutando checks RLS para notifications...');
    results.push({ table: 'notifications', passed: await runNotificationsRlsChecks(config) });

  } catch (error) {
    console.error('[RLS] Erro durante execução:', error);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('           RESUMO FINAL');
  console.log('========================================');

  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? '✓' : '✗';
    console.log(`  ${status} ${r.table}`);
    if (!r.passed) allPassed = false;
  }

  console.log('========================================');

  if (allPassed) {
    console.log('✓ TODOS OS CHECKS RLS PASSARAM');
    process.exit(0);
  } else {
    console.log('✗ ALGUNS CHECKS FALHARAM - VERIFICAR POLÍTICAS RLS');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('[RLS] Erro fatal:', e);
  process.exit(1);
});

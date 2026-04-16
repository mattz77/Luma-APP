/**
 * Suíte de integração RLS — requer Supabase real (local ou staging).
 *
 * Variáveis:
 * - RLS_TEST_SUPABASE_URL
 * - RLS_TEST_SUPABASE_ANON_KEY (ou publishable)
 * - RLS_TEST_USER_A_EMAIL / RLS_TEST_USER_A_PASSWORD (membro da casa A)
 * - RLS_TEST_USER_B_EMAIL / RLS_TEST_USER_B_PASSWORD (membro da casa B)
 *
 * Sem variáveis, encerra com código 0 e mensagem (não falha CI).
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.RLS_TEST_SUPABASE_URL;
const anon = process.env.RLS_TEST_SUPABASE_ANON_KEY ?? process.env.RLS_TEST_SUPABASE_PUBLISHABLE_KEY;

async function main() {
  if (!url?.trim() || !anon?.trim()) {
    console.log('[RLS] Pulando: defina RLS_TEST_SUPABASE_URL e chave anon/publishable.');
    process.exit(0);
  }

  const emailA = process.env.RLS_TEST_USER_A_EMAIL;
  const passA = process.env.RLS_TEST_USER_A_PASSWORD;
  const emailB = process.env.RLS_TEST_USER_B_EMAIL;
  const passB = process.env.RLS_TEST_USER_B_PASSWORD;

  if (!emailA || !passA || !emailB || !passB) {
    console.log('[RLS] Pulando: defina credenciais RLS_TEST_USER_*_EMAIL / PASSWORD para dois usuários.');
    process.exit(0);
  }

  const clientA = createClient(url, anon);
  const { error: errA } = await clientA.auth.signInWithPassword({ email: emailA, password: passA });
  if (errA) {
    console.error('[RLS] Falha login usuário A:', errA.message);
    process.exit(1);
  }

  const { data: sessA } = await clientA.auth.getSession();
  const houseA = process.env.RLS_TEST_HOUSE_A_ID;
  if (!houseA) {
    console.log('[RLS] Opcional: RLS_TEST_HOUSE_A_ID para assert de escopo.');
    await clientA.auth.signOut();
    process.exit(0);
  }

  const { data: tasks, error: qErr } = await clientA.from('tasks').select('id').eq('house_id', houseA).limit(5);

  if (qErr) {
    console.error('[RLS] Query tasks como usuário A:', qErr.message);
    await clientA.auth.signOut();
    process.exit(1);
  }

  console.log('[RLS] Usuário A: leitura tasks na casa permitida, linhas:', tasks?.length ?? 0);

  await clientA.auth.signOut();

  const clientB = createClient(url, anon);
  const { error: errB } = await clientB.auth.signInWithPassword({ email: emailB, password: passB });
  if (errB) {
    console.error('[RLS] Falha login usuário B:', errB.message);
    process.exit(1);
  }

  const { data: leak, error: crossErr } = await clientB.from('tasks').select('id').eq('house_id', houseA).limit(5);

  if (crossErr) {
    console.log('[RLS] Cross-tenant: erro ao ler casa alheia (esperado em algumas políticas):', crossErr.message);
  } else if ((leak?.length ?? 0) === 0) {
    console.log('[RLS] Cross-tenant: nenhuma linha da casa A visível para B (OK).');
  } else {
    console.error('[RLS] FALHA: usuário B enxergou tarefas da casa A.');
    await clientB.auth.signOut();
    process.exit(1);
  }

  await clientB.auth.signOut();
  console.log('[RLS] Checagens básicas concluídas. Sessão A:', !!sessA?.session);
}

main().catch((e) => {
  console.error('[RLS]', e);
  process.exit(1);
});

import { SupabaseClient } from '@supabase/supabase-js';

import { RlsCheckResult, reportResults } from '../helpers/rls-assertions';
import { RlsTestConfig, createAnonClient, createAuthenticatedClient, signOutClient } from '../helpers/rls-test-client';

export async function runAuthFlowsChecks(config: RlsTestConfig): Promise<boolean> {
  const results: RlsCheckResult[] = [];
  const anonClient = createAnonClient(config);

  results.push(await checkSignUp(anonClient));
  results.push(await checkSignInValid(config));
  results.push(await checkSignInInvalid(anonClient, config));
  results.push(await checkGetUser(config));
  results.push(await checkResetPassword(anonClient, config));
  results.push(await checkSignOut(config));

  return reportResults(results, 'auth-flows');
}

async function checkSignUp(client: SupabaseClient): Promise<RlsCheckResult> {
  const email = `rls-auth-${Date.now()}@example.com`;
  const password = 'LumaAuthFlow#123';

  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { passed: false, message: `[FALHA] signUp: ${error.message}` };
  }

  if (!data.user) {
    return { passed: false, message: '[FALHA] signUp: sem user retornado' };
  }

  return { passed: true, message: '[OK] signUp: usuário criado (com ou sem sessão ativa)' };
}

async function checkSignInValid(config: RlsTestConfig): Promise<RlsCheckResult> {
  const { client } = await createAuthenticatedClient(config, 'A');
  try {
    const { data, error } = await client.auth.getUser();
    if (error) {
      return { passed: false, message: `[FALHA] signIn válido/getUser: ${error.message}` };
    }
    if (!data.user?.id) {
      return { passed: false, message: '[FALHA] signIn válido/getUser: usuário ausente' };
    }
    return { passed: true, message: '[OK] signIn válido: sessão autenticada com sucesso' };
  } finally {
    await signOutClient(client);
  }
}

async function checkSignInInvalid(client: SupabaseClient, config: RlsTestConfig): Promise<RlsCheckResult> {
  const { error } = await client.auth.signInWithPassword({
    email: config.userA.email,
    password: 'senha-invalida',
  });

  if (!error) {
    return { passed: false, message: '[FALHA] signIn inválido: deveria retornar erro' };
  }

  return { passed: true, message: '[OK] signIn inválido: erro retornado como esperado' };
}

async function checkGetUser(config: RlsTestConfig): Promise<RlsCheckResult> {
  const { client, userId } = await createAuthenticatedClient(config, 'A');
  try {
    const { data, error } = await client.auth.getUser();
    if (error) {
      return { passed: false, message: `[FALHA] getUser: ${error.message}` };
    }
    if (!data.user || data.user.id !== userId) {
      return { passed: false, message: '[FALHA] getUser: usuário autenticado não confere' };
    }
    return { passed: true, message: '[OK] getUser: retornou usuário da sessão' };
  } finally {
    await signOutClient(client);
  }
}

async function checkResetPassword(client: SupabaseClient, config: RlsTestConfig): Promise<RlsCheckResult> {
  const { error } = await client.auth.resetPasswordForEmail(config.userA.email);
  if (error) {
    return { passed: false, message: `[FALHA] resetPasswordForEmail: ${error.message}` };
  }
  return { passed: true, message: '[OK] resetPasswordForEmail: requisição enviada sem erro' };
}

async function checkSignOut(config: RlsTestConfig): Promise<RlsCheckResult> {
  const { client } = await createAuthenticatedClient(config, 'A');
  const { error } = await client.auth.signOut();
  if (error) {
    return { passed: false, message: `[FALHA] signOut: ${error.message}` };
  }

  const { data, error: getUserError } = await client.auth.getUser();
  if (getUserError) {
    return { passed: true, message: '[OK] signOut: sessão invalidada (getUser retornou erro)' };
  }
  if (data.user) {
    return { passed: false, message: '[FALHA] signOut: sessão ainda ativa' };
  }
  return { passed: true, message: '[OK] signOut: usuário removido da sessão' };
}

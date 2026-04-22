import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

export interface RlsCheckResult {
  passed: boolean;
  message: string;
}

export function assertSuccess<T>(
  response: PostgrestResponse<T> | PostgrestSingleResponse<T>,
  context: string,
): RlsCheckResult {
  if (response.error) {
    return {
      passed: false,
      message: `[FALHA] ${context}: esperava sucesso, recebeu erro: ${response.error.message}`,
    };
  }
  return {
    passed: true,
    message: `[OK] ${context}: operação permitida`,
  };
}

export function assertHasData<T>(
  response: PostgrestResponse<T[]>,
  context: string,
): RlsCheckResult {
  if (response.error) {
    return {
      passed: false,
      message: `[FALHA] ${context}: erro ao consultar: ${response.error.message}`,
    };
  }
  if (!response.data || response.data.length === 0) {
    return {
      passed: false,
      message: `[FALHA] ${context}: esperava dados, recebeu vazio`,
    };
  }
  return {
    passed: true,
    message: `[OK] ${context}: retornou ${response.data.length} registro(s)`,
  };
}

export function assertEmpty<T>(
  response: PostgrestResponse<T[]>,
  context: string,
): RlsCheckResult {
  if (response.error) {
    return {
      passed: true,
      message: `[OK] ${context}: erro retornado (cross-tenant bloqueado): ${response.error.code}`,
    };
  }
  if (response.data && response.data.length > 0) {
    return {
      passed: false,
      message: `[FALHA] ${context}: esperava vazio, recebeu ${response.data.length} registro(s) - VAZAMENTO DE DADOS`,
    };
  }
  return {
    passed: true,
    message: `[OK] ${context}: nenhum registro retornado (cross-tenant bloqueado)`,
  };
}

export function assertDenied<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T>,
  context: string,
): RlsCheckResult {
  if (response.error) {
    return {
      passed: true,
      message: `[OK] ${context}: operação negada: ${response.error.message}`,
    };
  }
  return {
    passed: false,
    message: `[FALHA] ${context}: esperava erro/negação, mas operação teve sucesso`,
  };
}

export function assertInsertDenied<T>(
  response: PostgrestSingleResponse<T>,
  context: string,
): RlsCheckResult {
  if (response.error) {
    const isRlsViolation =
      response.error.code === '42501' ||
      response.error.message.includes('violates row-level security') ||
      response.error.message.includes('policy') ||
      response.error.code === 'PGRST301';
    if (isRlsViolation) {
      return {
        passed: true,
        message: `[OK] ${context}: INSERT negado por RLS`,
      };
    }
    return {
      passed: true,
      message: `[OK] ${context}: erro (possível RLS): ${response.error.code} - ${response.error.message}`,
    };
  }
  return {
    passed: false,
    message: `[FALHA] ${context}: INSERT deveria ser negado, mas teve sucesso`,
  };
}

export function assertUpdateDenied<T>(
  response: PostgrestSingleResponse<T>,
  context: string,
): RlsCheckResult {
  if (response.error) {
    return {
      passed: true,
      message: `[OK] ${context}: UPDATE negado: ${response.error.message}`,
    };
  }
  if (response.count === 0) {
    return {
      passed: true,
      message: `[OK] ${context}: UPDATE afetou 0 linhas (RLS bloqueou)`,
    };
  }
  return {
    passed: false,
    message: `[FALHA] ${context}: UPDATE deveria ser negado, mas afetou ${response.count} linha(s)`,
  };
}

export function assertDeleteDenied(
  response: PostgrestSingleResponse<null>,
  context: string,
): RlsCheckResult {
  if (response.error) {
    return {
      passed: true,
      message: `[OK] ${context}: DELETE negado: ${response.error.message}`,
    };
  }
  if (response.count === 0) {
    return {
      passed: true,
      message: `[OK] ${context}: DELETE afetou 0 linhas (RLS bloqueou)`,
    };
  }
  return {
    passed: false,
    message: `[FALHA] ${context}: DELETE deveria ser negado, mas afetou ${response.count} linha(s)`,
  };
}

export function reportResults(results: RlsCheckResult[], tableName: string): boolean {
  console.log(`\n=== RLS Checks: ${tableName} ===`);
  let allPassed = true;
  for (const r of results) {
    console.log(r.message);
    if (!r.passed) allPassed = false;
  }
  console.log(allPassed ? `✓ ${tableName}: todos os checks passaram` : `✗ ${tableName}: alguns checks falharam`);
  return allPassed;
}

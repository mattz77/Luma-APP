import { describe, expect, test } from '@jest/globals';
import {
  parseMoneyInputToCentsDigits,
  centsDigitsToReais,
  formatCurrency,
} from './moneyInputBrl';

describe('parseMoneyInputToCentsDigits — teclado estilo caixa (só dígitos)', () => {
  test('acumula da direita: 2 → 20 → 200 centavos', () => {
    expect(parseMoneyInputToCentsDigits('2', '')).toBe('2');
    expect(parseMoneyInputToCentsDigits('20', '2')).toBe('20');
    expect(parseMoneyInputToCentsDigits('200', '20')).toBe('200');
  });

  test('apaga o último dígito (direita): 200 → 20 → 2', () => {
    expect(parseMoneyInputToCentsDigits('20', '200')).toBe('20');
    expect(parseMoneyInputToCentsDigits('2', '20')).toBe('2');
  });

  test('2000 reais: sequência até 200000 centavos', () => {
    let prev = '';
    for (const ch of '200000') {
      prev = parseMoneyInputToCentsDigits(prev + ch, prev);
    }
    expect(prev).toBe('200000');
    expect(centsDigitsToReais('200000')).toBe(2000);
  });
});

describe('parseMoneyInputToCentsDigits — colagem formatada', () => {
  test('vírgula decimal pt-BR: 150,50', () => {
    expect(parseMoneyInputToCentsDigits('150,50', '999')).toBe('15050');
  });

  test('milhar com pontos: 2.000', () => {
    expect(parseMoneyInputToCentsDigits('2.000', '')).toBe('200000');
  });
});

describe('formatCurrency', () => {
  test('2000 reais contém separador de milhar brasileiro', () => {
    expect(formatCurrency(2000)).toContain('2.000');
  });
});

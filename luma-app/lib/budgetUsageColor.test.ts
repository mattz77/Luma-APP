import { describe, expect, test } from '@jest/globals';
import { BUDGET_USAGE_COLORS, getBudgetUsageColor } from './budgetUsageColor';

describe('getBudgetUsageColor', () => {
  test('verde até 30% e transição 31–35', () => {
    expect(getBudgetUsageColor(0)).toBe(BUDGET_USAGE_COLORS.green);
    expect(getBudgetUsageColor(30)).toBe(BUDGET_USAGE_COLORS.green);
    expect(getBudgetUsageColor(31)).toBe(BUDGET_USAGE_COLORS.green);
    expect(getBudgetUsageColor(35)).toBe(BUDGET_USAGE_COLORS.green);
  });

  test('amarelo após 35 até 60 e gap 61–65', () => {
    expect(getBudgetUsageColor(36)).toBe(BUDGET_USAGE_COLORS.yellow);
    expect(getBudgetUsageColor(40)).toBe(BUDGET_USAGE_COLORS.yellow);
    expect(getBudgetUsageColor(60)).toBe(BUDGET_USAGE_COLORS.yellow);
    expect(getBudgetUsageColor(65)).toBe(BUDGET_USAGE_COLORS.yellow);
  });

  test('laranja 66–69, 70–80 e 81–90', () => {
    expect(getBudgetUsageColor(66)).toBe(BUDGET_USAGE_COLORS.orange);
    expect(getBudgetUsageColor(70)).toBe(BUDGET_USAGE_COLORS.orange);
    expect(getBudgetUsageColor(80)).toBe(BUDGET_USAGE_COLORS.orange);
    expect(getBudgetUsageColor(90)).toBe(BUDGET_USAGE_COLORS.orange);
  });

  test('vermelho acima de 90%', () => {
    expect(getBudgetUsageColor(91)).toBe(BUDGET_USAGE_COLORS.red);
    expect(getBudgetUsageColor(100)).toBe(BUDGET_USAGE_COLORS.red);
  });

  test('normaliza valores fora do intervalo', () => {
    expect(getBudgetUsageColor(-1)).toBe(BUDGET_USAGE_COLORS.green);
    expect(getBudgetUsageColor(200)).toBe(BUDGET_USAGE_COLORS.red);
  });
});

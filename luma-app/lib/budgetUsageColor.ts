/**
 * Cor do indicador de uso do orçamento (gasto vs limite).
 * Faixas explícitas + transições nos buracos por ponto médio (35 entre 30–40, 65 entre 60–70).
 * Vermelho apenas acima de 90%.
 */
export const BUDGET_USAGE_COLORS = {
  green: '#22c55e',
  yellow: '#FDE047',
  orange: '#f97316',
  red: '#dc2626',
} as const;

export function getBudgetUsageColor(percent: number): string {
  const p = Math.min(Math.max(Number.isFinite(percent) ? percent : 0), 100);

  if (p > 90) return BUDGET_USAGE_COLORS.red;
  if (p > 80 && p <= 90) return BUDGET_USAGE_COLORS.orange;
  if (p >= 70 && p <= 80) return BUDGET_USAGE_COLORS.orange;
  if (p > 65 && p < 70) return BUDGET_USAGE_COLORS.orange;
  if (p > 60 && p <= 65) return BUDGET_USAGE_COLORS.yellow;
  if (p >= 40 && p <= 60) return BUDGET_USAGE_COLORS.yellow;
  if (p > 35 && p < 40) return BUDGET_USAGE_COLORS.yellow;
  if (p > 30 && p <= 35) return BUDGET_USAGE_COLORS.green;

  return BUDGET_USAGE_COLORS.green;
}

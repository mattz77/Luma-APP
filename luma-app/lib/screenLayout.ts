/** Espaço livre acima do dock flutuante (TabBar) — alinhar com Finanças/Tarefas. */
export const TAB_DOCK_OVERLAY_CLEARANCE = 120;

export function getTabScrollBottomPadding(bottomInset: number): number {
  return TAB_DOCK_OVERLAY_CLEARANCE + bottomInset;
}

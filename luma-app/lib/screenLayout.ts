import { Platform } from 'react-native';

/** Espaço livre acima do dock flutuante (TabBar) — iOS exige folga maior para não ocultar o último card. */
export const TAB_DOCK_OVERLAY_CLEARANCE = Platform.OS === 'ios' ? 156 : 120;

export function getTabScrollBottomPadding(bottomInset: number): number {
  return TAB_DOCK_OVERLAY_CLEARANCE + bottomInset;
}

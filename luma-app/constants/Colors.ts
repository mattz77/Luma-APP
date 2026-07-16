/**
 * Compat layer — mapeia a API antiga de Colors para o Luma DS v2 (theme.ts).
 * Novas telas devem importar de '@/constants/theme'. Este arquivo existe para
 * não quebrar as ~100 referências legadas enquanto migram.
 */
import { light, dark } from './theme';

const palette = {
  merino: light.paper,
  white: light.surface,
  portGore: light.ink,
  festival: light.accent,
  razzmatazz: light.accent, // acento único: rosa legado converge para âmbar
  fernFrond: light.good,
  shadyLady: light.inkFaint,
  black: light.ink,
  slate: light.inkSoft,
};

export const Colors = {
  light: {
    text: light.ink,
    background: light.paper,
    tint: light.accent,
    tabIconDefault: light.inkFaint,
    tabIconSelected: light.ink,
  },
  dark: {
    text: dark.ink,
    background: dark.paper,
    tint: dark.accent,
    tabIconDefault: dark.inkFaint,
    tabIconSelected: dark.ink,
  },
  // Semantic names for usage in app
  primary: light.ink,
  accent: light.accent,
  secondary: light.ink, // ações secundárias em tinta, não em cor paralela
  background: light.paper,
  card: light.surface,
  text: light.ink,
  textSecondary: light.inkSoft,
  success: light.good,
  palette,
};

export default Colors;

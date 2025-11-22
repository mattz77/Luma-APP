const palette = {
  merino: '#F9F5F0', // Main Background (Cream/Beige)
  white: '#FFFFFF', // Card Background
  portGore: '#352352', // Primary Text / Strong UI Elements (Deep Purple)
  festival: '#fbf469', // Primary Accent (Yellow) - Use for highlights/active states
  razzmatazz: '#e5015c', // Secondary Accent (Pink)
  fernFrond: '#6b6c20', // Success / Green-ish
  shadyLady: '#a39fa1', // Secondary Text
  black: '#1a1a1a',
  slate: '#64748b',
};

export const Colors = {
  light: {
    text: palette.portGore,
    background: palette.merino,
    tint: palette.razzmatazz,
    tabIconDefault: palette.shadyLady,
    tabIconSelected: palette.razzmatazz,
  },
  dark: {
    text: palette.portGore,
    background: palette.merino,
    tint: palette.razzmatazz,
    tabIconDefault: palette.shadyLady,
    tabIconSelected: palette.razzmatazz,
  },
  // Semantic names for usage in app
  primary: palette.portGore, // Dark purple as primary for text/buttons to contrast with beige
  accent: palette.festival, // Yellow for highlights
  secondary: palette.razzmatazz, // Pink for secondary actions
  background: palette.merino,
  card: palette.white,
  text: palette.portGore,
  textSecondary: palette.slate,
  success: palette.fernFrond,
  palette, // Export raw palette if needed
};

export default Colors;

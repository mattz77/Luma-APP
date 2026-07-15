/**
 * Tokens extraídos de `assets/newlogin.html` (:root) — telas de autenticação.
 * Tipografia: sistema (plano — sem DM Sans / Playfair em runtime).
 */
export const authTheme = {
  // Alinhado ao Luma DS v2 (constants/theme.ts, modo dark): a entrada escura
  // com a luz âmbar é o mesmo acento do app aceso por dentro.
  bgDeep: '#131018',
  bgSurface: '#1D1926',
  bgCard: 'rgba(29, 25, 38, 0.85)',
  border: 'rgba(246, 181, 30, 0.12)',
  borderFocus: 'rgba(246, 181, 30, 0.4)',
  amber: '#F6B51E',
  amberLight: '#FFC53D',
  amberGlow: 'rgba(246, 181, 30, 0.15)',
  amberSoft: 'rgba(246, 181, 30, 0.06)',
  blueStain: '#26212F',
  purpleStain: '#26212F',
  textPrimary: '#F4F1EA',
  textSecondary: 'rgba(244, 241, 234, 0.55)',
  textMuted: 'rgba(244, 241, 234, 0.3)',
  error: '#E06C6C',
  success: '#4CAF82',
  inputBg: 'rgba(255, 255, 255, 0.04)',
  googleBg: 'rgba(255, 255, 255, 0.06)',
  googleBorder: 'rgba(255, 255, 255, 0.1)',
  primaryButtonText: '#1B1725',
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  radiusXl: 28,
  inputHeight: 52,
  primaryGradient: ['#F6B51E', '#E3A410'] as const,
  primaryGradientHover: ['#FFC53D', '#F6B51E'] as const,
} as const;

/** `undefined` = fonte do sistema; combinar com `fontWeight` nos estilos. */
export const authFontFamilies = {
  sans: undefined as string | undefined,
  sansMedium: undefined as string | undefined,
  sansSemiBold: undefined as string | undefined,
  sansBold: undefined as string | undefined,
  display: undefined as string | undefined,
  displaySemiBold: undefined as string | undefined,
} as const;

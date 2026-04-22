/**
 * Tokens extraídos de `assets/newlogin.html` (:root) — telas de autenticação.
 * Tipografia: sistema (plano — sem DM Sans / Playfair em runtime).
 */
export const authTheme = {
  bgDeep: '#0C0E14',
  bgSurface: '#13151D',
  bgCard: 'rgba(22, 25, 36, 0.85)',
  border: 'rgba(212, 175, 55, 0.12)',
  borderFocus: 'rgba(212, 175, 55, 0.4)',
  amber: '#D4AF37',
  amberLight: '#E8C84A',
  amberGlow: 'rgba(212, 175, 55, 0.15)',
  amberSoft: 'rgba(212, 175, 55, 0.06)',
  blueStain: '#1B3A5C',
  purpleStain: '#4A2060',
  textPrimary: '#F0EDE5',
  textSecondary: 'rgba(240, 237, 229, 0.55)',
  textMuted: 'rgba(240, 237, 229, 0.3)',
  error: '#E05252',
  success: '#4ADE80',
  inputBg: 'rgba(255, 255, 255, 0.04)',
  googleBg: 'rgba(255, 255, 255, 0.06)',
  googleBorder: 'rgba(255, 255, 255, 0.1)',
  primaryButtonText: '#0C0E14',
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  radiusXl: 28,
  inputHeight: 52,
  primaryGradient: ['#D4AF37', '#C49A2E'] as const,
  primaryGradientHover: ['#E8C84A', '#D4AF37'] as const,
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

/**
 * Luma Design System v2 — "Paper & Light"
 *
 * Identidade: a casa acesa. Papel quente como fundo, tinta única para
 * conteúdo, UM acento âmbar (a luz) para ação primária e presença da Luma.
 *
 * Regras (não negociáveis):
 * 1. Um acento por app. Âmbar. Sem azul/rosa/roxo paralelos.
 * 2. Texto nunca usa o acento — tinta ou tinta suave.
 * 3. CTA primário = superfície âmbar + texto tinta (contraste AA garantido).
 * 4. Raio: cartões 20, controles 14, chips full. Nada fora disso.
 * 5. Sombra única e morna; elevação comunica hierarquia, não decoração.
 */

export const light = {
  // Superfícies
  paper: '#FAF8F2', // fundo de tela
  surface: '#FFFFFF', // cartões
  surfaceSunken: '#F1EEE6', // campos, wells
  line: '#EAE6DC', // hairlines
  overlay: 'rgba(25, 22, 34, 0.45)',

  // Tinta
  ink: '#1B1725', // texto primário (plum near-black)
  inkSoft: '#6F6A7A', // texto secundário
  inkFaint: '#A5A0AE', // placeholders, disabled

  // A luz (único acento)
  accent: '#F6B51E', // superfícies de ação primária
  accentPressed: '#E3A410',
  accentSoft: '#FBEED0', // fundos de destaque suaves
  onAccent: '#1B1725', // texto sobre âmbar

  // Semânticas (estado, nunca decoração)
  good: '#2E7D5B',
  goodSoft: '#E3F0E9',
  danger: '#D64545',
  dangerSoft: '#FBE7E7',
  warn: '#B45309',
  warnSoft: '#FCEEDC',
} as const;

export const dark = {
  paper: '#131018',
  surface: '#1D1926',
  surfaceSunken: '#26212F',
  line: '#2C2735',
  overlay: 'rgba(0, 0, 0, 0.6)',

  ink: '#F4F1EA',
  inkSoft: '#A9A4B3',
  inkFaint: '#6E6978',

  accent: '#F6B51E',
  accentPressed: '#FFC53D',
  accentSoft: '#332B14',
  onAccent: '#1B1725',

  good: '#4CAF82',
  goodSoft: '#1B2E25',
  danger: '#E06C6C',
  dangerSoft: '#331B1B',
  warn: '#E8A04C',
  warnSoft: '#33260F',
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };

export const radius = {
  card: 20,
  control: 14,
  chip: 999,
  sheet: 28,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // padding padrão de tela
  xxl: 28,
  section: 36,
} as const;

export const type = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 38 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 28 },
  heading: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#191622',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  raised: {
    shadowColor: '#191622',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 26,
    elevation: 6,
  },
} as const;

export const theme = { light, dark, radius, space, type, shadow };
export default theme;

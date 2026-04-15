import {
  Platform,
  processColor,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

function shadowColorToRgba(color: unknown, opacity: number): string {
  if (opacity <= 0) return 'transparent';
  if (color == null) return `rgba(0,0,0,${opacity})`;
  try {
    const n = processColor(color as never);
    if (n == null || typeof n !== 'number') {
      return `rgba(0,0,0,${opacity})`;
    }
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return `rgba(${r},${g},${b},${opacity})`;
  } catch {
    return `rgba(0,0,0,${opacity})`;
  }
}

/**
 * Estilos para hosts DOM no web:
 * - Achata `StyleProp` (incl. arrays `style={[a,b]}`) num único objeto — React DOM não aceita array como RN.
 * - Converte `shadow*` em `boxShadow` CSS.
 */
export function normalizeStyleForDomWeb(
  style: StyleProp<ViewStyle> | undefined
): StyleProp<ViewStyle> | undefined {
  if (style == null) return style;
  if (Platform.OS !== 'web') return style;
  const flat = StyleSheet.flatten(style);
  if (!flat) return undefined;

  const hasShadow =
    flat.shadowColor != null ||
    flat.shadowOffset != null ||
    flat.shadowOpacity != null ||
    flat.shadowRadius != null;
  /** Sempre devolver objeto plano no web: `style={[a,b]}` (RN) quebra o DOM (`CSSStyleDeclaration` / índice [0]). */
  if (!hasShadow) return flat as ViewStyle;

  const {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation: _e,
    ...rest
  } = flat;

  const ox =
    shadowOffset && typeof shadowOffset === 'object'
      ? (shadowOffset.width ?? 0)
      : 0;
  const oy =
    shadowOffset && typeof shadowOffset === 'object'
      ? (shadowOffset.height ?? 0)
      : 0;
  const blur = shadowRadius ?? 0;
  const opacity = shadowOpacity ?? 1;
  const color = shadowColorToRgba(shadowColor, opacity);

  return {
    ...rest,
    boxShadow: `${ox}px ${oy}px ${blur}px ${color}`,
  } as ViewStyle;
}

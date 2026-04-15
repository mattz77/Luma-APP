import { Dimensions, Platform, StyleSheet, type ViewStyle } from 'react-native';

/** Intensidade do `BlurView` (expo-blur) — alinhado aos bottom sheets Luma */
export const LUMA_MODAL_BLUR_INTENSITY = {
  ios: 20,
  android: 30,
  /** Web: `expo-blur` aplica `backdrop-filter` (ver `BlurView.web.tsx`). */
  web: 42,
} as const;

export function getModalOverlayBlurIntensity(): number {
  if (Platform.OS === 'ios') return LUMA_MODAL_BLUR_INTENSITY.ios;
  if (Platform.OS === 'web') return LUMA_MODAL_BLUR_INTENSITY.web;
  return LUMA_MODAL_BLUR_INTENSITY.android;
}

/**
 * Garante área cobrindo o viewport (crítico no **web** dentro de `Modal` transparente,
 * onde `absolute` + `inset-0` pode colapsar altura e o blur some).
 */
export function getModalOverlayLayerStyle(): ViewStyle {
  const { height } = Dimensions.get('window');
  return {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    minHeight: height,
    zIndex: 0,
  };
}

/**
 * Durações FadeIn/FadeOut do overlay (Reanimated).
 * Web um pouco mais curto para compensar custo de compositing.
 */
export function getModalOverlayDurations(): { enterMs: number; exitMs: number } {
  if (Platform.OS === 'web') {
    return { enterMs: 95, exitMs: 70 };
  }
  return { enterMs: 130, exitMs: 85 };
}

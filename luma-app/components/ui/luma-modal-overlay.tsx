import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  getModalOverlayBlurIntensity,
  getModalOverlayDurations,
  getModalOverlayLayerStyle,
} from '@/lib/modalOverlayTokens';

export interface LumaModalOverlayProps {
  /** Tap fora do sheet (backdrop). */
  onRequestClose: () => void;
}

/**
 * Overlay único para bottom sheets Luma: `BlurView` (expo-blur) em todas as plataformas —
 * na web o pacote aplica `backdrop-filter` via `BlurView.web.tsx` + scrim + vinheta topo/fundo.
 */
export function LumaModalOverlay({ onRequestClose }: LumaModalOverlayProps) {
  const { enterMs } = getModalOverlayDurations();
  const intensity = getModalOverlayBlurIntensity();
  const layerStyle = getModalOverlayLayerStyle();

  /** Sem `exiting`: ao fechar o `Modal`, FadeOut competia com o teardown nativo e gerava piscada. */
  const vignette = (
    <Animated.View
      entering={FadeIn.duration(enterMs)}
      pointerEvents="none"
      style={[layerStyle, { zIndex: 1 }]}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0)']}
        locations={[0, 0.3, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%' }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.15)']}
        locations={[0, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
      />
    </Animated.View>
  );

  return (
    <>
      <Animated.View entering={FadeIn.duration(enterMs)} style={layerStyle}>
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onRequestClose}
          accessibilityLabel="Fechar"
        />
      </Animated.View>
      {vignette}
    </>
  );
}

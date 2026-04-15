import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import type { BlurTint } from 'expo-blur';
import { liquidGlassShader } from '../../assets/shaders/liquidGlass';
import { AdaptiveGlass } from './AdaptiveGlass';

let Canvas: typeof import('@shopify/react-native-skia').Canvas | undefined;
let Fill: typeof import('@shopify/react-native-skia').Fill | undefined;
let Shader: typeof import('@shopify/react-native-skia').Shader | undefined;
let Skia: typeof import('@shopify/react-native-skia').Skia | undefined;

if (Platform.OS !== 'web') {
  try {
    const skia = require('@shopify/react-native-skia');
    Canvas = skia.Canvas;
    Fill = skia.Fill;
    Shader = skia.Shader;
    Skia = skia.Skia;
  } catch (error) {
    console.warn('[LiquidGlassCard] Skia não disponível:', error);
  }
}

type LegacyTint =
  | 'light'
  | 'dark'
  | 'default'
  | 'systemMaterial'
  | 'systemMaterialLight'
  | 'systemThinMaterial'
  | 'systemThinMaterialLight'
  | 'systemUltraThinMaterial'
  | 'systemUltraThinMaterialLight';

export interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  /** Preferir `blurTint` quando possível (contrato do `expo-blur`). */
  tint?: LegacyTint;
  blurTint?: BlurTint;
  animated?: boolean;
  /** Brilho extra via shader Skia (só nativo; custo maior). */
  skiaHighlight?: boolean;
  borderRadius?: number;
}

function resolveBlurTint(tint: LegacyTint): BlurTint {
  if (Platform.OS === 'ios') {
    return tint as BlurTint;
  }
  return String(tint).includes('dark') ? 'dark' : 'light';
}

function normalizeBorderRadius(
  value: number | string | undefined,
  fallback: number
): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

type SkiaOverlayProps = {
  layout: { width: number; height: number };
  animated: boolean;
};

function LiquidGlassSkiaOverlay({ layout, animated }: SkiaOverlayProps) {
  const sourceShader = useMemo(() => {
    if (!Skia?.RuntimeEffect) return null;
    try {
      return Skia.RuntimeEffect.Make(liquidGlassShader);
    } catch (error) {
      console.warn('[LiquidGlassCard] Erro ao criar shader:', error);
      return null;
    }
  }, []);

  const time = useSharedValue(0);
  const touchX = useSharedValue(layout.width / 2);
  const touchY = useSharedValue(layout.height / 2);
  const resolutionX = useSharedValue(layout.width);
  const resolutionY = useSharedValue(layout.height);

  useEffect(() => {
    resolutionX.value = layout.width;
    resolutionY.value = layout.height;
    touchX.value = layout.width / 2;
    touchY.value = layout.height / 2;
  }, [layout.width, layout.height, resolutionX, resolutionY, touchX, touchY]);

  useEffect(() => {
    if (animated) {
      time.value = withRepeat(
        withTiming(100, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      time.value = 0;
    }
  }, [animated, time]);

  const uniforms = useDerivedValue(() => {
    'worklet';
    return {
      resolution: [resolutionX.value, resolutionY.value],
      time: time.value,
      touch: [touchX.value, touchY.value],
    };
  });

  if (
    !sourceShader ||
    !Canvas ||
    !Fill ||
    !Shader ||
    layout.width <= 0 ||
    layout.height <= 0
  ) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width: layout.width, height: layout.height }}>
        <Fill>
          <Shader source={sourceShader} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  style,
  intensity = 80,
  tint = 'systemThinMaterialLight',
  blurTint: blurTintProp,
  animated = false,
  skiaHighlight = false,
  borderRadius: borderRadiusProp,
}) => {
  const isWeb = Platform.OS === 'web';
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const blurTint = blurTintProp ?? resolveBlurTint(tint);

  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;
  const flatRadius = flatStyle?.borderRadius;
  const borderRadiusFromStyle =
    typeof flatRadius === 'number'
      ? flatRadius
      : typeof flatRadius === 'string'
        ? parseFloat(flatRadius)
        : undefined;
  const borderRadius = normalizeBorderRadius(
    borderRadiusProp ?? borderRadiusFromStyle,
    32
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const showSkia =
    skiaHighlight && !isWeb && layout.width > 0 && layout.height > 0;

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {/* Camadas de vidro como no GlassCard: fundo absoluto; conteúdo é irmão para respeitar padding */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={handleLayout}
      >
        <AdaptiveGlass
          style={StyleSheet.absoluteFill}
          borderRadius={borderRadius}
          blurIntensity={intensity}
          blurTint={blurTint}
          variant="regular"
          tintColor="rgba(255,255,255,0.12)"
        >
          {showSkia && (
            <LiquidGlassSkiaOverlay layout={layout} animated={animated} />
          )}
          <View style={styles.glassOverlay} />
          <View style={[styles.borderOverlay, { borderRadius }]} />
        </AdaptiveGlass>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 2,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 2,
  },
  content: {
    zIndex: 3,
    flex: 1,
    position: 'relative',
  },
});

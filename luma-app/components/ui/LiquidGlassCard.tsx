import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Imports condicionais para Skia (apenas mobile)
let Canvas: any;
let Fill: any;
let Shader: any;
let Skia: any;
let Animated: any;
let useSharedValue: any;
let withRepeat: any;
let withTiming: any;
let Easing: any;
let useDerivedValue: any;
let liquidGlassShader: string;
let SourceShader: any = null;

// Só carrega Skia em mobile (iOS/Android)
if (Platform.OS !== 'web') {
  try {
    const skia = require('@shopify/react-native-skia');
    Canvas = skia.Canvas;
    Fill = skia.Fill;
    Shader = skia.Shader;
    Skia = skia.Skia;

    const reanimated = require('react-native-reanimated');
    Animated = reanimated.default;
    useSharedValue = reanimated.useSharedValue;
    withRepeat = reanimated.withRepeat;
    withTiming = reanimated.withTiming;
    Easing = reanimated.Easing;
    useDerivedValue = reanimated.useDerivedValue;

    const shaderModule = require('../../assets/shaders/liquidGlass');
    liquidGlassShader = shaderModule.liquidGlassShader;

    if (Skia?.RuntimeEffect) {
      SourceShader = Skia.RuntimeEffect.Make(liquidGlassShader);
    }
  } catch (error) {
    console.warn('Skia não disponível:', error);
  }
}

interface LiquidGlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'extraLight' | 'regular' | 'prominent' | 'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemChromeMaterial' | 'systemMaterialLight' | 'systemMaterialDark' | 'systemMaterialDn';
  colors?: string[]; // Opcional: passar cores para o shader (futuro)
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  style,
  intensity = 30,
  tint = 'light'
}) => {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Só usa Reanimated em mobile
  const time = isWeb ? null : useSharedValue ? useSharedValue(0) : null;
  const touchX = isWeb ? null : useSharedValue ? useSharedValue(width / 2) : null;
  const touchY = isWeb ? null : useSharedValue ? useSharedValue(height / 2) : null;

  useEffect(() => {
    if (!isWeb && time && withRepeat && withTiming && Easing) {
      time.value = withRepeat(
        withTiming(100, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isWeb]);

  const uniforms = isWeb || !useDerivedValue || !time ? null : useDerivedValue(() => {
    return {
      resolution: [width, height],
      time: time.value,
      touch: [touchX?.value ?? width / 2, touchY?.value ?? height / 2],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Camada 1: O Fluido Vivo (Skia) - Apenas Mobile */}
      {!isWeb && SourceShader && Canvas && uniforms && (
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={{ flex: 1 }}>
            <Fill>
              <Shader source={SourceShader} uniforms={uniforms} />
            </Fill>
          </Canvas>
        </View>
      )}

      {/* Fallback Web: Gradiente Dourado Simples */}
      {isWeb && (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Camada 2: O Vidro Fosco (Blur Nativo) */}
      <BlurView
        intensity={intensity}
        tint={tint as any}
        style={StyleSheet.absoluteFill}
      />

      {/* Camada 3: Borda de Refração (Borda "Glass") */}
      <View style={styles.borderOverlay} />

      {/* Camada 4: Conteúdo */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)', // Fallback mais sutil
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 2,
    pointerEvents: 'none', // Importante para não bloquear toques
  },
  content: {
    zIndex: 3,
    flex: 1, // Garantir que o conteúdo ocupe o espaço
  }
});

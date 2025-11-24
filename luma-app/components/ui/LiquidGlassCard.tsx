import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ViewStyle, Platform, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Imports condicionais para Skia (apenas mobile)
let Canvas: any;
let Fill: any;
let Shader: any;
let Skia: any;
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

    const shaderModule = require('../../assets/shaders/liquidGlass');
    liquidGlassShader = shaderModule.liquidGlassShader;

    if (Skia?.RuntimeEffect) {
      SourceShader = Skia.RuntimeEffect.Make(liquidGlassShader);
      if (SourceShader) {
        console.log('[LiquidGlassCard] Shader criado com sucesso');
      } else {
        console.warn('[LiquidGlassCard] Falha ao criar shader');
      }
    }
  } catch (error) {
    console.warn('[LiquidGlassCard] Skia não disponível:', error);
  }
}

interface LiquidGlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'extraLight' | 'regular' | 'prominent' | 'systemUltraThinMaterial' | 'systemThinMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemChromeMaterial' | 'systemMaterialLight' | 'systemMaterialDark' | 'systemMaterialDn';
  colors?: string[]; // Opcional: passar cores para o shader (futuro)
  animated?: boolean; // Controla se o shader deve animar (padrão: false para evitar problemas no iOS)
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  style,
  intensity = 20, // Reduzido para permitir que o shader apareça através do blur
  tint = 'light',
  animated = false // Desabilitado por padrão para evitar problemas no iOS
}) => {
  const isWeb = Platform.OS === 'web';
  const [layout, setLayout] = useState({ width: 200, height: 64 }); // Valores padrão

  // Sempre cria shared values (mesmo que não usados) para evitar warnings
  // Só usa Reanimated em mobile
  const time = isWeb ? null : useSharedValue(0);
  const touchX = isWeb ? null : useSharedValue(100);
  const touchY = isWeb ? null : useSharedValue(32);
  // Shared values para dimensões (evita acessar state do React no worklet)
  const resolutionX = isWeb ? null : useSharedValue(200);
  const resolutionY = isWeb ? null : useSharedValue(64);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
      if (!isWeb && touchX && touchY && resolutionX && resolutionY) {
        touchX.value = width / 2;
        touchY.value = height / 2;
        resolutionX.value = width;
        resolutionY.value = height;
      }
    }
  };

  useEffect(() => {
    // Só anima se explicitamente habilitado e não for web
    if (isWeb || !time) return;
    
    if (animated) {
      time.value = withRepeat(
        withTiming(100, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      // Se não animar, mantém time fixo em 0 para efeito estático
      time.value = 0;
    }
  }, [isWeb, animated, time]);

  // useDerivedValue deve ser chamado diretamente durante o render (é um hook)
  // Usa shared values para dimensões para evitar acessar state do React no worklet
  // Só cria uniforms se tiver dimensões válidas
  const hasValidDimensions = layout.width > 0 && layout.height > 0;
  const uniforms = (!isWeb && time && touchX && touchY && resolutionX && resolutionY && hasValidDimensions)
    ? useDerivedValue(() => {
        // Dentro do worklet do useDerivedValue, podemos acessar .value com segurança
        // Este código roda no worklet thread, não durante o render do React
        'worklet';
        return {
          resolution: [resolutionX.value, resolutionY.value],
          time: time.value,
          touch: [touchX.value, touchY.value],
        };
      })
    : null;

  return (
    <View 
      style={[styles.container, style]}
      onLayout={handleLayout}
    >
      {/* Camada 1: O Fluido Vivo (Skia) - Apenas Mobile */}
      {/* O shader deve estar ATRÁS do blur para criar o efeito de profundidade */}
      {!isWeb && SourceShader && Canvas && uniforms && hasValidDimensions ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={{ width: layout.width, height: layout.height }}>
            <Fill>
              <Shader source={SourceShader} uniforms={uniforms} />
            </Fill>
          </Canvas>
        </View>
      ) : !isWeb ? (
        // Fallback se shader não estiver disponível - gradiente translúcido sutil
        <LinearGradient
          colors={['rgba(240, 245, 250, 0.3)', 'rgba(235, 242, 248, 0.25)', 'rgba(240, 245, 250, 0.28)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        // Fallback Web: Gradiente Simples
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Camada 2: O Vidro Fosco (Blur Nativo) */}
      {/* Blur mais sutil para permitir que o shader apareça através */}
      <BlurView
        intensity={intensity}
        tint={tint as any}
        style={StyleSheet.absoluteFill}
      />

      {/* Camada 3: Overlay muito sutil para realçar o efeito glass sem interferir */}
      <View style={styles.glassOverlay} />

      {/* Camada 4: Borda de Refração (Borda "Glass") */}
      <View style={styles.borderOverlay} />

      {/* Camada 5: Conteúdo */}
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
    backgroundColor: 'rgba(255,255,255,0.02)', // Fallback muito sutil para não interferir
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)', // Overlay muito sutil para não interferir
    zIndex: 1,
    pointerEvents: 'none',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Borda mais sutil
    zIndex: 2,
    pointerEvents: 'none', // Importante para não bloquear toques
  },
  content: {
    zIndex: 3,
    flex: 1, // Garantir que o conteúdo ocupe o espaço
  }
});

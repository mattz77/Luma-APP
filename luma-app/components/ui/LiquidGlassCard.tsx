import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, Platform, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing,
  useDerivedValue 
} from 'react-native-reanimated';
import { liquidGlassShader } from '../../assets/shaders/liquidGlass';
import { LinearGradient } from 'expo-linear-gradient';

// Imports condicionais para Skia (apenas mobile)
let Canvas: any;
let Fill: any;
let Shader: any;
let Skia: any;

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

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'systemMaterial' | 'systemMaterialLight' | 'systemThinMaterial' | 'systemThinMaterialLight' | 'systemUltraThinMaterial' | 'systemUltraThinMaterialLight';
  animated?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({ 
  children, 
  style, 
  intensity = 80, // Aumentado para 80 para efeito "frosted" forte
  tint = 'systemThinMaterialLight', // Material mais fino e moderno do iOS
  animated = false
}) => {
  const isWeb = Platform.OS === 'web';
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  // Criar shader apenas em mobile e se Skia estiver disponível
  const sourceShader = useMemo(() => {
    if (isWeb || !Skia || !Skia.RuntimeEffect) {
      return null;
    }
    try {
      return Skia.RuntimeEffect.Make(liquidGlassShader);
    } catch (error) {
      console.warn('[LiquidGlassCard] Erro ao criar shader:', error);
      return null;
    }
  }, [isWeb]);

  // Shared Values para Worklets
  const time = isWeb ? null : useSharedValue(0);
  const touchX = isWeb ? null : useSharedValue(0);
  const touchY = isWeb ? null : useSharedValue(0);
  const resolutionX = isWeb ? null : useSharedValue(0);
  const resolutionY = isWeb ? null : useSharedValue(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
      if (!isWeb && resolutionX && resolutionY && touchX && touchY) {
        resolutionX.value = width;
        resolutionY.value = height;
        touchX.value = width / 2;
        touchY.value = height / 2;
      }
    }
  };

  useEffect(() => {
    if (isWeb || !time) return;
    
    if (animated) {
      time.value = withRepeat(
        withTiming(100, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      time.value = 0;
    }
  }, [isWeb, animated, time]);

  // Uniforms derived value
  const uniforms = (!isWeb && time && touchX && touchY && resolutionX && resolutionY) 
    ? useDerivedValue(() => {
        'worklet';
        return {
          resolution: [resolutionX.value, resolutionY.value],
          time: time.value,
          touch: [touchX.value, touchY.value],
        };
      })
    : null;

  // Fallback tint for Android/Web if system materials not supported
  const actualTint = Platform.OS === 'ios' ? tint : (tint.includes('dark') ? 'dark' : 'light');

  return (
    <View 
      style={[styles.container, style]}
      onLayout={handleLayout}
    >
       {/* Background para Web (Fallback) */}
       {isWeb && (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={isWeb ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : StyleSheet.absoluteFill}
        />
      )}

      {/* Camada 1: Blur Nativo (O Fundo Fosco) */}
      {/* Deve vir PRIMEIRO para borrar o que está atrás */}
      <BlurView 
        intensity={intensity} 
        tint={actualTint as any}
        style={isWeb ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : StyleSheet.absoluteFill} 
      />

      {/* Camada 2: Shader Skia (O Brilho Líquido) */}
      {/* Desenhado POR CIMA do Blur para adicionar reflexos */}
      {!isWeb && sourceShader && Canvas && Fill && Shader && uniforms && layout.width > 0 && layout.height > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={{ width: layout.width, height: layout.height }}>
            <Fill>
              <Shader source={sourceShader} uniforms={uniforms} />
            </Fill>
          </Canvas>
        </View>
      )}

      {/* Camada 3: Bordas e Overlays Sutis */}
      <View style={styles.glassOverlay} />
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
    borderRadius: 32, // Mais arredondado como no iOS
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent', // Importante: transparente para ver o blur
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)', // Overlay branco muito sutil
    zIndex: 2,
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    borderWidth: 1, // Borda fina
    borderColor: 'rgba(255,255,255,0.2)', // Borda translúcida
    zIndex: 2,
  },
  content: {
    zIndex: 3,
    flex: 1,
    position: 'relative',
    // padding removido para flexibilidade, deve ser controlado pelo pai
  }
});

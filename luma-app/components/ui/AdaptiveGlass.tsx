import React from 'react';
import {
  Platform,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GlassView,
  isLiquidGlassAvailable,
  type GlassStyle,
} from 'expo-glass-effect';

export type GlassVariant = 'regular' | 'clear' | 'subtle';

export type AdaptiveGlassProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /** Intensidade do blur no fallback (Android / iOS sem API nativa). Padrão: 60 */
  blurIntensity?: number;
  /** Tint do `BlurView` no fallback nativo */
  blurTint?: BlurTint;
  /** Variante do glass nativo no iOS 26+ (`subtle` mapeia para `clear`) */
  variant?: GlassVariant;
  /** Cor de tint sobreposta ao efeito */
  tintColor?: string;
  borderRadius?: number;
  testID?: string;
};

function fadeTintBottom(tintColor: string): string {
  const m = tintColor.match(
    /rgba\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i
  );
  if (m) {
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, 0.05)`;
  }
  return 'rgba(255,255,255,0.05)';
}

function toNativeGlassStyle(variant: GlassVariant): GlassStyle {
  if (variant === 'subtle') return 'clear';
  if (variant === 'clear') return 'clear';
  return 'regular';
}

export const AdaptiveGlass = React.forwardRef<View, AdaptiveGlassProps>(
  function AdaptiveGlass(
    {
      style,
      children,
      blurIntensity = 60,
      blurTint = 'light',
      variant = 'regular',
      tintColor = 'rgba(255,255,255,0.15)',
      borderRadius = 20,
      testID,
    },
    ref
  ) {
    const baseStyle: ViewStyle = { borderRadius, overflow: 'hidden' };
    const gradientBottom = fadeTintBottom(tintColor);

    if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
      return (
        <GlassView
          ref={ref}
          testID={testID}
          style={[baseStyle, style]}
          glassEffectStyle={{
            style: toNativeGlassStyle(variant),
            animate: true,
            animationDuration: 0.3,
          }}
          tintColor={tintColor}
        >
          {children}
        </GlassView>
      );
    }

    if (Platform.OS !== 'web') {
      return (
        <View ref={ref} style={[baseStyle, style]} testID={testID}>
          <BlurView
            intensity={blurIntensity}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          >
            <LinearGradient
              colors={[tintColor, gradientBottom]}
              style={StyleSheet.absoluteFill}
            />
            {children}
          </BlurView>
        </View>
      );
    }

    return (
      <View
        ref={ref}
        testID={testID}
        style={[
          baseStyle,
          style,
          {
            // estilos web-only (RN Web)
            backdropFilter: `blur(${blurIntensity / 3}px) saturate(180%)`,
            WebkitBackdropFilter: `blur(${blurIntensity / 3}px) saturate(180%)`,
            backgroundColor: tintColor,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          } as ViewStyle,
        ]}
      >
        {children}
      </View>
    );
  }
);

AdaptiveGlass.displayName = 'AdaptiveGlass';

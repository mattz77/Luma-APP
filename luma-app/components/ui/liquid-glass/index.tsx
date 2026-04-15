import { tva } from '@gluestack-ui/utils/nativewind-utils';
import {
  GlassContainer as ExpoGlassContainer,
  GlassView as ExpoGlassView,
  type GlassContainerProps,
  type GlassViewProps,
  isLiquidGlassAvailable,
  type GlassEffectStyleConfig,
  type GlassStyle,
} from 'expo-glass-effect';
import { styled } from 'nativewind';
import React from 'react';
import { Platform, View } from 'react-native';
import { AdaptiveGlass, type GlassVariant } from '../AdaptiveGlass';

const glassViewStyle = tva({
  base: 'overflow-hidden',
});

const glassContainerStyle = tva({
  base: 'overflow-hidden',
});

type IGlassViewProps = GlassViewProps & {
  className?: string;
};

type IGlassContainerProps = GlassContainerProps & {
  className?: string;
};

const StyledExpoGlassView = styled(ExpoGlassView, {
  className: 'style',
});

const StyledExpoGlassContainer = styled(ExpoGlassContainer, {
  className: 'style',
});

function resolveVariant(
  glassEffectStyle?: GlassStyle | GlassEffectStyleConfig
): GlassVariant {
  if (glassEffectStyle == null) return 'regular';
  const s =
    typeof glassEffectStyle === 'string'
      ? glassEffectStyle
      : glassEffectStyle.style;
  if (s === 'clear') return 'clear';
  if (s === 'none') return 'regular';
  return 'regular';
}

export const GlassView = React.forwardRef<
  React.ComponentRef<typeof ExpoGlassView>,
  IGlassViewProps
>(function GlassView({ className, ...props }, ref) {
  const useNativeIosGlass =
    Platform.OS === 'ios' && isLiquidGlassAvailable();

  if (useNativeIosGlass) {
    return (
      <StyledExpoGlassView
        ref={ref}
        {...props}
        className={glassViewStyle({ className })}
      />
    );
  }

  const variant = resolveVariant(props.glassEffectStyle);

  return (
    <AdaptiveGlass
      ref={ref as React.Ref<React.ComponentRef<typeof View>>}
      style={props.style}
      variant={variant}
      tintColor={props.tintColor ?? 'rgba(255,255,255,0.15)'}
      blurIntensity={60}
      borderRadius={20}
      testID={props.testID}
    >
      {props.children}
    </AdaptiveGlass>
  );
});

GlassView.displayName = 'GlassView';

export const GlassContainer = React.forwardRef<
  React.ComponentRef<typeof ExpoGlassContainer>,
  IGlassContainerProps
>(function GlassContainer({ className, ...props }, ref) {
  if (Platform.OS === 'web') {
    return (
      <AdaptiveGlass
        ref={ref as React.Ref<React.ComponentRef<typeof View>>}
        style={props.style}
        variant="regular"
        tintColor="rgba(255,255,255,0.08)"
        blurIntensity={50}
        borderRadius={12}
        testID={props.testID}
      >
        <View style={{ flex: 1 }}>{props.children}</View>
      </AdaptiveGlass>
    );
  }

  const useNativeIosGlass =
    Platform.OS === 'ios' && isLiquidGlassAvailable();

  if (useNativeIosGlass) {
    return (
      <StyledExpoGlassContainer
        ref={ref}
        {...props}
        className={glassContainerStyle({ className })}
      />
    );
  }

  return (
    <View ref={ref} {...props} className={glassContainerStyle({ className })} />
  );
});

GlassContainer.displayName = 'GlassContainer';

export { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
export type {
  GlassColorScheme,
  GlassContainerProps,
  GlassStyle,
  GlassViewProps,
} from 'expo-glass-effect';

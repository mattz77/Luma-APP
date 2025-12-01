import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { hstackStyle } from './styles';

type IHStackProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'style'> &
  VariantProps<typeof hstackStyle> & {
    style?: ViewStyle | ViewStyle[];
  };

const HStack = React.forwardRef<React.ComponentRef<'div'>, IHStackProps>(
  function HStack({ className, space, reversed, style, ...props }, ref) {
    // Flatten style array to object for web
    const flattenedStyle = style 
      ? (Array.isArray(style) ? StyleSheet.flatten(style) : style)
      : undefined;
    
    // Convert React Native style to CSS-compatible object
    const cssStyle = flattenedStyle ? (() => {
      const { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation, ...rest } = flattenedStyle as any;
      return rest;
    })() : undefined;

    return (
      <div
        className={hstackStyle({
          space,
          reversed: reversed as boolean,
          class: className,
        })}
        style={cssStyle as React.CSSProperties}
        {...props}
        ref={ref}
      />
    );
  }
);

HStack.displayName = 'HStack';

export { HStack };

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

import { vstackStyle } from './styles';

type IVStackProps = Omit<React.ComponentProps<'div'>, 'style'> &
  VariantProps<typeof vstackStyle> & {
    style?: ViewStyle | ViewStyle[];
  };

const VStack = React.forwardRef<React.ComponentRef<'div'>, IVStackProps>(
  function VStack({ className, space, reversed, style, ...props }, ref) {
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
        className={vstackStyle({
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

VStack.displayName = 'VStack';

export { VStack };

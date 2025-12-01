import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { boxStyle } from './styles';

import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

type IBoxProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'style'> &
  VariantProps<typeof boxStyle> & { 
    className?: string;
    style?: ViewStyle | ViewStyle[];
  };

const Box = React.forwardRef<HTMLDivElement, IBoxProps>(function Box(
  { className, style, ...props },
  ref
) {
  // Flatten style array to object for web
  const flattenedStyle = style 
    ? (Array.isArray(style) ? StyleSheet.flatten(style) : style)
    : undefined;
  
  // Convert React Native style to CSS-compatible object
  // Remove React Native specific properties that don't work on web
  const cssStyle = flattenedStyle ? (() => {
    const { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation, ...rest } = flattenedStyle as any;
    return rest;
  })() : undefined;

  return (
    <div 
      ref={ref} 
      className={boxStyle({ class: className })} 
      style={cssStyle as React.CSSProperties}
      {...props} 
    />
  );
});

Box.displayName = 'Box';
export { Box };

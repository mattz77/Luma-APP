import React from 'react';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { normalizeStyleForDomWeb } from '@/lib/normalizeStyleForDomWeb';
import { hstackStyle } from './styles';

type IHStackProps = React.ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof hstackStyle>;

const HStack = React.forwardRef<React.ComponentRef<'div'>, IHStackProps>(
  function HStack({ className, space, reversed, style, ...props }, ref) {
    const normalizedStyle = normalizeStyleForDomWeb(style);
    return (
      <div
        className={hstackStyle({
          space,
          reversed: reversed as boolean,
          class: className,
        })}
        style={normalizedStyle}
        {...props}
        ref={ref}
      />
    );
  }
);

HStack.displayName = 'HStack';

export { HStack };

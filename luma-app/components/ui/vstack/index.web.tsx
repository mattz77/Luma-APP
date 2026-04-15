import React from 'react';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { normalizeStyleForDomWeb } from '@/lib/normalizeStyleForDomWeb';

import { vstackStyle } from './styles';

type IVStackProps = React.ComponentProps<'div'> &
  VariantProps<typeof vstackStyle>;

const VStack = React.forwardRef<React.ComponentRef<'div'>, IVStackProps>(
  function VStack({ className, space, reversed, style, ...props }, ref) {
    const normalizedStyle = normalizeStyleForDomWeb(style);
    return (
      <div
        className={vstackStyle({
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

VStack.displayName = 'VStack';

export { VStack };

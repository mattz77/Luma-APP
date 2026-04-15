import React from 'react';
import { normalizeStyleForDomWeb } from '@/lib/normalizeStyleForDomWeb';
import { boxStyle } from './styles';

import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

type IBoxProps = React.ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof boxStyle> & { className?: string };

const Box = React.forwardRef<HTMLDivElement, IBoxProps>(function Box(
  { className, style, ...props },
  ref
) {
  const normalizedStyle = normalizeStyleForDomWeb(style);
  return (
    <div
      ref={ref}
      className={boxStyle({ class: className })}
      style={normalizedStyle}
      {...props}
    />
  );
});

Box.displayName = 'Box';
export { Box };

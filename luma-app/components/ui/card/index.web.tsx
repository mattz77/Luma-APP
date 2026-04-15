import React from 'react';
import { normalizeStyleForDomWeb } from '@/lib/normalizeStyleForDomWeb';
import { cardStyle } from './styles';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

type ICardProps = React.ComponentPropsWithoutRef<'div'> & 
  VariantProps<typeof cardStyle> & { 
    className?: string;
    size?: 'default' | 'sm';
  };

const Card = React.forwardRef<HTMLDivElement, ICardProps>(function Card(
  { className, size = 'default', style, ...props },
  ref
) {
  const normalizedStyle = normalizeStyleForDomWeb(style);
  return (
    <div
      className={cardStyle({ size, class: className })}
      style={normalizedStyle}
      {...props}
      ref={ref}
    />
  );
});

Card.displayName = 'Card';

export { Card };

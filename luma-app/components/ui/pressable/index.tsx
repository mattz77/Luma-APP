'use client';
import React from 'react';
import { createPressable } from '@gluestack-ui/core/pressable/creator';
import {
  Platform,
  Pressable as RNPressable,
  type PressableProps,
} from 'react-native';

import { normalizeStyleForDomWeb } from '@/lib/normalizeStyleForDomWeb';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

const UIPressable = createPressable({
  Root: withStyleContext(RNPressable),
});

const pressableStyle = tva({
  base: 'data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-indicator-info data-[focus-visible=true]:ring-2 data-[disabled=true]:opacity-40',
});

type IPressableProps = Omit<
  React.ComponentProps<typeof UIPressable>,
  'context'
> &
  VariantProps<typeof pressableStyle> &
  Partial<Pick<PressableProps, 'delayPressIn' | 'delayPressOut'>>;
const Pressable = React.forwardRef<
  React.ComponentRef<typeof UIPressable>,
  IPressableProps
>(function Pressable({ className, style, ...props }, ref) {
  const resolvedStyle =
    Platform.OS === 'web' ? normalizeStyleForDomWeb(style) : style;
  return (
    <UIPressable
      {...props}
      style={resolvedStyle}
      ref={ref}
      className={pressableStyle({
        class: className,
      })}
    />
  );
});

Pressable.displayName = 'Pressable';
export { Pressable };

import React, { forwardRef } from 'react';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { View, type DimensionValue, type ViewStyle } from 'react-native';
import { skeletonStyle, skeletonTextStyle } from './styles';

type ISkeletonProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonStyle> & {
    className?: string;
    isLoaded?: boolean;
    startColor?: string;
    speed?: number | string;
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
  };

type ISkeletonTextProps = React.ComponentProps<typeof View> &
  VariantProps<typeof skeletonTextStyle> & {
    className?: string;
    _lines?: number;
    isLoaded?: boolean;
    startColor?: string;
  };

const Skeleton = forwardRef<React.ComponentRef<typeof View>, ISkeletonProps>(
  function Skeleton(
    {
      className,
      variant,
      children,
      startColor = 'bg-accent',
      isLoaded = false,
      speed = 4,
      width,
      height,
      borderRadius,
      style,
      ...props
    },
    ref
  ) {
    const dimStyle: ViewStyle | undefined =
      width !== undefined || height !== undefined || borderRadius !== undefined
        ? { width, height, borderRadius }
        : undefined;
    if (!isLoaded) {
      return (
        <View
          className={`animate-pulse ${startColor} ${skeletonStyle({
            variant,
            speed: speed as 1 | 2 | 3 | 4,
            class: className,
          })}`}
          {...props}
          style={[dimStyle, style]}
          ref={ref}
        />
      );
    } else {
      return children;
    }
  }
);

const SkeletonText = forwardRef<
  React.ComponentRef<typeof View>,
  ISkeletonTextProps
>(function SkeletonText(
  {
    className,
    _lines,
    isLoaded = false,
    startColor = 'bg-accent',
    gap = 2,
    children,
    ...props
  },
  ref
) {
  if (!isLoaded) {
    if (_lines) {
      return (
        <View
          className={`flex flex-col ${skeletonTextStyle({
            gap,
          })}`}
          ref={ref}
        >
          {Array.from({ length: _lines }).map((_, index) => (
            <Skeleton
              key={index}
              className={`${startColor} ${skeletonTextStyle({
                class: className,
              })}`}
              {...props}
            />
          ))}
        </View>
      );
    } else {
      return (
        <Skeleton
          className={`${startColor} ${skeletonTextStyle({
            class: className,
          })}`}
          {...props}
          ref={ref}
        />
      );
    }
  } else {
    return children;
  }
});

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';

export { Skeleton, SkeletonText };

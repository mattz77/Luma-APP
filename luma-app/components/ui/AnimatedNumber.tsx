import React, { useCallback, useEffect, useState } from 'react';
import { Text, TextStyle, TextProps, StyleProp } from 'react-native';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface AnimatedNumberProps extends TextProps {
  value: number;
  formatter?: (value: number) => string;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Anima o número no worklet; a formatação (ex.: `Intl`) roda **só na thread JS**
 * via `runOnJS`. Chamar `formatter` dentro do worklet quebra no iOS (Intl/APIs não suportadas na UI thread).
 */
export function AnimatedNumber({
  value,
  formatter = (v) => v.toFixed(0),
  duration = 1000,
  style,
  ...props
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(() => formatter(0));

  const pushFormattedToReact = useCallback(
    (v: number) => {
      setDisplayValue(formatter(v));
    },
    [formatter],
  );

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.exp),
    });
  }, [value, duration]);

  useDerivedValue(() => {
    runOnJS(pushFormattedToReact)(animatedValue.value);
  }, [pushFormattedToReact]);

  return (
    <Text style={style} {...props}>
      {displayValue}
    </Text>
  );
}

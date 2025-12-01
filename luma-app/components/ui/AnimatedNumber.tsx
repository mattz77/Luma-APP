import React, { useEffect, useState } from 'react';
import { Text, TextStyle, TextProps, StyleProp } from 'react-native';
import Animated, {
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

export function AnimatedNumber({
    value,
    formatter = (v) => v.toFixed(0),
    duration = 1000,
    style,
    ...props
}: AnimatedNumberProps) {
    const animatedValue = useSharedValue(0);
    const [displayValue, setDisplayValue] = useState(formatter(0));

    useEffect(() => {
        animatedValue.value = withTiming(value, {
            duration,
            easing: Easing.out(Easing.exp),
        });
    }, [value, duration]);

    useDerivedValue(() => {
        const formatted = formatter(animatedValue.value);
        runOnJS(setDisplayValue)(formatted);
    });

    return (
        <Text style={style} {...props}>
            {displayValue}
        </Text>
    );
}

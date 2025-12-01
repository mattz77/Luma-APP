import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}: SkeletonProps) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                animatedStyle,
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E4E8',
    },
});

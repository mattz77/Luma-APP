import { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { authFontFamilies, authTheme } from '@/lib/auth/authTheme';

const LOGO = require('@/assets/images/luma-icon.png');

type AuthHeaderProps = {
  brandName: string;
  tagline: string;
};

export function AuthHeader({ brandName, tagline }: AuthHeaderProps) {
  const rotation = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, [reduceMotion, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.header}>
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.ringLayer, ringStyle]}>
          <Svg width={144} height={144}>
            <Defs>
              <SvgLinearGradient id="authRingGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#D4AF37" />
                <Stop offset="0.35" stopColor="#1B3A5C" />
                <Stop offset="0.65" stopColor="#4A2060" />
                <Stop offset="1" stopColor="#E8C84A" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={72}
              cy={72}
              r={68}
              stroke="url(#authRingGrad)"
              strokeWidth={4}
              fill="none"
              opacity={0.55}
            />
          </Svg>
        </Animated.View>
        <Image
          source={LOGO}
          accessibilityIgnoresInvertColors
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.brandName} accessibilityRole="header">
        {brandName}
      </Text>
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 28,
  },
  iconWrap: {
    width: 144,
    height: 144,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: authTheme.bgDeep,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  brandName: {
    fontFamily: authFontFamilies.display,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: authTheme.textPrimary,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: authFontFamilies.sans,
    fontSize: 14,
    fontWeight: '400',
    color: authTheme.textSecondary,
    letterSpacing: 0.1,
  },
});

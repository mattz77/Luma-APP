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

/** Baseline do layout original (144) — usado para escalar o anel SVG. */
const ICON_BASE = 144;
const ICON_WRAP = 200;
const LOGO_SIZE = ICON_WRAP - 16;
const RING_CENTER = ICON_WRAP / 2;
const RING_R = (68 * ICON_WRAP) / ICON_BASE;
const RING_STROKE = (4 * ICON_WRAP) / ICON_BASE;

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
          <Svg width={ICON_WRAP} height={ICON_WRAP}>
            <Defs>
              <SvgLinearGradient id="authRingGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#D4AF37" />
                <Stop offset="0.35" stopColor="#1B3A5C" />
                <Stop offset="0.65" stopColor="#4A2060" />
                <Stop offset="1" stopColor="#E8C84A" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_R}
              stroke="url(#authRingGrad)"
              strokeWidth={RING_STROKE}
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
    width: ICON_WRAP,
    height: ICON_WRAP,
    marginBottom: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
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

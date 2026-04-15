import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AdaptiveGlass } from '../ui/AdaptiveGlass';
import { Colors } from '@/constants/Colors';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Legado — não usado; mantido para compatibilidade */
  delay?: number;
  intensity?: number;
  variant?: 'default' | 'primary';
  borderRadius?: number;
}

function cardShadowStyle(): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  };
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 20,
  variant = 'default',
  borderRadius = 24,
}) => {
  const isPrimary = variant === 'primary';
  const tintColor = isPrimary
    ? 'rgba(255, 245, 220, 0.35)'
    : 'rgba(255,255,255,0.55)';

  return (
    <View
      style={[
        styles.outer,
        { borderRadius },
        isPrimary && styles.outerPrimary,
        cardShadowStyle(),
        style,
      ]}
    >
      <AdaptiveGlass
        style={StyleSheet.absoluteFill}
        borderRadius={borderRadius}
        blurIntensity={intensity}
        blurTint="light"
        variant="regular"
        tintColor={tintColor}
      >
        <View style={styles.blurPlaceholder} />
      </AdaptiveGlass>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFF',
  },
  outerPrimary: {
    borderColor: Colors.accent,
  },
  content: {
    zIndex: 2,
    flex: 1,
  },
  blurPlaceholder: {
    flex: 1,
  },
});

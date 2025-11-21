import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  delay = 0,
  intensity = 30 
}) => (
  <View style={[styles.glassCard, style]}>
    <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
    <LinearGradient
      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
      style={StyleSheet.absoluteFill}
    />
    <View style={{ zIndex: 10, flex: 1 }}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  glassCard: { 
    borderRadius: 24, 
    padding: 20, 
    overflow: 'hidden', 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderWidth: 1, 
    backgroundColor: 'rgba(255,255,255,0.05)' 
  },
});


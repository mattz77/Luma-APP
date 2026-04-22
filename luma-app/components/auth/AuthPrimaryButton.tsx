import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { authFontFamilies, authTheme } from '@/lib/auth/authTheme';

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function AuthPrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  testID,
}: AuthPrimaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      disabled={inactive}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
    >
      <LinearGradient
        colors={[...authTheme.primaryGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.inner}>
          {loading ? (
            <ActivityIndicator color={authTheme.primaryButtonText} size="small" />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: authTheme.radiusMd,
    overflow: 'hidden',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.75,
  },
  gradient: {
    minHeight: 52,
    justifyContent: 'center',
  },
  inner: {
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: authFontFamilies.sansSemiBold,
    fontSize: 15,
    letterSpacing: 0.5,
    color: authTheme.primaryButtonText,
  },
});

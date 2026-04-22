import { StyleSheet, Text, View } from 'react-native';

import { authFontFamilies, authTheme } from '@/lib/auth/authTheme';

type AuthDividerProps = {
  label: string;
};

export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: authTheme.border,
  },
  text: {
    fontFamily: authFontFamilies.sans,
    fontSize: 12,
    color: authTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

/**
 * Luma DS v2 — primitivas de tela.
 * Todas as seções constroem com estas peças; nada de estilos paralelos.
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { light, dark, radius, space, type as typo, shadow, type ThemeColors } from '@/constants/theme';

export function useLumaTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

/* ---------- Tipografia ---------- */
type TxProps = {
  children: React.ReactNode;
  variant?: keyof typeof typo;
  color?: 'ink' | 'soft' | 'faint' | 'onAccent' | 'good' | 'danger';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function Tx({ children, variant = 'body', color = 'ink', style, numberOfLines }: TxProps) {
  const t = useLumaTheme();
  const colorMap = {
    ink: t.ink,
    soft: t.inkSoft,
    faint: t.inkFaint,
    onAccent: t.onAccent,
    good: t.good,
    danger: t.danger,
  } as const;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[typo[variant] as object, { color: colorMap[color] }, style as object]}
    >
      {children}
    </Text>
  );
}

/* ---------- Cabeçalho de seção ---------- */
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Tx variant="heading">{title}</Tx>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Tx variant="caption" color="soft">{action}</Tx>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Cartão ---------- */
export function LumaCard({ children, style, sunken }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; sunken?: boolean }) {
  const t = useLumaTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: sunken ? t.surfaceSunken : t.surface, borderColor: t.line },
        !sunken && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ---------- Linha de lista ---------- */
export function LumaRow({
  left,
  title,
  subtitle,
  right,
  onPress,
  last,
  testID,
}: {
  left?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  testID?: string;
}) {
  const t = useLumaTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: t.line, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        pressed && { backgroundColor: t.surfaceSunken },
      ]}
    >
      {left ? <View style={styles.rowLeft}>{left}</View> : null}
      <View style={styles.rowBody}>
        <Tx variant="bodyMedium" numberOfLines={1}>{title}</Tx>
        {subtitle ? (
          <Tx variant="caption" color="soft" numberOfLines={1}>{subtitle}</Tx>
        ) : null}
      </View>
      {right ? <View style={styles.rowRight}>{right}</View> : null}
    </Pressable>
  );
}

/* ---------- Botões ---------- */
export function LumaButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'quiet' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useLumaTheme();
  const bg = variant === 'primary' ? t.accent : variant === 'danger' ? t.dangerSoft : t.surfaceSunken;
  const fg = variant === 'primary' ? t.onAccent : variant === 'danger' ? t.danger : t.ink;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variant === 'primary' && pressed ? t.accentPressed : bg, opacity: disabled ? 0.5 : 1 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[typo.bodyMedium as object, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------- Chip ---------- */
export function LumaChip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const t = useLumaTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? t.ink : t.surfaceSunken,
          borderColor: active ? t.ink : t.line,
        },
      ]}
    >
      <Text style={[typo.caption as object, { color: active ? t.paper : t.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Estado vazio ---------- */
export function LumaEmpty({ icon, title, body, cta }: { icon?: React.ReactNode; title: string; body?: string; cta?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      {icon}
      <Tx variant="heading" style={{ marginTop: space.md, textAlign: 'center' }}>{title}</Tx>
      {body ? (
        <Tx variant="body" color="soft" style={{ marginTop: space.xs, textAlign: 'center', maxWidth: 280 }}>
          {body}
        </Tx>
      ) : null}
      {cta ? <View style={{ marginTop: space.lg }}>{cta}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: space.section,
    marginBottom: space.md,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    gap: space.md,
  },
  rowLeft: { width: 36, alignItems: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowRight: { alignItems: 'flex-end' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 50,
    borderRadius: radius.control,
    paddingHorizontal: space.xl,
  },
  chip: {
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space.section,
    paddingHorizontal: space.xl,
  },
});

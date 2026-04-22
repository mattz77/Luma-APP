import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@/components/ui/box';
import { authTheme } from '@/lib/auth/authTheme';

type AuthBackgroundProps = {
  children: React.ReactNode;
};

/**
 * Fundo de auth: apenas gradiente linear escuro — sem orbs nem partículas (evita “bolhas” no fundo).
 * Raiz em Gluestack `Box` para web/native alinhados ao design system.
 */
export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <Box className="flex-1" style={styles.root}>
      <LinearGradient
        colors={[
          'rgba(212, 175, 55, 0.04)',
          authTheme.bgDeep,
          '#0A0C12',
        ]}
        locations={[0, 0.22, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </Box>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: authTheme.bgDeep,
  },
});

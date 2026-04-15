# Liquid Glass — Abordagem Cross-Platform (Expo SDK 54)

> Implementação do efeito Liquid Glass com fallback adaptativo para iOS < 26, Android e Web.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Estratégia de Fallback](#estratégia-de-fallback)
- [Implementação](#implementação)
  - [AdaptiveGlass — Componente Principal](#adaptiveglass--componente-principal)
  - [Uso Básico](#uso-básico)
  - [Variantes de Intensidade](#variantes-de-intensidade)
  - [Composição com outros componentes](#composição-com-outros-componentes)
- [Animações](#animações)
- [Tipagem completa (TypeScript)](#tipagem-completa-typescript)
- [Armadilhas e Anti-patterns](#armadilhas-e-anti-patterns)
- [Referência de Props](#referência-de-props)

---

## Visão Geral

A **Abordagem 3** cobre todos os cenários de plataforma com uma única API de componente:

| Plataforma | Estratégia | Biblioteca |
|---|---|---|
| iOS 26+ | `UIVisualEffectView` nativo real | `expo-glass-effect` |
| iOS < 26 | `BlurView` + gradiente simulado | `expo-blur` + `expo-linear-gradient` |
| Android | `BlurView` + gradiente simulado | `expo-blur` + `expo-linear-gradient` |
| Web | `backdrop-filter` CSS nativo | Inline style (web-only) |

---

## Pré-requisitos

- Expo SDK **54+**
- React Native **0.81+**
- New Architecture habilitada (obrigatório — Legacy Architecture foi congelada no RN 0.80)

```json
// app.json
{
  "expo": {
    "newArchEnabled": true
  }
}
```

---

## Instalação

```bash
# Instala todas as dependências necessárias
npx expo install expo-glass-effect expo-blur expo-linear-gradient
```

> **Nota:** `npx expo install` (não `npm install`) garante versões compatíveis com o SDK atual.

---

## Estratégia de Fallback

```
isLiquidGlassAvailable() && iOS?
  ├── true  → GlassView nativo (UIVisualEffectView)
  └── false
        ├── iOS / Android → BlurView + LinearGradient
        └── Web           → backdrop-filter CSS
```

A detecção em runtime via `isLiquidGlassAvailable()` é necessária porque algumas versões beta do iOS 26 não possuem a API disponível, o que pode causar crashes.

---

## Implementação

### AdaptiveGlass — Componente Principal

```tsx
// components/AdaptiveGlass.tsx
import { Platform, View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

export type GlassVariant = 'regular' | 'clear' | 'subtle';

export interface AdaptiveGlassProps {
  style?: ViewStyle;
  children: React.ReactNode;
  /** Intensidade do blur no fallback (Android/iOS antigo). Padrão: 60 */
  blurIntensity?: number;
  /** Variante do glass effect nativo no iOS 26+. Padrão: 'regular' */
  variant?: GlassVariant;
  /** Cor de tint sobreposta ao efeito. Padrão: 'rgba(255,255,255,0.15)' */
  tintColor?: string;
  /** Border radius. Padrão: 20 */
  borderRadius?: number;
}

export function AdaptiveGlass({
  style,
  children,
  blurIntensity = 60,
  variant = 'regular',
  tintColor = 'rgba(255,255,255,0.15)',
  borderRadius = 20,
}: AdaptiveGlassProps) {
  const baseStyle: ViewStyle = { borderRadius, overflow: 'hidden' };

  // ── iOS 26+ com Liquid Glass nativo ──────────────────────────────────────
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView
        style={[baseStyle, style]}
        glassEffectStyle={{
          style: variant,
          animate: true,
          animationDuration: 0.3,
        }}
        tintColor={tintColor}
      >
        {children}
      </GlassView>
    );
  }

  // ── iOS < 26 e Android: BlurView + gradiente ──────────────────────────────
  if (Platform.OS !== 'web') {
    return (
      <BlurView
        intensity={blurIntensity}
        tint="light"
        style={[baseStyle, style]}
      >
        <LinearGradient
          colors={[
            tintColor,
            tintColor.replace(/[\d.]+\)$/, '0.05)'), // reduz opacidade no gradiente
          ]}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </BlurView>
    );
  }

  // ── Web: backdrop-filter CSS ───────────────────────────────────────────────
  return (
    <View
      style={[
        baseStyle,
        style,
        // @ts-ignore — propriedades CSS web-only
        {
          backdropFilter: `blur(${blurIntensity / 3}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurIntensity / 3}px) saturate(180%)`,
          backgroundColor: tintColor,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.3)',
        },
      ]}
    >
      {children}
    </View>
  );
}
```

---

### Uso Básico

```tsx
// screens/HomeScreen.tsx
import { View, Text, Image, StyleSheet } from 'react-native';
import { AdaptiveGlass } from '@/components/AdaptiveGlass';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Imagem de fundo — necessária para o efeito ser visível */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <AdaptiveGlass style={styles.card}>
        <Text style={styles.title}>Título do Card</Text>
        <Text style={styles.body}>Conteúdo com efeito glass adaptativo.</Text>
      </AdaptiveGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 24,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
});
```

---

### Variantes de Intensidade

```tsx
// Sutil — ideal para overlays sobre conteúdo denso
<AdaptiveGlass variant="clear" blurIntensity={30} borderRadius={12}>
  <Text>Overlay sutil</Text>
</AdaptiveGlass>

// Regular — uso geral (padrão)
<AdaptiveGlass variant="regular" blurIntensity={60}>
  <Text>Card padrão</Text>
</AdaptiveGlass>

// Intenso — destaques e modais
<AdaptiveGlass
  variant="regular"
  blurIntensity={90}
  tintColor="rgba(59, 130, 246, 0.2)" // tint azul
>
  <Text>Destaque</Text>
</AdaptiveGlass>
```

---

### Composição com outros componentes

```tsx
// Navbar flutuante com glass
function FloatingNavbar() {
  return (
    <AdaptiveGlass
      style={{
        position: 'absolute',
        bottom: 32,
        left: 24,
        right: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}
      borderRadius: 40,   // pill shape
    >
      <NavItem icon="home" label="Início" active />
      <NavItem icon="search" label="Buscar" />
      <NavItem icon="person" label="Perfil" />
    </AdaptiveGlass>
  );
}

// Modal com glass
function GlassModal({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <AdaptiveGlass blurIntensity={80} style={{ padding: 24 }}>
          {children}
        </AdaptiveGlass>
      </View>
    </Modal>
  );
}
```

---

## Animações

> ⚠️ **Armadilha crítica:** No iOS 26+, nunca use `opacity` para animar entrada/saída do `GlassView`. O efeito nativo deixa de renderizar quando `opacity` chega a 0 em qualquer View pai.

Use as props nativas `animate` e `animationDuration` para iOS 26+, e `Animated` com `useNativeDriver` para o fallback:

```tsx
// hooks/useGlassAnimation.ts
import { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

export function useGlassAnimation(visible: boolean) {
  const isNativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    // No iOS 26+ nativo, a animação é controlada pelo glassEffectStyle
    // No fallback, animamos normalmente com Animated
    if (!isNativeGlass) {
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return { opacity, isNativeGlass };
}
```

```tsx
// Componente animado
function AnimatedGlassCard({ visible }: { visible: boolean }) {
  const { opacity, isNativeGlass } = useGlassAnimation(visible);

  if (isNativeGlass) {
    // iOS 26+: animação nativa via prop
    return (
      <GlassView
        glassEffectStyle={{
          style: visible ? 'regular' : 'none',
          animate: true,
          animationDuration: 0.3,
        }}
      >
        <Text>Conteúdo</Text>
      </GlassView>
    );
  }

  // Fallback: Animated.View com opacity
  return (
    <Animated.View style={{ opacity }}>
      <AdaptiveGlass>
        <Text>Conteúdo</Text>
      </AdaptiveGlass>
    </Animated.View>
  );
}
```

---

## Tipagem completa (TypeScript)

```ts
// types/glass.ts
export type GlassVariant = 'regular' | 'clear' | 'subtle';

export type BlurTint =
  | 'light'
  | 'dark'
  | 'default'
  | 'extraLight'
  | 'prominent'
  | 'systemUltraThinMaterial'
  | 'systemThinMaterial'
  | 'systemMaterial'
  | 'systemThickMaterial'
  | 'systemChromeMaterial';

export interface AdaptiveGlassProps {
  style?: import('react-native').ViewStyle;
  children: React.ReactNode;
  blurIntensity?: number;
  blurTint?: BlurTint;
  variant?: GlassVariant;
  tintColor?: string;
  borderRadius?: number;
  testID?: string;
}
```

---

## Armadilhas e Anti-patterns

### ❌ `opacity` em pais do GlassView

```tsx
// ❌ ERRADO — opacity: 0 em qualquer View pai quebra o efeito no iOS 26+
<Animated.View style={{ opacity: fadeAnim }}>
  <GlassView>...</GlassView>
</Animated.View>

// ✅ CORRETO — use as props nativas do GlassView
<GlassView
  glassEffectStyle={{
    style: visible ? 'regular' : 'none',
    animate: true,
    animationDuration: 0.3,
  }}
>
  ...
</GlassView>
```

### ❌ Usar o efeito sem fundo visível

```tsx
// ❌ O efeito glass é invisível sem conteúdo atrás
<View style={{ backgroundColor: '#fff' }}>
  <AdaptiveGlass>...</AdaptiveGlass>
</View>

// ✅ O efeito exige conteúdo visual atrás (imagem, gradiente, etc.)
<ImageBackground source={...}>
  <AdaptiveGlass>...</AdaptiveGlass>
</ImageBackground>
```

### ❌ `overflow: 'visible'` quebrando border radius

```tsx
// ❌ Conteúdo vaza para fora do borderRadius
<AdaptiveGlass style={{ overflow: 'visible' }}>
  <Image ... />
</AdaptiveGlass>

// ✅ Padrão já define overflow: 'hidden' internamente
<AdaptiveGlass>
  <Image ... />
</AdaptiveGlass>
```

### ❌ BlurView sem contexto de cor no Android

```tsx
// ❌ No Android, BlurView com tint="light" em fundo escuro fica estranho
<AdaptiveGlass tintColor="rgba(255,255,255,0.15)">...</AdaptiveGlass>

// ✅ Ajuste tintColor conforme o tema
const tint = colorScheme === 'dark'
  ? 'rgba(0,0,0,0.3)'
  : 'rgba(255,255,255,0.2)';

<AdaptiveGlass tintColor={tint}>...</AdaptiveGlass>
```

---

## Referência de Props

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `children` | `ReactNode` | — | Conteúdo interno do componente |
| `style` | `ViewStyle` | `undefined` | Estilos adicionais aplicados ao container |
| `blurIntensity` | `number` | `60` | Intensidade do blur no fallback (0–100) |
| `blurTint` | `BlurTint` | `'light'` | Tint do BlurView no fallback |
| `variant` | `GlassVariant` | `'regular'` | Variante nativa no iOS 26+ |
| `tintColor` | `string` | `'rgba(255,255,255,0.15)'` | Cor de sobreposição em todas as plataformas |
| `borderRadius` | `number` | `20` | Border radius do container |
| `testID` | `string` | `undefined` | ID para testes automatizados |

---

## Versões

| Pacote | Versão mínima |
|---|---|
| `expo` | `~54.0.0` |
| `react-native` | `0.81.x` |
| `expo-glass-effect` | `~1.0.0` |
| `expo-blur` | `~14.0.0` |
| `expo-linear-gradient` | `~14.0.0` |

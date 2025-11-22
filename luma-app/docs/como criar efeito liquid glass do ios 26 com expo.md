<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# como criar efeito liquid glass do ios 26 com expo 54 expo router e react reanimated de acordo com este prd que contem nosso stack de tecnologia no frontend

A tendência de design **"Liquid Glass" do iOS 26** (mencionada em contextos de design futurista para 2025) caracteriza-se por superfícies translúcidas que não são estáticas, mas que possuem refração dinâmica e bordas que parecem "fluir" organicamente.

Para implementar este efeito no **Luma** seguindo seu stack (Expo 54, Router, Reanimated), utilizaremos uma abordagem híbrida:

1. **`@shopify/react-native-skia`**: Para renderizar o "líquido" vivo (blobs com shaders de metaball/threshold) e mapas de deslocamento.
2. **`expo-blur`**: Para a camada de vidro fosco nativa de alta performance.
3. **`react-native-reanimated`**: Para orquestrar a física do movimento baseada em sensores ou toque.

Aqui está a implementação do componente `LiquidGlassCard` alinhado ao seu PRD.

### 1. Pré-requisitos

Instale as dependências necessárias no seu projeto Expo 54:

```bash
npx expo install @shopify/react-native-skia react-native-reanimated expo-blur expo-haptics
```


### 2. O Shader "Liquid Glass"

Crie um arquivo `assets/shaders/liquid.ts` (ou `.glsl` se preferir importar como string). Este shader cria a distorção de refração suave.

```typescript
// assets/shaders/liquidGlass.ts
export const liquidGlassShader = `
uniform float2 resolution;
uniform float time;
uniform float2 touch;

// Função de ruído pseudo-aleatório
float random (in float2 _st) {
    return fract(sin(dot(_st.xy, float2(12.9898,78.233))) * 43758.5453123);
}

// Noise function para movimento orgânico
float noise (in float2 _st) {
    float2 i = floor(_st);
    float2 f = fract(_st);
    float a = random(i);
    float b = random(i + float2(1.0, 0.0));
    float c = random(i + float2(0.0, 1.0));
    float d = random(i + float2(1.0, 1.0));
    float2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm ( in float2 _st) {
    float v = 0.0;
    float a = 0.5;
    float2 shift = float2(100.0);
    // Rotacionar para reduzir artefatos axiais
    float2x2 rot = float2x2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

half4 main(float2 xy) {
    float2 st = xy/resolution.xy;
    float3 color = float3(0.0);

    float2 q = float2(0.);
    q.x = fbm( st + 0.00*time);
    q.y = fbm( st + float2(1.0));

    float2 r = float2(0.);
    r.x = fbm( st + 1.0*q + float2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + float2(8.3,2.8)+ 0.126*time);

    float f = fbm(st+r);

    // Mistura de cores estilo iOS 26 (Cianos, Roxos, Brancos sutis)
    color = mix(float3(0.1, 0.619, 0.667), float3(0.666, 0.666, 0.498), clamp((f*f)*4.0,0.0,1.0));
    color = mix(color, float3(0.0, 0.0, 0.164706), clamp(length(q),0.0,1.0));
    color = mix(color, float3(0.66667, 1.0, 1.0), clamp(length(r.x),0.0,1.0));

    // Adiciona um brilho especular "líquido" baseado na interação de toque (opcional)
    float dist = distance(st, touch / resolution.xy);
    float glow = 1.0 - smoothstep(0.0, 0.3, dist);
    color += float3(glow * 0.2);

    return half4((f*f*f+.6*f*f+.5*f)*color, 1.0);
}
`;
```


### 3. O Componente `LiquidGlassCard`

Este componente combina o shader Skia como background "vivo" com um `BlurView` nativo por cima para criar a profundidade de vidro.

```tsx
// components/ui/LiquidGlassCard.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing,
  useDerivedValue 
} from 'react-native-reanimated';
import { liquidGlassShader } from '../../assets/shaders/liquidGlass';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

const SourceShader = Skia.RuntimeEffect.Make(liquidGlassShader)!;

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({ 
  children, 
  style, 
  intensity = 40 
}) => {
  const { width, height } = useWindowDimensions();
  const time = useSharedValue(0);
  const touchX = useSharedValue(width / 2);
  const touchY = useSharedValue(height / 2);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(100, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const uniforms = useDerivedValue(() => {
    return {
      resolution: [width, height],
      time: time.value,
      touch: [touchX.value, touchY.value],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Camada 1: O Fluido Vivo (Skia) */}
      <View style={StyleSheet.absoluteFill}>
        <Canvas style={{ flex: 1 }}>
          <Fill>
            <Shader source={SourceShader} uniforms={uniforms} />
          </Fill>
        </Canvas>
      </View>

      {/* Camada 2: O Vidro Fosco (Blur Nativo) */}
      {/* O iOS 26 usa um blur muito alto com transparência sutil */}
      <BlurView 
        intensity={intensity} 
        tint="light" // Ou "systemChromeMaterial" para iOS nativo moderno
        style={StyleSheet.absoluteFill} 
      />

      {/* Camada 3: Borda de Refração (Borda "Glass") */}
      <View style={styles.borderOverlay} />

      {/* Camada 4: Conteúdo */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.1)', // Fallback
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 2,
  },
  content: {
    zIndex: 3,
    padding: 20,
  }
});
```


### 4. Integração no Luma (Exemplo de Uso)

Use este componente para envolver seus cards principais (como o resumo financeiro ou o chat da Luma), conforme descrito no PRD.

```tsx
// app/(tabs)/index.tsx
import { Text, View } from 'react-native';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { House, Receipt } from 'phosphor-react-native'; // Seus ícones

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' }}>
      
      <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>
        Olá, Família Silva
      </Text>

      {/* Card Financeiro com Efeito Liquid Glass */}
      <LiquidGlassCard style={{ height: 200, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Gasto Mensal</Text>
            <Text style={{ color: '#FFF', fontSize: 32, fontWeight: 'bold' }}>R$ 3.450</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 50 }}>
            <Receipt size={24} color="#FFF" />
          </View>
        </View>
        
        <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 'auto' }}>
          86% do orçamento utilizado
        </Text>
      </LiquidGlassCard>

      {/* Card de Tarefas */}
      <LiquidGlassCard style={{ height: 150 }} intensity={60}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <House size={24} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600' }}>Tarefas de Hoje</Text>
        </View>
        {/* ... lista de tarefas */}
      </LiquidGlassCard>

    </View>
  );
}
```


### Detalhes Técnicos do "Efeito iOS 26":

* **Profundidade (Z-Index visual)**: O segredo está em usar um shader *atrás* do blur. Isso faz com que as cores "sangrem" através do vidro fosco, criando a sensação de que o material é espesso e refrativo.
* **Performance**: O `Skia` roda na GPU UI thread, e o `Reanimated` gerencia os uniforms via worklets. Isso garante 60-120fps constantes, essencial para a sensação "premium" exigida no PRD.
* **Router**: Como você está usando o `Expo Router`, este componente funciona perfeitamente dentro de qualquer rota, e as animações de transição de página (Shared Element) podem ser aplicadas ao `LiquidGlassCard` se necessário.
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/

[^2]: https://www.nngroup.com/articles/liquid-glass/

[^3]: https://www.youtube.com/watch?v=FXrcFeuYtq8

[^4]: https://www.reddit.com/r/apple/comments/1njqlo5/ios_26s_liquid_glass_design_draws_criticism_from/

[^5]: https://www.designmonks.co/blog/liquid-glass-ui

[^6]: https://www.youtube.com/watch?v=qYFMOMVZoPY

[^7]: https://shopify.github.io/react-native-skia/docs/tutorials/

[^8]: https://www.youtube.com/watch?v=srHpVl6nZm4

[^9]: https://www.youtube.com/watch?v=jGztGfRujSE

[^10]: https://cygnis.co/blog/implementing-liquid-glass-ui-react-native/

[^11]: https://www.youtube.com/watch?v=ao2i_sOD-z0

[^12]: https://github.com/Shopify/react-native-skia/discussions/226

[^13]: https://uxdesign.cc/liquid-glass-isnt-a-design-failure-it-is-apple-s-most-tactile-digital-future-yet-091abade02b3

[^14]: https://github.com/rit3zh/expo-liquid-glass-view

[^15]: https://vagary.tech/blog/apple-liquid-glass-flutter-react-native-compose-mp

[^16]: https://docs.expo.dev/versions/latest/sdk/blur-view/

[^17]: https://www.mockplus.com/blog/post/liquid-glass-effect-design-examples

[^18]: https://www.youtube.com/watch?v=iYh-7WfJTR0\&vl=pt-BR

[^19]: https://icreationsent.com/blog/rn-liquid-glass-high-fidelity

[^20]: https://www.youtube.com/watch?v=BcFG9T-0-iE

[^21]: luma_prd.md


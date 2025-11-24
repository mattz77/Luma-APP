<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# agora crie um arquivo também como se fosse um manual de instruções para o cursor para :

Expo SDK 54, Expo Router v6, React Native 0.81, TypeScript, Reanimated v4

Criei um arquivo Markdown detalhado com instruções específicas para o Cursor IDE focado nas tecnologias que você está usando.[^1][^2][^3]

```markdown
# Expo SDK 54 + Router v6 + React Native 0.81 + TypeScript + Reanimated v4
## Manual de Instruções para Cursor IDE

---

## Stack Overview

- **Expo SDK**: 54.x
- **Expo Router**: v6.x
- **React Native**: 0.81.x
- **TypeScript**: ~5.9.2
- **React Native Reanimated**: v4.x
- **React**: 19.1.x
- **Architecture**: New Architecture (obrigatório)

---

## 🚀 Principais Recursos SDK 54

### Precompiled React Native para iOS
- Redução de ~10x no tempo de build limpo (120s → 10s no RNTester)
- Funciona automaticamente exceto se usar `use_frameworks!` no Podfile
- Aproxima migração para Swift Package Manager

### iOS 26 + Liquid Glass
**Ícones Liquid Glass**:
```

// app.json
{
"ios": {
"icon": "./assets/app.icon"
}
}

```

**Liquid Glass Views com UIKit**:
```

import { GlassView } from 'expo-glass-effect';

<GlassView 
  style={styles.glassView} 
  glassEffectStyle="clear" 
/>

```

**Liquid Glass com SwiftUI (Expo UI Beta)**:
```

import { Host, HStack, Text } from "@expo/ui/swift-ui";
import { glassEffect, padding } from '@expo/ui/swift-ui/modifiers';

<Host matchContents>
  <HStack
    alignment='center'
    modifiers={[
      padding({ all: 16 }),
      glassEffect({ glass: { variant: 'regular' } }),
    ]}
  >
    <Text>Regular glass effect</Text>
  </HStack>
</Host>
```

### Android 16 (API 36)
- **Edge-to-edge sempre ativo** (não pode ser desabilitado)
- Config para contraste da navigation bar:
```

// app.json
{
"android": {
"androidNavigationBar": {
"enforceContrast": true
},
"predictiveBackGestureEnabled": false // opt-in
}
}

```

---

## 📱 Expo Router v6 - Recursos Nativos

### Native Tabs (Liquid Glass Tabs)
```

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
return (
<Tabs
screenOptions={{
headerShown: false,
}}
>
<Tabs.Screen
name="index"
options={{
title: 'Home',
tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
}}
/>
<Tabs.Screen
name="explore"
options={{
title: 'Explore',
tabBarIcon: ({ color }) => <Icon name="search" color={color} />,
}}
/>
</Tabs>
);
}

```

**Recursos Native Tabs**:
- Liquid Glass effect automático no iOS 26
- Scroll-to-top ao pressionar tab
- Suporte melhorado para iPad, tvOS, desktop
- API ainda em beta (`unstable-` prefix)

### iOS Link Previews & Context Menus
```

import { Link } from 'expo-router';

<Link
  href="/profile/123"
  contextMenuItems={[
    { title: 'Open in New Window', systemIcon: 'arrow.up.forward.square' },
    { title: 'Share', systemIcon: 'square.and.arrow.up' },
  ]}
  previewConfig={{
    preferredCommitStyle: 'pop',
    previewSize: { width: 300, height: 400 },
  }}
>
  <Text>Long press me (iOS)</Text>
</Link>
```

### Web Modals (Native-like)
```

// app/modal.tsx
import { View, Text } from 'react-native';

export default function Modal() {
return (
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
```      <Text>Native-style modal on web</Text>      ```
</View>
);
}

// Navegação
router.push('/modal');

```

Agora emula comportamento de iPad/iPhone com animações e gestos nativos.

### Server Middleware (Experimental)
```

// app/_middleware.ts
export function middleware(request: Request) {
// Redirects
if (request.url.includes('/old-path')) {
return Response.redirect('/new-path');
}

// Authorization
const token = request.headers.get('Authorization');
if (!token) {
return Response.redirect('/login');
}

return null; // Continue to route
}

```

---

## 🎨 React Native Reanimated v4

### CRÍTICO: Apenas New Architecture
Reanimated v4 **não suporta Legacy Architecture**. SDK 54 é o último SDK com Legacy Architecture.

### Instalação
```

npx expo install react-native-reanimated@^4.0.0
npx expo prebuild --clean

```

### Configuração Automática
`babel-preset-expo` já inclui plugin do Reanimated. **Não modifique babel.config.js manualmente**.

### Padrões de Animação v4
```

import Animated, {
useSharedValue,
useAnimatedStyle,
withSpring,
withTiming,
} from 'react-native-reanimated';

export default function AnimatedComponent() {
const offset = useSharedValue(0);

const animatedStyles = useAnimatedStyle(() => ({
transform: [{ translateX: offset.value }],
}));

const handlePress = () => {
offset.value = withSpring(offset.value + 50);
};

return (
<Animated.View style={[styles.box, animatedStyles]}>
<Pressable onPress={handlePress}>
<Text>Move me</Text>
</Pressable>
</Animated.View>
);
}

```

### Worklets
```

import { runOnUI } from 'react-native-reanimated';

const heavyCalculation = () => {
'worklet';
// Roda na UI thread
return Math.sqrt(1000000);
};

// Execute manualmente
runOnUI(() => {
const result = heavyCalculation();
console.log(result);
})();

```

### Migração de v3 para v4
- `react-native-worklets` agora é integrado
- Remova dependências separadas de worklets
- API permanece compatível (breaking changes mínimos)
- Verifique migration guide oficial se usar recursos avançados

---

## 📦 TypeScript ~5.9.2

### Configuração Recomendada
```

// tsconfig.json
{
"extends": "expo/tsconfig.base",
"compilerOptions": {
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"resolveJsonModule": true,
"moduleResolution": "bundler",
"module": "ESNext",
"target": "ESNext",
"jsx": "react-native",
"lib": ["ESNext"],
"allowJs": true,
"noEmit": true
},
"include": [
"**/*.ts",
"**/*.tsx",
".expo/types/**/*.ts",
"expo-env.d.ts"
],
"exclude": [
"node_modules"
]
}

```

### Type Safety com Expo Router
```

// app/(tabs)/index.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';

type RouteParams = {
id: string;
filter?: string;
};

export default function Screen() {
const params = useLocalSearchParams<RouteParams>();
const router = useRouter();

// params.id é string
// params.filter é string | undefined

```
return <View>...</View>;
```

}

```

### Tipos Globais Expo
```

// global.d.ts
declare module '*.png' {
const value: import('react-native').ImageSourcePropType;
export default value;
}

declare module '*.svg' {
import { SvgProps } from 'react-native-svg';
const content: React.FC<SvgProps>;
export default content;
}

```

---

## ⚡ Expo CLI Features (SDK 54)

### React Compiler (Habilitado por Padrão)
- Memoização automática de componentes
- Verifique com: Pressione `J` no Expo CLI → Components Panel
- Logs mostram: "Experimental React Compiler is enabled."

### Import Stack Traces
Ativado por padrão. Mostra cadeia de imports quando módulo está faltando:
```

Error: Cannot find module 'missing-package'
Imported from: /app/components/Button.tsx
Imported from: /app/screens/Home.tsx
Imported from: /app/_layout.tsx

```

### Metro ESM Support
```

// metro.config.js
module.exports = {
resolver: {
unstable_enableLiveBindings: true, // Padrão
},
};

// Desabilitar se necessário
// EXPO_UNSTABLE_LIVE_BINDINGS=false npx expo start

```

### CSS Autoprefixing (LightningCSS)
```

// package.json
{
"browserslist": [
"last 2 versions",
"iOS >= 13",
"Android >= 10"
]
}

```

Remova `autoprefixer` do `postcss.config.mjs` - já incluído.

---

## 🔄 Expo Updates & EAS Update

### Runtime Header Override
```

import * as Updates from 'expo-updates';

// Mudar canal em runtime (ex: funcionários vs usuários)
await Updates.setUpdateRequestHeadersOverride({
'expo-channel-name': 'employee-beta',
});

// Buscar update imediatamente
await Updates.fetchUpdateAsync();
await Updates.reloadAsync();

```

### Download Progress
```

import { useUpdates } from 'expo-updates';

export default function UpdateScreen() {
const { downloadProgress, isDownloading } = useUpdates();

return (
<View>
{isDownloading \&\& (
<ProgressBar progress={downloadProgress} />
)}
</View>
);
}

```

### Custom Reload Screen
```

import * as Updates from 'expo-updates';

Updates.reloadAsync({
reloadScreenOptions: {
backgroundColor: '\#000000',
image: require('./assets/reload.png'),
imageResizeMode: 'cover',
imageFullScreen: true,
fade: true,
},
});

```

---

## 🛠️ Novos Recursos SDK 54

### expo-file-system/next (Agora Estável)
```

import { File, Directory } from 'expo-file-system';

// API Orientada a Objetos
const file = new File('documents/data.json');
await file.write(JSON.stringify({ foo: 'bar' }));
const content = await file.text();

const dir = new Directory('documents');
const files = await dir.list();

```

**Migração**:
- `expo-file-system` → nova API (antiga em `expo-file-system/legacy`)
- Suporta SAF URIs (Android) e bundled assets

### expo-sqlite com localStorage API
```

import { openDatabaseSync, enableLocalStorage } from 'expo-sqlite';

enableLocalStorage();

// Usa localStorage web-compatible
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');

```

### expo-app-integrity
```

import * as AppIntegrity from 'expo-app-integrity';

// Verificar integridade do app
const result = await AppIntegrity.getIntegrityToken();

if (result.token) {
// Enviar para backend para validação
await fetch('/api/verify', {
headers: { 'X-Integrity-Token': result.token },
});
}

```

### expo-blob (Beta)
```

import { Blob } from 'expo/blob';

const blob = new Blob(['Hello, world!'], { type: 'text/plain' });
const text = await blob.text();

```

Compatível com spec W3C.

---

## 🏗️ Estrutura de Projeto Recomendada

```

project-root/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          \# Native Tabs Layout
│   │   ├── index.tsx             \# Home Tab
│   │   ├── explore.tsx           \# Explore Tab
│   │   └── profile.tsx           \# Profile Tab
│   ├── user/
│   │   └── [id].tsx              \# Dynamic Route
│   ├── _layout.tsx               \# Root Layout
│   ├── +not-found.tsx            \# 404 Screen
│   └── modal.tsx                 \# Modal Screen
├── components/
│   ├── ui/                       \# UI Components
│   ├── animations/               \# Reanimated Components
│   └── glass/                    \# Glass Effect Components
├── hooks/
│   ├── useAnimatedValue.ts
│   └── useSupabase.ts
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── constants/
│   ├── Colors.ts
│   └── Layout.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── app.icon                  \# Liquid Glass Icon
├── app.json
├── eas.json
├── tsconfig.json
└── package.json

```

---

## 🔧 Integração com Supabase

```

// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
auth: {
storage: AsyncStorage,
autoRefreshToken: true,
persistSession: true,
detectSessionInUrl: false,
},
});

// Hook para usar em components
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

export function useSession() {
const [session, setSession] = useState<Session | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
supabase.auth.getSession().then(({ data: { session } }) => {
setSession(session);
setLoading(false);
});

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    
    return () => subscription.unsubscribe();
    }, []);

return { session, loading };
}

```

### Proteção de Rotas com Middleware
```

// app/_layout.tsx
import { useSession } from '@/lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
const { session, loading } = useSession();
const router = useRouter();
const segments = useSegments();

useEffect(() => {
if (loading) return;

    const inAuthGroup = segments === '(auth)';
    
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
    }, [session, loading, segments]);

return <Slot />;
}

```

---

## 🎯 Best Practices

### Performance
- Use React Compiler (ativo por padrão)
- Prefira Reanimated v4 para animações complexas
- Use `expo-image` em vez de `Image` padrão
- Implemente lazy loading com `React.lazy` + `Suspense`

### Animações
```

// Prefer Reanimated para UI thread
import Animated, {
FadeIn,
FadeOut,
Layout,
} from 'react-native-reanimated';

<Animated.View
entering={FadeIn}
exiting={FadeOut}
layout={Layout.springify()}
>
<Content />
</Animated.View>

```

### Navegação
- Use file-based routing (Expo Router v6)
- Aproveite native tabs para melhor UX
- Implemente link previews no iOS
- Use server middleware para auth/redirects

### Typing
- Sempre use TypeScript strict mode
- Type todos os params de rotas
- Crie tipos globais para env vars
- Use `satisfies` operator para type narrowing

### Build & Deploy
```


# Development

npx expo start --clear

# Production Build

eas build --platform all --profile production

# OTA Update

eas update --branch production --message "Bug fixes"

# Fingerprint Compare (cache)

eas fingerprint:compare

```

---

## 🚨 Breaking Changes & Migrações

### New Architecture Obrigatório (SDK 55+)
SDK 54 é o **último** com Legacy Architecture. Prepare-se:
- Migre bibliotecas incompatíveis
- Teste com New Architecture ativado
- Atualize config plugins

### Reanimated v3 → v4
```

npm uninstall react-native-worklets-core
npx expo install react-native-reanimated@^4.0.0
npx expo prebuild --clean

```

### expo-file-system
```

// Antes
import * as FileSystem from 'expo-file-system';
await FileSystem.writeAsStringAsync(uri, content);

// Agora (nova API)
import { File } from 'expo-file-system';
await new File(uri).write(content);

// Ou use /legacy temporariamente
import * as FileSystem from 'expo-file-system/legacy';

```

### SafeAreaView Deprecated
```

// ❌ Não use
import { SafeAreaView } from 'react-native';

// ✅ Use
import { SafeAreaView } from 'react-native-safe-area-context';

```

---

## 📋 Commands Essenciais

```


# Desenvolvimento

npx expo start
npx expo start --clear
npx expo start --tunnel
npx expo start --ios
npx expo start --android

# Type Checking

npx tsc --noEmit

# Linting

npx eslint .

# Build Local

npx expo run:ios
npx expo run:android
npx expo prebuild --clean

# EAS

eas build --platform ios --profile development
eas build --platform android --profile preview
eas submit --platform all

# Upgrade

npx expo install expo@^54.0.0 --fix
npx expo-doctor@latest

# Debug

npx react-native log-ios
npx react-native log-android

```

---

## 🐛 Troubleshooting

### Cache Issues
```

npx expo start --clear
rm -rf node_modules .expo
npm install
npx pod-install

```

### Reanimated v4 Errors
```

npx expo prebuild --clean
cd ios \&\& pod install \&\& cd ..
npx expo run:ios

```

### Metro Bundle Errors
```

npx expo start --reset-cache
rm -rf .expo node_modules
npm install

```

### TypeScript Errors
```

rm -rf .expo/types
npx expo start

# Pressione 'r' para regenerar types

```

---

## 📚 Recursos

- **Expo SDK 54**: https://expo.dev/changelog/sdk-54
- **Expo Router v6**: https://expo.dev/blog/expo-router-v6
- **React Native 0.81**: https://reactnative.dev/blog/2025/08/12/react-native-0.81
- **Reanimated v4**: https://docs.swmansion.com/react-native-reanimated/
- **TypeScript 5.9**: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html

---

## ⚙️ Diretrizes para Cursor AI

Ao trabalhar neste projeto:

1. **Sempre use New Architecture** - Legacy não é suportado
2. **TypeScript strict** - Sem `any`, sempre tipos explícitos
3. **Reanimated v4** - Para todas animações complexas
4. **Expo Router file-based** - Não use React Navigation diretamente
5. **Native-first** - Aproveite recursos nativos (tabs, link previews)
6. **React Compiler** - Confie na memoização automática
7. **Supabase patterns** - Siga hooks e auth patterns estabelecidos
8. **Liquid Glass** - Use quando design permitir (iOS 26+)
9. **SDK 54 features** - Prefira novas APIs estáveis
10. **Performance first** - UI thread com Reanimated, lazy loading, etc

---

## 🎨 Code Style

```

// Imports Order
import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

// Component Declaration
interface Props {
title: string;
onPress?: () => void;
}

export default function Component({ title, onPress }: Props) {
// Hooks
const router = useRouter();
const [state, setState] = useState(false);

// Animated Values
const animatedStyle = useAnimatedStyle(() => ({
opacity: state ? 1 : 0.5,
}));

// Handlers
const handlePress = () => {
setState(true);
onPress?.();
};

// Effects
useEffect(() => {
// Setup
return () => {
// Cleanup
};
}, []);

// Render
return (
<Animated.View style={animatedStyle}>
<Pressable onPress={handlePress}>
<Text>{title}</Text>
</Pressable>
</Animated.View>
);
}

```

---

**Versão**: SDK 54.0.0  
**Última Atualização**: Novembro 2025  
**New Architecture**: Obrigatório
```

Este manual fornece instruções completas e específicas para o Cursor IDE trabalhar com sua stack exata, incluindo todos os recursos novos do SDK 54, Expo Router v6, padrões de Reanimated v4, e integração com Supabase. Salve como `.cursor/expo-sdk54-manual.mdc` no seu projeto.[^4][^2][^3][^5][^6][^7][^1]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://expo.dev/changelog/sdk-54

[^2]: https://reactnative.dev/blog/2025/08/12/react-native-0.81

[^3]: https://expo.dev/blog/expo-router-v6

[^4]: https://www.linkedin.com/posts/vijay-kishan-594517148_exporouter-reactnative-appdevelopment-activity-7371967535547756545-lRyJ

[^5]: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/

[^6]: https://kirill-markin.com/articles/cursor-ide-rules-for-ai/

[^7]: https://cursor.com/docs/context/rules

[^8]: https://expo.dev/changelog

[^9]: https://expo.dev/changelog/sdk-54-beta

[^10]: https://www.reddit.com/r/expo/comments/1ndpzg5/expo_sdk_54_changelog_and_upgrade_guide/

[^11]: https://www.youtube.com/watch?v=KBlbkjqxNbM

[^12]: https://github.com/facebook/react-native/issues/53866

[^13]: https://www.callstack.com/events/live-dev-session-week-34

[^14]: https://www.youtube.com/watch?v=bO7ZoQWa9ic

[^15]: https://news.notjust.dev/posts/what-s-new-in-expo-sdk-54

[^16]: https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/

[^17]: https://www.linkedin.com/posts/naeem1274_exposdk-reactnative-mobiledev-activity-7373533122891497472-xvCc

[^18]: https://docs.expo.dev/router/introduction/

[^19]: https://www.youtube.com/watch?v=oWVie6GVI-I

[^20]: https://www.youtube.com/watch?v=iYh-7WfJTR0\&vl=pt-BR

[^21]: https://github.com/gorhom/react-native-bottom-sheet/issues/2507

[^22]: https://www.youtube.com/watch?v=QqNZXdGFl44\&vl=pt-BR


<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# [https://docs.expo.dev/guides/overview/](https://docs.expo.dev/guides/overview/)

crie um arquivo .md com instruções para o cursor como se fosse um mcp>
sobre as documentações do expo

Com base nas informações coletadas sobre MCPs, Cursor IDE e a documentação do Expo, criei um arquivo Markdown com instruções para o Cursor IDE que funciona como um MCP especializado em documentação Expo.[^1][^2][^3]

```markdown
# Expo Documentation Assistant - MCP Instructions

## Overview
Este MCP fornece contexto especializado sobre desenvolvimento com Expo Framework para o Cursor IDE. Use estas instruções ao trabalhar com projetos React Native usando Expo.

## Core Capabilities

### Development Process
- **App Config**: Configuração de app.json/app.config.js incluindo permissions, splash screens e assets
- **Build Process**: Entender o processo de desenvolvimento com Expo CLI e EAS Build
- **Universal Links**: Configuração de deep linking e navegação entre plataformas
- **Custom Native Code**: Adicionar código nativo personalizado quando necessário
- **Web Support**: Configurar e otimizar apps Expo para rodar na web

### Expo Router
- **File-based Routing**: Sistema de navegação baseado em estrutura de arquivos no diretório `/app`
- **Layouts**: Uso de `_layout.tsx` para configurar navegadores (tabs, stack, drawer)
- **Navigation Hooks**: `useRouter()`, `usePathname()`, `useSearchParams()`, `useLocalSearchParams()`
- **Authentication**: Implementar fluxos de autenticação com proteção de rotas
- **Redirects**: Configurar redirecionamentos condicionais
- **Testing**: Estratégias para testar navegação

### Expo Modules API
- **Native Modules**: Criar e integrar módulos nativos usando Expo Modules API
- **Swift/Kotlin Integration**: Escrever código nativo quando necessário
- **Expo Config Plugins**: Modificar configurações nativas durante o build

### Key Features
- **Push Notifications**: Expo Notifications para notificações push
- **File System**: Expo FileSystem para operações de arquivo
- **Camera & Media**: Expo Camera, ImagePicker, MediaLibrary
- **Authentication**: Expo AuthSession para OAuth/Web Auth
- **Location**: Expo Location para geolocalização
- **Updates**: EAS Update para over-the-air updates

## Code Patterns

### Project Structure
```

project-root/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── explore.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── components/
├── constants/
├── hooks/
├── assets/
└── app.json

```

### Expo Router Navigation
```

// useRouter para navegação programática
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/profile');
router.replace('/login');
router.back();

// Link components
import { Link } from 'expo-router';
<Link href="/about">About</Link>

```

### Dynamic Routes
```

// app/user/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function UserProfile() {
const { id } = useLocalSearchParams();

```
return <Text>User: {id}</Text>;
```

}

```

### Layouts
```

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
return (
<Tabs>
<Tabs.Screen name="index" options={{ title: 'Home' }} />
<Tabs.Screen name="explore" options={{ title: 'Explore' }} />
</Tabs>
);
}

```

## Best Practices

### Performance
- Use `expo-router` para navegação file-based nativa
- Implemente lazy loading para screens pesadas
- Otimize imagens com `expo-image`
- Use `React.memo` e `useMemo` apropriadamente

### Development Workflow
- Execute `npx expo start` para iniciar o dev server
- Use `npx expo start --tunnel` para testar em dispositivos externos
- Configure `eas.json` para builds de produção
- Mantenha `app.json` atualizado com permissões necessárias

### Code Quality
- Use TypeScript para type safety
- Organize componentes em diretórios lógicos
- Separe lógica de negócio em hooks customizados
- Documente APIs e componentes complexos

### Platform-Specific Code
```

import { Platform } from 'react-native';

const styles = StyleSheet.create({
container: {
paddingTop: Platform.select({
ios: 20,
android: 0,
web: 10,
}),
},
});

```

## Common Commands

```


# Desenvolvimento

npx expo start
npx expo start --clear
npx expo start --tunnel

# Build

eas build --platform android
eas build --platform ios
eas build --platform all

# Updates

eas update --branch production
eas update --auto

# Instalação de pacotes

npx expo install <package>  \# Instala versão compatível

```

## Integration Guidelines

### Supabase Integration
```

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
auth: {
storage: AsyncStorage,
autoRefreshToken: true,
persistSession: true,
},
});

```

### Environment Variables
```

// app.config.js
export default {
expo: {
extra: {
apiUrl: process.env.API_URL,
},
},
};

// Usage
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;

```

## Troubleshooting

### Cache Issues
```

npx expo start --clear
rm -rf node_modules
npm install

```

### Native Module Errors
```

npx expo prebuild --clean
npx expo run:ios
npx expo run:android

```

### Metro Bundler Issues
```

npx expo start --reset-cache

```

## Resources & Documentation

- **Main Docs**: https://docs.expo.dev/
- **Expo Router**: https://docs.expo.dev/router/introduction/
- **API Reference**: https://docs.expo.dev/versions/latest/
- **EAS Docs**: https://docs.expo.dev/eas/
- **GitHub**: https://github.com/expo/expo

## Guidelines for Cursor AI

When assisting with Expo projects:

1. **Always check Expo SDK version compatibility** before suggesting packages
2. **Prefer `npx expo install`** over npm/yarn install for React Native packages
3. **Use file-based routing** with Expo Router instead of React Navigation directly
4. **Follow Expo conventions** for project structure and naming
5. **Reference official Expo docs** for up-to-date APIs and best practices
6. **Consider cross-platform implications** (iOS, Android, Web) in solutions
7. **Suggest EAS services** when appropriate for builds, updates, and submissions
8. **Use TypeScript** for all code examples unless explicitly requested otherwise

## Tool-Specific Context

- This project uses **Expo SDK 54** (or latest)
- File-based routing with **Expo Router**
- Backend integration with **Supabase**
- State management patterns vary by project
- Native modules via **Expo Modules API**
- Styling with **React Native StyleSheet** or **NativeWind/Tailwind**

## Workflow Integration Notes

- Use n8n workflows for backend automation
- Supabase for database, auth, and storage
- Expo for mobile/web frontend
- EAS for CI/CD pipeline
- GitHub for version control
```

Este arquivo serve como um MCP (Model Context Protocol) que você pode colocar no diretório `.cursor/` do seu projeto como `expo-docs.mdc`. O Cursor IDE lerá essas instruções e usará como contexto ao trabalhar com código Expo, fornecendo sugestões mais precisas e alinhadas com as melhores práticas do framework.[^4][^3][^5][^6][^7]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://cursor.com/docs/context/mcp

[^2]: https://mcpcursor.com

[^3]: https://www.andriifurmanets.com/blogs/unlocking-ai-assisted-development-with-model-context-protocol-mcp-in-cursor-ide

[^4]: https://docs.expo.dev/guides/overview/

[^5]: https://kirill-markin.com/articles/cursor-ide-rules-for-ai/

[^6]: https://dev.to/heymarkkop/cursor-tips-10f8

[^7]: https://cursor.com/docs/context/rules

[^8]: https://www.linkedin.com/posts/gavinching_using-the-cursor-ide-and-wondering-how-to-activity-7302738352116576256-SzwV

[^9]: https://cursor.directory/mcp

[^10]: https://www.reddit.com/r/cursor/comments/1k76kvd/always_make_a_markdown_file_before_tackling_a_new/

[^11]: https://docs.pieces.app/products/mcp/cursor

[^12]: https://docs.expo.dev/get-started/start-developing/

[^13]: https://natoma.ai/blog/how-to-enabling-mcp-in-cursor

[^14]: https://docs.expo.dev/tutorial/overview/

[^15]: https://www.youtube.com/watch?v=nk0eSGwW-Mc

[^16]: https://forums.realmacsoftware.com/t/tips-for-using-cursor-for-custom-component-development/44915

[^17]: https://docs.expo.dev/guides/monorepos/

[^18]: https://dev.to/aws-builders/aws-mcp-and-cursor-ide-together-make-aws-simple-50ik

[^19]: https://github.com/expo/expo

[^20]: https://forum.cursor.com/t/how-to-correctly-create-markdown-files-containing-code-blocks/16650


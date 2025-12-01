<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Diferenças entre Gluestack UI v2 e v3

| Aspecto | v2 | v3 |
| :-- | :-- | :-- |
| **Arquitetura** | Copy-paste components | Melhor modularização com @gluestack-ui/core |
| **Compatibilidade Expo 54** | Problemas com overlays e animações | Totalmente compatível desde setembro 2025 |
| **Animações** | @legendapp/motion (problemas no Expo 54) | Animações otimizadas e compatíveis |
| **Bundle size** | -90% CSS vs v1 | Ainda mais otimizado |
| **APIs** | Mantidas na v3 | 100% compatível (migração indolor) |
| **NativeWind** | v4.1 | v4.2+ |
| **Reanimated** | v3.x | v4.1+ (seu caso) |
| **RSC** | Suporte parcial | Suporte completo |
| **Estabilidade** | Estável | Estável (desde set/2025) |

## Qual usar no Luma?

**Use Gluestack UI v3** - é a melhor escolha para seu contexto porque:[^1][^2]

### Vantagens específicas para o Luma

**Compatible com seu stack atual**

- ✅ Expo SDK 54 (oficialmente suportado desde setembro 2025)
- ✅ React Native Reanimated v4.1+
- ✅ NativeWind v4.2
- ✅ Expo Router v6

**Problemas resolvidos da v2**
A v2 tinha bugs críticos com componentes overlay (Modal, Drawer, ActionSheet) no Expo 54 devido ao @legendapp/motion. A v3 eliminou essas dependências problemáticas.[^3]

**API idêntica à v2**
Se você começar direto na v3, não precisa se preocupar com migrações futuras. Os exemplos de código que mostrei continuam funcionando.[^4][^1]

### Componentes essenciais para o Luma (v3)

```typescript
// Toast para alertas financeiros
import { Toast, ToastTitle } from '@/components/ui/toast'

// Modal para formulários de despesas
import { Modal, ModalBackdrop, ModalContent } from '@/components/ui/modal'

// Drawer para chat com Luma AI
import { Drawer, DrawerContent } from '@/components/ui/drawer'

// ActionSheet para ações rápidas
import { Actionsheet, ActionsheetBackdrop } from '@/components/ui/actionsheet'
```


### Instalação recomendada

```bash
# Iniciar com v3 diretamente
npx gluestack-ui@latest init

# CLI detecta Expo 54 e configura automaticamente
```

**Evite a v2** - ela teve problemas sérios de compatibilidade com Expo 54 que só foram resolvidos na v3. Como você está começando agora, não faz sentido usar uma versão com limitações conhecidas.[^2][^3]
<span style="display:none">[^10][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://gluestack.io/blogs/gluestack-v3-release

[^2]: https://x.com/gluestack/status/1971190006007087413

[^3]: https://github.com/gluestack/gluestack-ui/issues/3200

[^4]: https://gluestack.io/ui/docs/guides/more/upgrade-to-v3

[^5]: https://github.com/gluestack/gluestack-ui/releases

[^6]: https://gluestack.io/ui/docs/guides/more/faqs

[^7]: https://gluestack.io/blogs/gluestack-ui-v2-stable-release-with-nativewind-v4-1-support

[^8]: https://gluestack.io/ui/docs/home/overview/introduction

[^9]: https://docs.nativebase.io/migration/v3

[^10]: https://github.com/gluestack/gluestack-ui


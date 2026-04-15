---
name: liquid-glass-luma
description: >-
  Orienta criação de superfícies Liquid Glass no app Luma usando AdaptiveGlass,
  fallbacks iOS/Android/Web e exceções de modal. Use quando o usuário ou tarefa
  mencionar liquid glass, AdaptiveGlass, GlassView, expo-glass-effect, blur card,
  vidro fosco, TabBar glass ou efeito glass cross-platform no Luma.
---

# Liquid Glass — Luma (cross-platform)

## Fonte normativa

Antes de implementar ou alterar UI com efeito vidro, ler **[`docs/liquid-glass-cross-platform.md`](../../../docs/liquid-glass-cross-platform.md)**. O guia define a matriz de plataforma (iOS 26+ nativo, fallback BlurView + gradiente, web `backdrop-filter`) e anti-patterns.

## Componente canônico

- Usar **`AdaptiveGlass`** em [`luma-app/components/ui/AdaptiveGlass.tsx`](../../../luma-app/components/ui/AdaptiveGlass.tsx) para novas superfícies e para substituir combinações manuais de `BlurView` + gradiente quando o objetivo for o mesmo efeito do guia.
- Não duplicar a matriz `isLiquidGlassAvailable()` / `BlurView` / web em telas novas.

## LiquidGlassCard e Skia opcional

- [`LiquidGlassCard`](../../../luma-app/components/ui/LiquidGlassCard.tsx) compõe `AdaptiveGlass` e pode ativar **`skiaHighlight`** para o brilho extra (shader Skia) em superfícies já acordadas (ex.: dock). Por padrão `skiaHighlight` é `false` para menos custo.
- **Tint do `BlurView` (fallback)** vs **`glassEffectStyle` / `variant` (iOS 26+ nativo)**: no nativo, a variante vem de `expo-glass-effect`; no fallback, `blurTint` e `blurIntensity` governam o `BlurView`.

## Wrappers Gluestack (`liquid-glass`)

- [`luma-app/components/ui/liquid-glass/index.tsx`](../../../luma-app/components/ui/liquid-glass/index.tsx): `GlassView` / `GlassContainer` só usam `expo-glass-effect` direto quando **`Platform.OS === 'ios'`** e **`isLiquidGlassAvailable()`**; caso contrário usam o mesmo fallback que `AdaptiveGlass` (incluindo web alinhada ao doc).

## Exceção — modais fullscreen

- Backdrop de bottom sheet / modal: manter **`LumaModalOverlay`** e tokens em [`luma-app/lib/modalOverlayTokens.ts`](../../../luma-app/lib/modalOverlayTokens.ts). Não trocar por `AdaptiveGlass` no scrim sem decisão explícita (ver [`.cursor/rules/luma-ui-modals.mdc`](../../rules/luma-ui-modals.mdc)).

## Anti-patterns (resumo)

- **Não** animar **`opacity`** em um ancestral do `GlassView` nativo (iOS 26+); preferir animação nativa do glass ou `translateY`, e `opacity` só no fallback (ver doc — Animações).
- **Não** usar glass sem conteúdo visual atrás (imagem, gradiente, lista); o efeito some.
- **Não** forçar `overflow: 'visible'` em cards glass se o doc pedir cantos arredondados contidos.
- Em **Android** com fundo escuro, ajustar **`tintColor`** (doc — BlurView sem contexto de cor).

## Segurança

- Efeito visual apenas; **não** substitui escopo `house_id` / RLS em dados.

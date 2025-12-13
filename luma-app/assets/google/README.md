# Assets do Google Sign In

Esta pasta contém os assets oficiais do Google para o botão "Fazer login com o Google", seguindo as [Diretrizes de Branding do Google](https://developers.google.com/identity/branding-guidelines?hl=pt-br).

## 📋 Diretrizes Seguidas

O componente `GoogleSignInButton` implementa as seguintes especificações oficiais:

### Especificações Técnicas

- **Tema**: Claro (Light)
- **Formato**: Retangular (Square)
- **Tamanho**: Grande (Large)
- **Background**: Branco (#FFFFFF)
- **Borda**: Cinza claro (#DADCE0)
- **Cor do texto**: Cinza escuro (#3C4043)
- **Altura mínima**: 48px
- **Padding**: 
  - 10px à direita do logo do Google
  - 12px à direita do texto

### Ícone do Google

- **Cor padrão**: #4285F4 (azul do Google)
- **Tamanho**: 18x18px
- **Background**: Branco (não pode ser alterado)
- **Não pode ser modificado**: Tamanho, cor ou estilo do ícone

## 📥 Baixar Assets Oficiais (Opcional)

Se você quiser usar os assets pré-aprovados do Google em vez do SVG inline:

1. Acesse: https://developers.google.com/identity/branding-guidelines?hl=pt-br
2. Role até a seção "Baixar ícones de marca pré-aprovados"
3. Baixe os botões no formato:
   - **Tema**: Claro (Light)
   - **Formato**: Retangular (Square)
   - **Tamanho**: Grande (Large)
   - **Formato de arquivo**: PNG ou SVG
4. Coloque os arquivos nesta pasta se necessário

## ✅ Implementação Atual

O componente atual usa:
- ✅ SVG inline do logo do Google (conforme diretrizes)
- ✅ Cores oficiais do Google
- ✅ Espaçamentos corretos
- ✅ Texto "Fazer login com o Google" (pode ser traduzido)
- ✅ Background branco com borda cinza
- ✅ Altura de 48px (conforme recomendado)

## 🔄 Personalização

**IMPORTANTE**: Ao personalizar o botão, você DEVE seguir estas regras:

### ✅ Pode fazer:
- Ajustar o tamanho do botão (mantendo proporções)
- Traduzir o texto "Fazer login com o Google"
- Ajustar padding e espaçamentos
- Usar temas claro, escuro ou neutro

### ❌ NÃO pode fazer:
- Alterar a cor do ícone "G" do Google
- Colocar o ícone em background colorido (deve ser branco)
- Usar apenas o ícone sem texto
- Criar seu próprio ícone
- Usar o termo "Google" sozinho sem "Fazer login com"

## 📚 Referências

- [Diretrizes de Branding do Google](https://developers.google.com/identity/branding-guidelines?hl=pt-br)
- [Configurador HTML do Google](https://developers.google.com/identity/branding-guidelines?hl=pt-br#html_button_configurator)
- [Download de Assets Pré-aprovados](https://developers.google.com/identity/branding-guidelines?hl=pt-br#download_pre-approved_assets)

## 🎨 Cores Oficiais do Google

- **Azul Google**: #4285F4
- **Verde Google**: #34A853
- **Amarelo Google**: #FBBC05
- **Vermelho Google**: #EA4335
- **Cinza texto**: #3C4043
- **Cinza borda**: #DADCE0
- **Branco**: #FFFFFF


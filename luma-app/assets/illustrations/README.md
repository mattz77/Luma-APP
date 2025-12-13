# Ilustrações Flat Illustration System

Esta pasta contém as ilustrações do sistema flat illustration do Figma para as telas de autenticação.

## 📁 Estrutura de Arquivos

Coloque os seguintes arquivos nesta pasta:

```
luma-app/assets/illustrations/
├── sign-in.png          # Ilustração para tela de Login
├── sign-up.png          # Ilustração para tela de Cadastro
└── forgot-password.png   # Ilustração para tela de Esqueci a Senha
```

## 📥 Como Baixar do Figma

### Opção 1: Exportar diretamente do Figma

1. Acesse o design no Figma: https://www.figma.com/design/hrxbDhu5tqIE02WvuFGmxc/Flat-illustration-system--Community-
2. Selecione a ilustração correspondente a cada tela:
   - **Sign In**: Ilustração com pessoa segurando cartão/telefone e gráfico de barras
   - **Sign Up**: Ilustração com pessoa segurando documento e elementos de compras
   - **Forget Password**: Ilustração com pessoa trabalhando em laptop
3. Clique com botão direito na ilustração → **Export** → **PNG** (ou **SVG**)
4. Configure:
   - **Size**: 2x (400x400px ou maior para melhor qualidade)
   - **Format**: PNG (recomendado) ou SVG
5. Salve com os nomes exatos:
   - `sign-in.png`
   - `sign-up.png`
   - `forgot-password.png`
6. Coloque os arquivos nesta pasta: `luma-app/assets/illustrations/`

### Opção 2: Usar Figma API (se tiver acesso)

Se você tiver acesso à API do Figma, pode usar o MCP Figma Remote para exportar automaticamente.

## 🎨 Especificações Técnicas

- **Formato**: PNG (recomendado) ou SVG
- **Tamanho**: Mínimo 400x400px (2x para retina)
- **Background**: Transparente ou com fundo azul claro (#E0F2FE)
- **Estilo**: Flat illustration system (formas simples, cores sólidas)

## ✅ Verificação

Após adicionar os arquivos, verifique se:

1. Os arquivos estão na pasta correta: `luma-app/assets/illustrations/`
2. Os nomes dos arquivos estão exatos (case-sensitive):
   - `sign-in.png`
   - `sign-up.png`
   - `forgot-password.png`
3. Os arquivos são válidos (abre corretamente em um visualizador de imagens)

## 🔄 Atualização

O componente `FlatIllustration.tsx` está configurado para:
- Usar assets locais quando disponíveis
- Fazer fallback para URLs temporárias do Figma se os assets não existirem

Após adicionar os arquivos, reinicie o servidor Expo para que as mudanças sejam detectadas.


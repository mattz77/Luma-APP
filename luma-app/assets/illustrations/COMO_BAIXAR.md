# 📥 Como Baixar Ilustrações do Flat Illustration System

## 🎯 Objetivo

Baixar as ilustrações corretas do sistema Flat Illustration do Figma e colocá-las na pasta `luma-app/assets/illustrations/`.

## 📋 Passo a Passo

### 1. Acessar o Design no Figma

Abra o link do design:
**https://www.figma.com/design/hrxbDhu5tqIE02WvuFGmxc/Flat-illustration-system--Community-**

### 2. Identificar as Ilustrações Corretas

Baseado na imagem de referência, você precisa encontrar e exportar:

#### **Sign In (Login)**
- Ilustração com pessoa segurando cartão/telefone
- Gráfico de barras mostrando crescimento
- Sinal de mais e estrelas
- Contexto: acesso e crescimento

#### **Sign Up (Cadastro)**
- Ilustração com pessoa segurando documento
- Elementos de compras (sacola, porcentagem, etc.)
- Contexto: registro e ofertas

#### **Forget Password (Esqueci a Senha)**
- Ilustração com pessoa trabalhando em laptop
- Elementos circulares flutuantes
- Contexto: recuperação de senha e tecnologia

### 3. Exportar do Figma

Para cada ilustração:

1. **Selecione a ilustração** no Figma
2. **Clique com botão direito** → **Export** (ou use o painel direito)
3. **Configure a exportação**:
   - **Formato**: PNG (recomendado) ou SVG
   - **Tamanho**: 2x ou 3x (para melhor qualidade em telas retina)
     - Recomendado: **400x400px** ou **600x600px**
   - **Background**: Transparente (se disponível)
4. **Salve o arquivo** com o nome exato:
   - `sign-in.png`
   - `sign-up.png`
   - `forgot-password.png`

### 4. Colocar na Pasta Correta

Mova os arquivos exportados para:

```
luma-app/assets/illustrations/
├── sign-in.png
├── sign-up.png
└── forgot-password.png
```

### 5. Verificar

Após adicionar os arquivos:

1. ✅ Verifique se os nomes estão **exatos** (case-sensitive, sem espaços)
2. ✅ Verifique se os arquivos abrem corretamente
3. ✅ Reinicie o servidor Expo (`npm start` ou `bun start`)
4. ✅ As ilustrações devem aparecer nas telas de autenticação

## 🔍 Dica: Encontrar Ilustrações no Figma

Se você não encontrar as ilustrações específicas:

1. Use a **barra de busca** do Figma (Ctrl/Cmd + /)
2. Procure por termos como:
   - "sign in"
   - "login"
   - "sign up"
   - "register"
   - "forgot password"
   - "password reset"
3. Verifique as **páginas** (frames) do design
4. Procure por **componentes** ou **instances** do sistema

## 📱 Formato e Qualidade

- **PNG**: Melhor para ilustrações com gradientes e efeitos
- **SVG**: Melhor para ilustrações vetoriais (escaláveis)
- **Tamanho mínimo**: 400x400px (2x)
- **Tamanho recomendado**: 600x600px (3x) para telas retina

## ⚠️ Importante

- Os nomes dos arquivos **devem ser exatos** (case-sensitive)
- Não use espaços ou caracteres especiais nos nomes
- Use hífens (`-`) em vez de underscores (`_`)
- Após adicionar os arquivos, **reinicie o servidor Expo**

## 🆘 Problemas Comuns

### Arquivo não aparece
- Verifique se o nome está correto
- Verifique se está na pasta correta
- Reinicie o servidor Expo

### Imagem borrada
- Exporte em tamanho maior (2x ou 3x)
- Use PNG em vez de JPG

### Erro ao importar
- Verifique se o arquivo não está corrompido
- Tente exportar novamente do Figma

## 📞 Suporte

Se tiver dificuldades para encontrar ou exportar as ilustrações, você pode:

1. Usar as URLs temporárias do Figma (já configuradas como fallback)
2. Criar ilustrações temporárias seguindo o estilo flat illustration
3. Solicitar ajuda para identificar os componentes corretos no Figma


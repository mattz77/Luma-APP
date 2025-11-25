# 🚀 Guia de Configuração - Luma APP

Guia completo para configurar o ambiente de desenvolvimento do Luma.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org))
- **npm** ou **yarn**
- **Git** ([Download](https://git-scm.com))
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app no celular (iOS/Android)

## 🔧 Configuração Passo a Passo

### 1. Clone o Repositório

```bash
git clone https://github.com/mattz77/Luma-APP.git
cd Luma-APP
```

### 2. Checkout no Branch de Desenvolvimento

```bash
# Se você tem acesso ao branch privado
git checkout private-config

# Ou permaneça no main e configure do zero
```

### 3. Instalar Dependências

```bash
cd luma-app
npm install
```

### 4. Configurar Supabase

#### 4.1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (se não tiver)
3. Clique em "New Project"
4. Preencha:
   - **Name**: Luma (ou seu nome preferido)
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima

#### 4.2. Configurar Database

1. No dashboard do Supabase, vá em **SQL Editor**
2. Execute o script de criação de tabelas:
   - As migrations estão em `supabase/migrations/`
   - Execute em ordem numérica

Ou use o Supabase CLI:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar
supabase init

# Link com seu projeto
supabase link --project-ref your-project-id

# Aplicar migrations
supabase db push
```

#### 4.3. Obter Credenciais

1. No dashboard, vá em **Settings → API**
2. Copie:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon/public key**: `eyJhbGciOiJI...`

### 5. Configurar n8n (Opcional - para IA)

#### 5.1. Instalar n8n

Opção A - Docker (recomendado):
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Opção B - npm:
```bash
npm install -g n8n
n8n start
```

#### 5.2. Criar Workflow Luma

1. Acesse `http://localhost:5678`
2. Crie um novo workflow
3. Adicione nó **Webhook** (método POST)
4. Configure path: `/webhook/luma/chat`
5. Adicione integração com LLM (OpenAI, Anthropic, etc.)
6. Configure nó **Supabase** para salvar conversas
7. Ative o workflow
8. Copie a URL do webhook

### 6. Configurar OpenAI (para IA)

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Vá em **API Keys**
3. Clique em **Create new secret key**
4. Dê um nome: "Luma n8n"
5. Copie a chave (começa com `sk-`)
6. No n8n, adicione credencial OpenAI com esta chave

### 7. Configurar Variáveis de Ambiente

Crie o arquivo `luma-app/.env.local`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# n8n Webhook (opcional)
EXPO_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/luma/chat

# Redirect (para Auth)
EXPO_PUBLIC_SUPABASE_REDIRECT_URL=https://your-project-id.supabase.co/auth/callback
```

**⚠️ Importante**: Nunca commite este arquivo! Ele já está no `.gitignore`.

### 8. Testar Configuração

```bash
# Iniciar servidor Expo
npm start

# Ou diretamente
npx expo start
```

Você verá um QR code. Escaneie com:
- **iOS**: Câmera nativa
- **Android**: App Expo Go

## ✅ Verificação

### Teste de Autenticação
1. Abra o app
2. Tente fazer registro com email
3. Verifique se recebe email de confirmação
4. Faça login

### Teste de Banco de Dados
1. Crie uma nova casa
2. Verifique no dashboard Supabase se apareceu em `houses`
3. Adicione uma despesa
4. Verifique em `expenses`

### Teste de IA (se configurado)
1. Vá na tela "Luma"
2. Envie uma mensagem: "Olá Luma!"
3. Verifique se recebe resposta
4. No n8n, veja executions para debug

## 🐛 Troubleshooting

### Erro: "Supabase client not initialized"
- ✅ Verifique se `.env.local` existe
- ✅ Verifique se as variáveis estão corretas
- ✅ Reinicie o servidor Expo

### Erro: "Row Level Security policy violation"
- ✅ Certifique-se que RLS está ativado
- ✅ Verifique se as policies estão criadas
- ✅ Confirme que usuário está autenticado

### App não conecta no celular
- ✅ Celular e computador na mesma rede
- ✅ Firewall não está bloqueando porta 8081
- ✅ Tente connection via Tunnel: `npx expo start --tunnel`

### n8n não recebe requisições
- ✅ Verifique se workflow está ativo
- ✅ Confirme URL do webhook
- ✅ Teste com curl:
```bash
curl -X POST http://localhost:5678/webhook/luma/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## 📱 Plataformas

### Android
```bash
npm run android
# Ou
npx expo run:android
```

### iOS (apenas macOS)
```bash
npm run ios
# Ou
npx expo run:ios
```

### Web
```bash
npm run web
# Ou
npx expo start --web
```

## 🔐 Segurança

- ✅ NUNCA commite `.env.local`
- ✅ Use diferentes projetos Supabase para dev/prod
- ✅ Rotacione chaves API regularmente
- ✅ Configure Row Level Security corretamente
- ✅ Use service_role key apenas server-side

Leia `SECURITY.md` para mais informações.

## 📚 Próximos Passos

Após configuração básica:

1. ✅ Leia `DEVELOPMENT.md` para workflow de branches
2. ✅ Explore estrutura do projeto em `README.md`
3. ✅ Configure testes (quando implementados)
4. ✅ Personalize temas e cores

## 🆘 Precisa de Ajuda?

- 📖 **Documentação Expo**: [docs.expo.dev](https://docs.expo.dev)
- 📖 **Documentação Supabase**: [supabase.com/docs](https://supabase.com/docs)
- 📖 **Documentação n8n**: [docs.n8n.io](https://docs.n8n.io)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0.0


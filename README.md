# Luma - Assistente Inteligente para Gestão de Casa

Aplicativo mobile-first de gestão doméstica com assistente AI (Luma) para gerenciar finanças, tarefas e dispositivos IoT.

![Luma: Gestão Doméstica Simplificada](./luma-app/assets/Gemini_Generated_Image_p2g9tgp2g9tgp2g9.png)

*Interface promocional do Luma mostrando controle financeiro, gestão de tarefas, membros e insights inteligentes*

## 🚀 Stack Tecnológica

- **Frontend**: Expo SDK 54 + Expo Router v6 + React Native 0.81.5 + TypeScript
- **React**: 19.1.0 (New Architecture habilitada)
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Database**: PostgreSQL com Row Level Security (RLS) + PostGIS
- **AI Layer**: n8n para orquestração de workflows AI com RAG (Retrieval Augmented Generation)
- **Estado**: Zustand + React Query (TanStack Query v5)
- **Animações**: React Native Reanimated v4 + Moti + @legendapp/motion
- **UI**: Gluestack UI V3 + Lucide React Native Icons
- **Notificações**: Expo Notifications
- **Integridade**: Expo App Integrity (App Attest / Play Integrity)

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Expo CLI (`npm install -g expo-cli`)
- Conta Supabase (já configurada)
- Conta n8n (para integração com Luma AI)
- Expo Go app (para desenvolvimento) ou EAS Build (para produção)

## 🔧 Configuração Inicial

### 1. Instalar Dependências

```bash
cd luma-app
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na pasta `luma-app/` com as seguintes variáveis:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
EXPO_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/luma-chat-enhanced
```

**Importante**: 
- Atualize `EXPO_PUBLIC_N8N_WEBHOOK_URL` com a URL real do seu webhook n8n
- O endpoint do webhook deve ser `/webhook/luma-chat-enhanced` (conforme implementação atual)
- As variáveis devem começar com `EXPO_PUBLIC_` para serem acessíveis no cliente

### 3. Banco de Dados

O banco de dados Supabase está configurado com:

✅ **Tabelas principais** (13+ tabelas):
- `users` - Usuários do sistema
- `houses` - Casas/residências
- `house_members` - Membros de cada casa (com roles)
- `expenses` - Despesas financeiras
- `expense_categories` - Categorias de despesas
- `tasks` - Tarefas domésticas
- `task_comments` - Comentários em tarefas
- `conversations` - Histórico com Luma AI
- `notifications` - Notificações do sistema
- `monthly_budgets` - Orçamentos mensais
- `devices` - Dispositivos IoT (preparado para futuro)

✅ **Segurança e Performance**:
- Row Level Security (RLS) ativado em todas as tabelas
- Políticas de segurança configuradas (multi-tenant)
- Índices compostos para queries otimizadas
- Triggers e funções auxiliares (RPC)
- PostGIS habilitado para queries geoespaciais

✅ **Tipos TypeScript**:
- Tipos gerados automaticamente do Supabase
- Schema Prisma como referência (`prisma/schema.prisma`)

## 🏃 Executar o Projeto

### Desenvolvimento Local

```bash
# Iniciar servidor Expo
npm start

# Executar no Android
npm run android

# Executar no iOS (apenas macOS)
npm run ios

# Executar no navegador
npm run web

# Executar servidor MCP n8n (para integração com workflows)
npm run mcp:n8n
```

### Escanear QR Code

1. Instale o app **Expo Go** no seu celular
2. Execute `npm start`
3. Escaneie o QR code que aparece no terminal

## 📱 Estrutura do Projeto

```
luma-app/
├── app/                      # Expo Router (file-based routing)
│   ├── (auth)/              # Grupo de rotas de autenticação
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Rotas com bottom tabs
│   │   ├── index.tsx        # Dashboard
│   │   ├── finances/        # Gestão financeira
│   │   ├── tasks/           # Gestão de tarefas
│   │   ├── luma/            # Chat com Luma AI
│   │   └── house/           # Configurações da casa
│   ├── (modals)/            # Rotas modais
│   └── _layout.tsx          # Root layout
├── components/              # Componentes reutilizáveis
│   ├── ui/                  # Componentes base de UI
│   ├── features/            # Componentes específicos de features
│   ├── shared/              # Componentes compartilhados
│   ├── SpeedDial.tsx        # Menu radial para ações rápidas
│   ├── TagInput.tsx         # Input de tags para tarefas
│   └── ErrorBoundary.tsx    # Tratamento de erros
├── lib/                     # Configurações e utilitários
│   ├── supabase.ts          # Cliente Supabase
│   ├── n8n.ts               # Cliente n8n
│   ├── query-client.ts      # Configuração React Query
│   └── utils.ts             # Funções auxiliares
├── hooks/                   # Custom hooks
│   ├── useExpenses.ts       # Hook para despesas
│   ├── useTasks.ts          # Hook para tarefas
│   ├── useConversations.ts  # Hook para conversas
│   ├── useLumaChat.ts       # Hook para chat com Luma
│   ├── useRAGSync.ts        # Hook para sincronização RAG
│   ├── useRealtimeConversations.ts  # Realtime para conversas
│   ├── useRealtimeExpenses.ts       # Realtime para despesas
│   ├── useRealtimeTasks.ts         # Realtime para tarefas
│   ├── useExpenseCategories.ts     # Categorias de despesas
│   ├── useMonthlyBudget.ts         # Orçamento mensal
│   ├── useNotifications.ts         # Notificações
│   ├── useTaskComments.ts          # Comentários de tarefas
│   ├── useHouses.ts                 # Gestão de casas
│   └── useUserRole.ts               # Papéis de usuário
├── stores/                  # Zustand stores
│   └── auth.store.ts        # Estado de autenticação
├── services/                # Camada de serviços (API calls)
│   ├── expense.service.ts
│   ├── task.service.ts
│   ├── conversation.service.ts
│   ├── budget.service.ts
│   ├── expense-category.service.ts
│   ├── house.service.ts
│   ├── notification.service.ts
│   ├── rag.service.ts
│   └── taskComment.service.ts
├── types/                   # TypeScript types
│   ├── supabase.ts          # Tipos gerados do Supabase
│   ├── models.ts            # Tipos de domínio
│   └── env.d.ts             # Tipos de ambiente
├── constants/               # Constantes e configs
└── prisma/                  # Schema Prisma (referência)
    └── schema.prisma
```

## 🔐 Autenticação

O app usa Supabase Auth com:

- ✅ Email/Senha
- 🔄 Google Login (configurar)
- 🔄 Apple Login (configurar)
- ✅ Recuperação de senha
- ✅ Trigger automático para criar usuário em `public.users`

### Fluxo de Autenticação

1. Usuário faz login/registro
2. Supabase Auth cria sessão
3. Trigger `handle_new_user()` cria registro em `public.users`
4. App redireciona para dashboard ou criação de casa

## 🏠 Multi-Tenancy

O app usa padrão **Shared Database with Tenant Identifier**:

- Todas as tabelas possuem campo `house_id`
- Row Level Security (RLS) isola dados por casa
- Políticas automáticas filtram queries por `house_id`
- Usuário pode pertencer a múltiplas casas

### Criar uma Casa

Ao criar uma casa:
1. Registro é inserido em `houses` via função RPC `create_house_with_membership`
2. A função RPC cria automaticamente o membro ADMIN para o usuário autenticado
3. Código de convite único é gerado automaticamente
4. Outros usuários podem entrar via código

**Nota:** O trigger `add_house_creator_as_admin` está desabilitado porque `auth.uid()` não está disponível em todos os contextos (ex: Android, execução SQL direta). A criação de membros é feita pela função RPC `create_house_with_membership`.

## 🤖 Integração Luma AI (n8n)

### Configurar Webhook n8n

1. Crie um workflow no n8n
2. Adicione um **Webhook Trigger**
3. Configure endpoint: `/webhook/luma-chat-enhanced`
4. Adicione nós para:
   - Extrair contexto da casa (RAG - Retrieval Augmented Generation)
   - Consultar banco de dados (via Supabase API)
   - Enviar prompt para LLM (OpenAI/Anthropic/Groq)
   - Processar resposta com idempotência
   - Retornar JSON ao app

### Características da Integração

- ✅ **Idempotência**: Prevenção de processamento duplicado via `message_id`
- ✅ **Timeout Estendido**: 60 segundos para workflows complexos
- ✅ **RAG (Retrieval Augmented Generation)**: Contexto da casa sincronizado
- ✅ **Tratamento de Erros**: Timeout, rate limit e erros genéricos
- ✅ **Rastreamento**: Header `X-Request-ID` para debugging

### Exemplo de Payload

```json
{
  "house_id": "uuid",
  "user_id": "uuid",
  "message": "Como está a situação financeira?",
  "context": {
    "current_month": "2025-11",
    "user_role": "admin",
    "message_id": "timestamp-random"
  }
}
```

### Exemplo de Resposta

```json
{
  "success": true,
  "response": "Olá! 💰 Até agora vocês gastaram R$ 3.450...",
  "metadata": {
    "session_id": "uuid",
    "processing_time_ms": 850,
    "tools_used": ["financial_summary", "get_tasks"],
    "model": "gpt-4",
    "parsed": {}
  }
}
```

### MCP n8n Tools

O projeto inclui suporte para **n8n MCP (Model Context Protocol)** via `n8n-mcp`:

```bash
# Executar servidor MCP n8n
npm run mcp:n8n
```

Isso permite integração direta com workflows n8n via ferramentas MCP.

## 📊 Funcionalidades Implementadas

### ✅ Fase 1 (MVP)

#### 🎯 Core Features
- [x] Setup projeto Expo SDK 54 + TypeScript
- [x] Configuração Supabase + RLS + PostGIS
- [x] Autenticação (login, registro, recuperação de senha)
- [x] Navegação com Expo Router v6 (tabs + modals)
- [x] Gestão de casas (criar, entrar via código, membros)
- [x] Gestão financeira (CRUD despesas, categorias, orçamentos, relatórios)
- [x] Gestão de tarefas (CRUD, status, prioridades, comentários, atribuição)
- [x] Chat com Luma AI (integração n8n com RAG)
- [x] Dashboard com resumos inteligentes e briefing diário
- [x] Stores Zustand + React Query hooks
- [x] Realtime subscriptions (conversas, despesas, tarefas)
- [x] Sistema de notificações (Expo Notifications)
- [x] RAG Sync (sincronização de contexto para IA)
- [x] App Integrity (App Attest / Play Integrity)

#### ✨ Interações Mágicas (Magic UI)
- [x] **Magic Input Popup**: Criação assistida por IA de tarefas e despesas
  - Descreva em linguagem natural: "Comprar leite R$ 5 amanhã"
  - Luma detecta automaticamente tipo (tarefa/despesa) e extrai informações
  - Preview com confirmação antes de criar
  
- [x] **Speed Dial Component**: Menu radial elegante para ações rápidas
  - Botão "+" expande em menu circular
  - Acesso rápido a "Nova Despesa" e "Nova Tarefa"
  - Animações suaves com blur backdrop

- [x] **Menu de Usuário**: Gerenciamento completo de perfil
  - Avatar do usuário no header
  - Dropdown com opções: Perfil, Minha Casa, Sair
  - Navegação integrada com Expo Router

- [x] **Briefing Diário**: Resumo executivo inteligente
  - Acesso via pílula elegante ao lado da saudação
  - Análise de finanças, tarefas pendentes e insights
  - Tom sofisticado e motivacional (estilo Steve Jobs/Apple)

- [x] **Dashboard Aesthetic**: Interface moderna e intuitiva
  - Cards menores e mais elegantes
  - Glassmorphism effects
  - Navegação otimizada sem tabbar tradicional
  - Botões de ação centralizados com feedback háptico

#### 🔄 Features Avançadas Implementadas
- [x] **Realtime Subscriptions**: Atualizações em tempo real para conversas, despesas e tarefas
- [x] **RAG (Retrieval Augmented Generation)**: Sincronização de contexto da casa para melhorias na IA
- [x] **Sistema de Notificações**: Expo Notifications integrado
- [x] **App Integrity**: Validação de integridade do app (App Attest / Play Integrity)
- [x] **Magic Input**: Criação assistida por IA de tarefas e despesas
- [x] **Speed Dial**: Menu radial para ações rápidas
- [x] **Briefing Diário**: Resumo executivo inteligente gerado por IA

### 🔄 Próximas Fases

- [ ] Upload de foto de perfil do usuário (Supabase Storage)
- [ ] Upload de comprovantes de despesas (Supabase Storage)
- [ ] Relatórios financeiros avançados com gráficos interativos
- [ ] Gamificação de tarefas (pontos, conquistas)
- [ ] Integração IoT (dispositivos inteligentes)
- [ ] Modo offline com sincronização automática
- [ ] Temas personalizáveis (dark/light/auto)
- [ ] Exportação de dados (PDF, CSV)
- [ ] Integração com bancos (Open Banking)

## 🧪 Testes e Validação

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Executar testes (quando implementados)
npm test

# Cobertura de testes
npm run test:coverage

# Gerar tipos do Prisma (referência)
npx prisma generate
```

## 📦 Build para Produção

### Android

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB (Google Play)
eas build --platform android --profile production
```

### iOS

```bash
# Build para TestFlight
eas build --platform ios --profile preview

# Build para App Store
eas build --platform ios --profile production
```

## 🔍 Troubleshooting

### Erro: "DATABASE_URL not found"

O Prisma não é usado em runtime, apenas como referência do schema. O app usa Supabase diretamente.

### Erro: "Supabase client not initialized"

Verifique se `.env.local` existe e contém as variáveis corretas.

### Erro: "RLS policy violation"

Certifique-se de que o usuário está autenticado e pertence à casa que está tentando acessar.

## 📚 Documentação Adicional

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase JavaScript](https://supabase.com/docs/reference/javascript/introduction)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Equipe

Desenvolvido com ❤️ pela equipe Luma.

---

**Status do Projeto**: 🟢 MVP Completo + Features Avançadas

**Última Atualização**: Janeiro 2025

**Versão**: 1.0.0

## 🎨 Destaques de Design

O Luma implementa um design system moderno e sofisticado:

- **Paleta de Cores**: Gradientes dourados (#C28400, #8F6100) com acentos amarelos (#FFF44F)
- **Glassmorphism**: Efeitos de vidro fosco com transparências sutis
- **Animações Suaves**: React Native Reanimated v4 para interações fluidas
- **Mobile-First**: Layout otimizado para dispositivos móveis com experiência touch-friendly
- **Feedback Haptico**: Respostas táteis em ações importantes (Expo Haptics)

## 🚀 Novas Funcionalidades Implementadas

### Magic Input (Criação Assistida por IA)
Descreva o que precisa e a Luma cria automaticamente:
```
"Comprar pizza R$ 80 hoje" → Despesa criada com valor e data
"Limpar a sala amanhã" → Tarefa criada com data limite
```

### Speed Dial (Ações Rápidas)
Menu radial elegante que expande do botão "+":
- Nova Despesa
- Nova Tarefa
- (Expansível para mais ações)

### Menu de Usuário
Acesso rápido a:
- Meu Perfil
- Minha Casa
- Sair da Conta

## 👤 Usuário de Teste

| E-mail | Senha |
| --- | --- |
| `test.user@example.com` | `YourTestPassword123!` |

Crie um usuário de teste no seu projeto para automação de testes.


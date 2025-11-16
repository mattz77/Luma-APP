## Luma - Assistente Inteligente para Gestão de Casa

Luma é um aplicativo **mobile-first** que usa inteligência artificial para ajudar famílias a organizar **finanças**, **tarefas** e, em fases futuras, **dispositivos IoT**.  
Este repositório contém o app Expo, a modelagem de dados (Prisma) e os workflows n8n usados pela Luma.

---

## 🧩 Visão Geral da Arquitetura

- **App (frontend)**: `luma-app/`
  - Expo SDK 54 + Expo Router v6
  - React Native 0.81 + TypeScript
  - Zustand (estado global) + React Query (server state)
  - Reanimated v4 para animações
- **Backend-as-a-Service**: Supabase
  - Auth, Database (PostgreSQL), Storage, Realtime
  - Row Level Security (RLS) para multi-tenant por `house_id`
- **Camada de IA (Luma)**: n8n
  - Webhook `POST /webhook/luma/chat`
  - Agent Node conectado a LLM (OpenAI/Anthropic/DeepSeek)
  - Sub-workflows (tools) para tarefas específicas (financeiro, tarefas, etc.)
- **Modelagem**: Prisma (arquivo de referência em `luma-app/docs/luma_prisma_schema.txt`)

Arquitetura simplificada (do flowchart em `docs/flowchart mermaid.md`):

- App → Supabase (CRUD de dados da casa)
- App → n8n (mensagens para Luma)
- n8n ↔ Supabase (busca contexto da casa)
- n8n ↔ LLM (gera respostas inteligentes)
- n8n ↔ IoT (futuro: comandos para dispositivos)

---

## 📦 Estrutura de Pastas

Principais diretórios:

- `luma-app/` – app Expo (código de produção)
  - `app/` – rotas com Expo Router (auth, tabs, modals)
  - `components/` – componentes de UI e de features
  - `hooks/` – hooks React Query / Supabase / Luma
  - `stores/` – stores Zustand (`auth.store.ts`, etc.)
  - `services/` – serviços de acesso a dados (`expense.service`, `task.service`, etc.)
  - `lib/` – clientes (`supabase`, `n8n`), `query-client`, estilos utilitários
  - `types/` – tipos TypeScript (Supabase, modelos de domínio)
  - `supabase/` – migrations e edge functions (referência)
  - `docs/` – PRD, schema Prisma, flowcharts e prompts
- `Luma-workflows/` – JSON dos workflows n8n e guias de instalação

Para detalhes mais granularizados do app, veja o README específico em `luma-app/README.md`.

---

## 🧠 Domínio de Negócio (resumo do PRD)

Funcionalidades principais (MVP), segundo `docs/luma_prd.md`:

- **Gestão de Casa**
  - Criação de casa com código de convite
  - Papéis: Admin, Membro, Visualizador
  - Histórico de ações por membro
- **Gestão Financeira**
  - Registro de despesas com categorização por IA
  - Recorrência (contas mensais)
  - Divisão de despesas entre membros
  - Dashboards e relatórios (mensal/anual, categorias, alertas)
- **Gestão de Tarefas**
  - CRUD de tarefas (título, descrição, responsável, prazo, prioridade)
  - Status: Pendente, Em progresso, Concluída, Cancelada
  - Tarefas recorrentes e gamificação (pontos)
- **Assistente Luma (chat AI)**
  - Responde perguntas sobre finanças, tarefas e contexto da casa
  - Cria tarefas e registra despesas via conversa
  - Sugestões proativas (ex.: alerta de gastos acima da média)
- **Roadmap Futuro**
  - Integração IoT (aspiradores, assistentes de voz, câmeras, etc.)
  - Planejamento de refeições, lista de compras inteligente
  - Open Banking e analytics avançados

---

## 🗄️ Modelagem de Dados (Prisma / Supabase)

O arquivo `docs/luma_prisma_schema.txt` descreve a modelagem relacional usada no Supabase.  
Principais entidades:

- `User` / `users` – usuários autenticados
- `House` / `houses` – casas (multi-tenant core, com `invite_code`)
- `HouseMember` / `house_members` – vínculo usuário ↔ casa (com `role`)
- `ExpenseCategory` / `expense_categories` – categorias de despesas por casa
- `Expense` / `expenses` – despesas com:
  - `amount`, `description`, `expense_date`, categoria, recorrência, splits
- `ExpenseSplit` / `expense_splits` – divisão de despesas entre usuários
- `MonthlyBudget` / `monthly_budgets` – orçamento mensal por casa
- `Task` / `tasks` – tarefas (status, prioridade, tags, recorrência, pontos)
- `TaskComment` / `task_comments` – comentários em tarefas
- `Conversation` / `conversations` – histórico de mensagens com a Luma
- `Device` / `devices` e `DeviceAction` / `device_actions` – camada IoT futura
- `Notification` / `notifications` – notificações internas e push

Todas as tabelas são multi-tenant (campo `house_id`) e foram desenhadas para funcionar com **Row Level Security** no Supabase.

---

## 🔁 Fluxos Principais (Flowcharts)

Os fluxos em `docs/flowchart mermaid.md` descrevem:

- **Onboarding e Autenticação**
  - Primeira abertura → boas-vindas → escolha de método (email / Google / Apple)
  - Criação de perfil → criação de casa → geração de código de convite
  - Entrar em casa existente via código
- **Navegação Principal**
  - Dashboard → abas: Chat Luma, Finanças, Tarefas, Casa
- **Fluxo de Chat Luma**
  - Usuário envia mensagem → app monta payload (`house_id`, `user_id`, `message`, `context`)
  - Envia para `POST /webhook/luma/chat` (n8n)
  - n8n busca contexto (financeiro, tarefas, dispositivos), constrói prompt, chama LLM
  - Opcionalmente cria tarefas/despesas/dispositivo action
  - Resposta volta ao app + conversa salva em `conversations`
- **Fluxos de Finanças e Tarefas**
  - Criação/edição de despesas (upload de comprovante, split entre membros, marcar pago)
  - Board Kanban de tarefas (pendentes, em progresso, concluídas), comentários, pontos
- **Fluxos IoT (futuro)**
  - Descoberta, configuração e comandos para dispositivos, inclusive via Luma

Esses diagramas servem como referência de alto nível para garantir que as novas features respeitem os fluxos originais do produto.

---

## ▶️ Como Rodar Localmente

1. Entre na pasta do app:

   ```bash
   cd luma-app
   npm install
   ```

2. Configure as variáveis de ambiente (veja `luma-app/.env.local` como exemplo) com:

   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_N8N_WEBHOOK_URL`

3. Inicie o Expo:

   ```bash
   npm start       # menu interativo
   # ou
   npm run web    # modo web
   ```

4. Certifique-se de que:

   - O projeto Supabase correspondente está com o schema e RLS aplicados.
   - Os workflows n8n estão importados e ativados (ver `Luma-workflows/luma_installation_guide.md`).

---

## 🔐 Segurança e Privacidade

Conforme o PRD:

- Multi-tenant com isolamento por `house_id` + RLS.
- Dados criptografados em trânsito (TLS) e em repouso (infra Supabase).
- Foco em LGPD/GDPR: exportação de dados, controle de acesso por papel, logs de auditoria.

No repositório:

- Arquivos `.env` e scripts com chaves reais estão **ignorados** no `.gitignore`.
- Use suas próprias credenciais de desenvolvimento e produção.

---

## 📚 Documentação Complementar

- `luma-app/docs/luma_prd.md` – documento de produto completo (visão, funcionalidades, roadmap).
- `luma-app/docs/luma_prisma_schema.txt` – schema Prisma completo da base.
- `luma-app/docs/flowchart mermaid.md` – flowcharts de onboarding, Luma, finanças, tarefas e IoT.
- `luma-app/docs/n8n-agent.md` – guia de boas práticas para o agente n8n.
- `luma-app/docs/Prompt para Cursor AI - Projeto Luma.md` – prompt técnico para desenvolvimento assistido.

Para instruções mais detalhadas de instalação de infra (Supabase + n8n), use `Luma-workflows/luma_installation_guide.md`.

---

## 🤝 Contribuição

1. Crie uma branch (`git checkout -b feature/minha-feature`).
2. Implemente a mudança seguindo PRD, schema e flowcharts.
3. Garanta que o app inicia (`npm run web` ou `npm start`) sem erros.
4. Abra um Pull Request descrevendo claramente o impacto no produto (finanças, tarefas, Luma, IoT, etc.).



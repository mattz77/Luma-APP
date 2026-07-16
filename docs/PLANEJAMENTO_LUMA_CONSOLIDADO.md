# Luma APP — Planejamento Consolidado

> Documento gerado em 17/05/2026 a partir dos arquivos de planejamento do projeto.

---

## 1. Visão Geral do Produto

**Luma** é um aplicativo mobile-first de gestão doméstica com IA conversacional. Centraliza finanças, tarefas e membros da casa em um único ambiente colaborativo, com a Luma como assistente inteligente.

**Proposta de valor:**
- Centralização de finanças, tarefas e automações
- Assistente AI (Luma) com contexto familiar
- Colaboração entre membros da casa
- Arquitetura preparada para IoT (Fase 2+)

---

## 2. Arquitetura Técnica

### Frontend
- Expo SDK 54 + Expo Router v6
- React Native 0.81 + TypeScript
- Reanimated v4 (animações)
- GlueStack UI v2 (componentes)
- Suporte web via React Native Web

### Backend
- Supabase (Auth, Database, Storage, Realtime)
- PostgreSQL com RLS (Row Level Security) — isolamento multi-tenant por `house_id`
- Edge Functions para lógica serverless

### Camada de IA (n8n)
- n8n como orquestrador de workflows
- Arquitetura multi-agente: 1 orquestrador + 5 especialistas
  - **Tasks Agent** — criação e consulta de tarefas
  - **Finances Agent** — resumo financeiro e registro de despesas
  - **House Agent** — membros da casa
  - **Profile Agent** — gamificação (XP, streak) — só para menores
  - **General Agent** — capacidades gerais do app
- Guard rails em 3 camadas: Classifier → Delegate → Canned response
- Endpoint: `POST /webhook/luma-orchestrator`

### CI/CD (Azure DevOps)
Pipeline `azure-pipelines.yml` com 3 estágios:
1. **validate** — typecheck (TypeScript) + Jest unit tests + coverage
2. **build_preview** — EAS Build Android (profile preview) para PRs e branch `develop`
3. **build_production** — EAS Build Android + iOS (profile production) apenas para `main`

---

## 3. Funcionalidades Core (MVP)

### 3.1 Gestão de Casa ✅
- Criação de casa com código de convite automático
- Membros com níveis: Admin, Membro, Visualizador
- RPC `create_house_with_membership` para criação segura

### 3.2 Gestão Financeira ✅
- Registro de despesas com categorização
- Divisão de custos entre membros (`expense_splits`)
- Dashboard mensal com visão de gastos
- Módulo de orçamento (`budget.service.ts` + `budget.tsx`) — implementado recentemente
- Alertas de gastos acima da média (roadmap)

### 3.3 Gestão de Tarefas ✅
- CRUD completo: criar, editar, mudar status, excluir
- Kanban com colunas: Pendentes, Em andamento, Concluídas, Canceladas
- Tarefas recorrentes (roadmap)
- Gamificação: +10 XP ao concluir tarefa (apenas menores)

### 3.4 Assistente Luma ✅
- Chat conversacional integrado ao n8n
- Multi-agente com classificação automática de intent
- Contexto de casa passado no payload (`house_id`, `user_id`, `is_minor`)
- OUT_OF_SCOPE retorna resposta padrão (sem hallucination)

---

## 4. Estado Atual dos Testes

### Testes unitários (Jest)
- `lib/budgetUsageColor.test.ts` — testes do módulo de cores de orçamento
- `services/__tests__/budget.service.test.ts` — testes do serviço de orçamento
- Pipeline ADO executa Jest + publica resultados e coverage

### E2E (relatório Nov/2025)
| Módulo | Status |
|--------|--------|
| Login / Auth | ✅ Concluído |
| Gestão de Casa | ✅ Concluído |
| Finanças (CRUD) | ✅ Concluído |
| Tarefas (CRUD completo) | ✅ Concluído |
| Luma Chat | ✅ Concluído |
| Logout / Navegação | ✅ Concluído |

### Issues UX registradas
| Prioridade | Problema | Arquivo |
|------------|----------|---------|
| 🔴 Crítico | Layout Kanban quebrando em mobile (< 375px) | `app/(tabs)/tasks/index.tsx` |
| 🟡 Médio | Gramática nos empty states das tarefas | `app/(tabs)/tasks/index.tsx` |
| 🟡 Médio | Contraste do input de login/registro | `app/(auth)/login.tsx` |

---

## 5. Arquitetura de Dados

**Padrão multi-tenant:** Shared Database com `house_id` em todas as tabelas + RLS.

Entidades principais:
- `houses` — casas/residências
- `users` + `house_members` — usuários e membros por casa
- `expenses` + `expense_splits` — despesas e rateio
- `expense_categories` — categorias financeiras
- `tasks` — tarefas domésticas
- `conversations` — histórico com a Luma
- `game_profile` — XP e gamificação (menores)
- `devices` — dispositivos IoT (Fase 2)

---

## 6. Fluxo n8n ↔ App

```
Usuário → Chat Luma
  → POST /webhook/luma-orchestrator { house_id, user_id, message, is_minor }
  → Extract Context
  → Classify Intent (LLM — 1 token)
  → Switch: TASKS | FINANCES | HOUSE | PROFILE | GENERAL | OUT_OF_SCOPE
  → Specialist Agent (com tools específicas)
  → Clean Response (trata DELEGATE:OUT_OF_DOMAIN)
  → Save Conversation (Supabase)
  → Resposta ao app
```

---

## 7. Roadmap

### Fase 1 — MVP (12 semanas) ✅ Concluído
- Setup + autenticação
- CRUD casas + membros
- Gestão financeira
- Gestão de tarefas
- Integração n8n + Luma básica
- Testes + deploy beta

### Fase 2 — Pós-MVP (4–6 meses)
- Dashboard avançado com analytics
- Notificações push inteligentes
- Modo offline com sincronização
- Aprimoramento da Luma (contexto expandido)
- Pipeline ADO completo com build para iOS

### Fase 3 — Expansão (6–12 meses)
- Integração IoT (aspiradores, câmeras, termostatos, fechaduras)
- Automações por triggers
- API pública
- App para tablets / web desktop

---

## 8. KPIs de Sucesso

| KPI | Meta |
|-----|------|
| Retenção D7 / D30 | — |
| Tempo de resposta Luma | < 2 segundos |
| NPS | > 50 |
| Crash-Free Rate | > 99.5% |
| Casas com 2+ membros | crescimento MoM |

---

## 9. Branches e Segurança

- `main` — código sanitizado, público
- `private-config` — credenciais reais, nunca compartilhar
- `.env.local` nunca commitado
- Worktrees Claude: `quirky-chaplygin-9d9673` (sessão atual)

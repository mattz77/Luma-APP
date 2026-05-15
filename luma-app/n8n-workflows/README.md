# Luma — Workflows n8n

## Arquitetura multi-agente

`luma-orchestrator-multi-agent.json` substitui o agente único anterior por um orquestrador + 5 especialistas.

### Fluxo

```
POST /webhook/luma-orchestrator
  └─ Extract Context (house_id, user_id, message, is_minor)
  └─ Classify Intent  (LLM curto, retorna 1 token)
  └─ Switch by intent
      ├─ TASKS    → Tasks Agent     (tools: get_tasks, create_task)
      ├─ FINANCES → Finances Agent  (tools: get_financial_summary, create_expense)
      ├─ HOUSE    → House Agent     (tool:  get_house_members)
      ├─ PROFILE  → Profile Agent   (sem tools — gateia gamificação por is_minor)
      ├─ GENERAL  → General Agent   (capacidades do app)
      └─ OUT_OF_SCOPE → resposta canned
  └─ Merge → Clean → Save Conversation → Respond
```

### Guard rails (defesa em camadas)

1. **Classifier**: token `OUT_OF_SCOPE` para qualquer coisa fora dos 4 domínios.
2. **Specialists**: instruídos a retornar `DELEGATE:OUT_OF_DOMAIN` se receberem mensagem fora do seu domínio.
3. **Clean Response**: detecta `DELEGATE:OUT_OF_DOMAIN` e troca pela resposta canned.

### Gamificação

- Apenas o **Profile Agent** menciona XP/nível/streak.
- Tasks Agent menciona `+10 XP` ao concluir tarefa **somente se** `is_minor=true`.
- Adultos não veem nada de gamificação.
- O `is_minor` chega no payload via `lib/n8n.ts` (passado pelo app).

## Deploy

1. **Importar no n8n**: UI → Import from file → selecione `luma-orchestrator-multi-agent.json`.
2. **Substituir credenciais**: o nó `Save Conversation` referencia `PLACEHOLDER_SUPABASE_CRED` — troque pelo ID da credencial Supabase real do seu n8n.
3. **Ativar**: o workflow vem `active: false`. Ative apenas após testar manualmente.
4. **Tools sub-workflows**: já existem (IDs reusados do workflow anterior). Confirme que estão ativos:
   - `L64eapJkSiGVqk8M` (Tasks Tool)
   - `BNClJiGssddwxd4l` (Create Task Tool)
   - `cGyItSRsdZNgckJD` (Financial Summary Tool)
   - `0PIUT3hZLLDhxmmJ` (Create Expense Tool)
   - `YwDx7YchL6xmZYhg` (House Members Tool)
5. **LLM (Google Gemini)**:
   - Primary: `models/gemini-flash-latest` (classifier + specialists)
   - Fallback: `models/gemma-4-31b-it` (mesmo padrão do workflow `Briefing Generator` — id `LlYkFapJwe2ywBDP`)
   - Credencial n8n: `googlePalmApi` id `me7BXMU2YlBLpm9Y` ("Google Gemini(PaLM) Api account"). Ajuste se sua instância usar outro id.

## Migração do app

O `lib/n8n.ts` já foi atualizado:
- Endpoint: `/webhook/luma-chat-enhanced` → `/webhook/luma-orchestrator`
- Payload: ganhou `context.is_minor`

Mantenha o workflow antigo ativo em paralelo até validar o novo. Para rollback, reverta o endpoint em `lib/n8n.ts`.

## Testes manuais sugeridos

| Mensagem | Intent esperada | Resultado esperado |
|----------|-----------------|--------------------|
| "Crie tarefa lavar louça" | TASKS | tarefa criada via tool |
| "Quanto gastei esse mês?" | FINANCES | resumo via get_financial_summary |
| "Quem mora aqui?" | HOUSE | lista de membros |
| "Quantos pontos eu tenho?" (menor) | PROFILE | retorna XP do game_profile |
| "Quantos pontos eu tenho?" (adulto) | PROFILE | informa que conquistas só p/ menores |
| "Qual a capital da França?" | OUT_OF_SCOPE | resposta canned |
| "Me conte uma piada" | OUT_OF_SCOPE | resposta canned |

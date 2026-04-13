# Playbook: regras do Cursor (`.cursor/rules`) — modelo genérico

Este documento descreve **como as project rules estão organizadas neste repositório** (como referência) e **o que outro agente ou time precisa saber** para replicar um conjunto parecido em outros projetos e linguagens. Não substitui a documentação oficial do produto; comportamentos de UI do Cursor podem evoluir.

---

## 1. Objetivo das project rules

As rules orientam o assistente de IA **dentro do contexto do repositório**: fluxo de trabalho, proibições, convenções de linguagem na UI, segurança, qualidade, integrações (MCP), commits, e regras **específicas de stack ou pastas** (por exemplo só certos tipos de arquivo).

**Separação de fontes de instrução (ordem útil para o time):**

| Fonte | Onde costuma ficar | Papel típico |
|--------|---------------------|--------------|
| **Project rules** | `.cursor/rules/*.mdc` | Padrões do **código deste repo**, convenções de domínio, escopo por arquivo (`globs`). |
| **User rules** | Preferências do usuário no Cursor | Preferências pessoais que valem em vários projetos. |
| **Agent Skills** | `SKILL.md` (skills instaladas) | Procedimentos reutilizáveis (ex.: fluxo de PR, hooks). |
| **Documentação no repo** | `README`, `docs/`, ADRs | Contexto humano, histórico, decisões. |

Regras do projeto devem **complementar** documentação e skills, não duplicar tudo linha a linha.

---

## 2. Localização e formato

- **Pasta:** `.cursor/rules/` na raiz do repositório (ou do workspace que o Cursor abre).
- **Extensão:** `.mdc` (Markdown com metadados no topo).
- **Estrutura de um arquivo:** bloco **YAML frontmatter** (`---` … `---`) + corpo em Markdown.

### 2.1 Campos comuns no frontmatter

Campos usados neste repositório (padrão atual):

| Campo | Significado |
|--------|-------------|
| `description` | Resumo curto do que a rule cobre (ajuda humanos e busca). |
| `alwaysApply` | `true` = considerada em contextos amplos; `false` = só quando combinar com `globs` (ou política do produto). |
| `globs` | Padrão glob de caminhos (ex.: `"**/*.tsx"`) para limitar a rule a certos arquivos. |

**Combinações típicas:**

- **Global ao projeto:** `alwaysApply: true` e **sem** `globs` — workflow, segurança, idioma da UI, lista de proibições, identidade do produto.
- **Por tipo de arquivo:** `alwaysApply: false` + `globs: "**/*.extensao"` — padrões só para aquele ecossistema (UI, testes, SQL, etc.).

Outros campos podem existir conforme versão do Cursor; ao criar rules novas, confira a documentação atual do editor.

---

## 3. Como este repositório separa as rules (mapa conceitual)

Aqui a separação é **por responsabilidade**, não por “um arquivo gigante”. Os nomes dos arquivos seguem um prefixo do projeto (`worc-*.mdc`); em outro projeto use o prefixo do produto ou um prefixo neutro (`project-`, `app-`).

| Categoria | Escopo típico (`alwaysApply` / `globs`) | Conteúdo esperado |
|-----------|------------------------------------------|-------------------|
| **Fluxo de trabalho** | Global | Passos: entender → verificar stack → planejar → implementar → testar → revisar. |
| **Identidade do produto** | Global | Nome do sistema, domínio de negócio, stack autorizada, limites de novas dependências. |
| **Segurança** | Global | Segredos, auth em endpoints, confirmação na UI para ações sensíveis, onde fica config. |
| **Lista explícita de proibições** | Global | Curto e verificável: o que o agente nunca deve fazer. |
| **Linguagem** | Global | Idioma da UI vs código vs mensagens de commit (se forem políticas fixas do time). |
| **Qualidade de código** | Global | Legibilidade, DRY, quando consultar documentação oficial / MCP de referência. |
| **Convenções de commits** | Global | Formato (ex.: Conventional Commits), idioma da descrição, uso de ferramentas de geração de mensagem. |
| **Persistência / SQL / migrations** | Global ou por `globs` `*.sql` | Onde versionar scripts, idempotência, proibições (ex.: “sem migration automática X”). |
| **Camada de UI** | `globs` nos arquivos da UI | Validação, mensagens, confirmações, acessibilidade básica. |
| **Camada de linguagem/framework** | `globs` nos fontes (ex.: `**/*.cs`, `**/*.go`) | DI, erros, padrões de nomeação da stack. |
| **Domínio técnico** | Global ou `globs` | PDF, relatórios, filas, etc. — só se for relevante ao projeto. |
| **Ferramentas externas (MCP)** | Global | Quando **obrigar** o uso de um MCP (Excel, browser, docs), com escopo claro. |

Arquivos **específicos de uma linguagem ou framework** devem usar `globs` para não poluir o contexto de repositórios poliglotas ou de times que só mexem em parte do mono-repo.

---

## 4. Princípios para projetar rules em qualquer stack

1. **Uma responsabilidade por arquivo (ou por grupo coeso)**  
   Facilita manutenção e revisão: segurança não misturada com detalhe de formatação de um único framework, salvo quando for inevitável.

2. **Global = poucas regras estáveis**  
   O que muda pouco: segurança, workflow, idioma, commits, proibições.

3. **`globs` = detalhe que muda com o tipo de arquivo**  
   Ex.: regras de componentes de UI só em `**/*.vue`, `**/*.tsx`, `**/*.razor`, etc.

4. **Proibições em lista própria**  
   Um arquivo curto “nunca faça X” reduz ambiguidade e é fácil de checar em code review.

5. **Evitar duplicação contraditória**  
   Se `language.mdc` diz “UI em inglês” e `ui.mdc` disser outra coisa, o agente oscila. Uma fonte de verdade por tópico.

6. **Ligar integrações ao trabalho real**  
   Regras do tipo “use o MCP X para Y” só fazem sentido se o time realmente tiver o MCP e o fluxo for recorrente.

7. **Idioma das rules**  
   Pode ser o idioma do time (ex.: pt-BR) mesmo quando a UI do produto for outra língua — o importante é consistência e clareza para humanos e agentes.

---

## 5. Template mínimo de um arquivo `.mdc`

Substitua os placeholders por convenções do **seu** projeto.

```markdown
---
description: [Uma linha: o que esta rule garante]
alwaysApply: true
---

# [Título curto]

- Ponto acionável 1.
- Ponto acionável 2.
```

Com escopo por arquivo:

```markdown
---
description: [O que cobre]
globs: "**/*.[ext]"
alwaysApply: false
---

# [Título]

- ...
```

---

## 6. Checklist para outro agente / outro repositório

- [ ] Confirmar pasta `.cursor/rules/` e extensão `.mdc`.
- [ ] Definir quais rules são **globais** (`alwaysApply: true`) vs **por glob**.
- [ ] Escolher prefixo de nomes de arquivo consistente (`projeto-*` ou por domínio `security-*`, `workflow-*`).
- [ ] Escrever **identidade do produto** (nome, domínio, stack aprovada, limites de dependências).
- [ ] Escrever **segurança** (segredos, auth, dados sensíveis em commit).
- [ ] Escrever **proibições** explícitas em arquivo dedicado.
- [ ] Alinhar **idioma da UI**, **idioma do código** e **idioma dos commits** com o produto e o time.
- [ ] Para cada linguagem/framework principal, criar rule com `globs` adequados **sem** acoplar outras linguagens.
- [ ] Documentar **persistência** (scripts SQL, migrations, ORM) conforme a política do time — genérico: “onde versionar”, “idempotência”, “o que é proibido”.
- [ ] Se houver MCPs obrigatórios, uma rule curta **quando** usar e **o que evitar** (ex.: não reinventar leitura de Excel se existe MCP).
- [ ] Revisar duplicatas e conflitos entre arquivos.
- [ ] (Opcional) Referenciar no `README` ou em `docs/` que o repositório tem project rules e onde estão.

---

## 7. Inventário — Luma-APP (`.cursor/rules/`)

Arquivos atuais neste repositório (prefixo `luma-*`). Cada `.mdc` usa frontmatter com `description`, `alwaysApply` e, quando aplicável, `globs`.

| Arquivo | Função |
|---------|--------|
| `luma-workflow.mdc` | Fluxo (entender → implementar → revisar), comandos em linguagem natural e formato de resposta. |
| `luma-project-identity.mdc` | Produto Luma, stack (Expo 54, Supabase, n8n), guias `docs/mpc-guides/`, roadmap MVP. |
| `luma-security.mdc` | `house_id`/RLS, integridade do app, exemplo seguro vs inseguro. |
| `luma-forbidden.mdc` | Lista explícita do que o agente não deve fazer. |
| `luma-language.mdc` | Idioma da comunicação com o time e convenções no repo. |
| `luma-commit-conventions.mdc` | Conventional Commits em português (BR) e UTF-8. |
| `luma-code-quality.mdc` | TypeScript, checklist antes de entregar, checklist de PR. |
| `luma-sql-prisma.mdc` | Prisma, SQL Supabase, índices multi-tenant (`globs`: `**/*.prisma`, `**/supabase/**/*.sql`). |
| `luma-ui-expo.mdc` | Expo Router, Reanimated, FlashList, estado (`globs`: `luma-app/**/*.tsx`, `luma-app/**/*.ts`). |
| `luma-n8n-webhooks.mdc` | App ↔ n8n (webhook, JWT/HMAC, erros, rate limit). |
| `luma-n8n-mcp.mdc` | Uso de ferramentas MCP do n8n (workflows, validação); `alwaysApply: false`. |
| `luma-excel-mcp.mdc` | Priorizar MCP Excel para planilhas/CSV quando aplicável (`globs` em `*.xlsx`, etc.). |

**Modelo genérico (outros repositórios):** a mesma **estrutura lógica** pode usar prefixo neutro (`project-*`, `worc-*`, …), trocando `globs` e conteúdo (ex.: rules só para `*.cs`, `*.go`, PDF, etc.).

---

## 8. Manutenção

- **Quando atualizar:** mudança de arquitetura, nova ferramenta obrigatória, política de segurança, idioma da UI, ou erro recorrente de agentes.
- **Como revisar:** pequenos PRs por tema; evitar um único arquivo monolítico que ninguém edita.
- **Versionamento:** as rules viajam com o Git como qualquer código.

---

*Documento gerado como base para replicação de project rules em outros repositórios. Ajuste nomes, `globs` e políticas ao contexto de cada produto.*

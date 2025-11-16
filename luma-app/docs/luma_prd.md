# PRD - Luma: Assistente Inteligente para Gestão de Casa

## 1. Visão Geral do Produto

**Luma** é um aplicativo mobile-first de gestão doméstica que utiliza inteligência artificial para auxiliar famílias no gerenciamento de finanças, tarefas e, futuramente, dispositivos IoT conectados. O app centraliza todas as informações da casa em um ambiente compartilhado entre membros da família.

### 1.1 Proposta de Valor

- **Centralização**: Único ponto de controle para finanças, tarefas e automações domésticas
- **Inteligência**: Assistente AI conversacional (Luma) que compreende contexto familiar
- **Colaboração**: Compartilhamento de informações entre membros da casa
- **Escalabilidade**: Preparado para integração futura com dispositivos IoT

## 2. Arquitetura Técnica

### 2.1 Frontend (Mobile-First)

- **Expo SDK 54** + **Expo Router v6**
- **React Native 0.81** + **TypeScript**
- **Reanimated v4** para animações fluidas
- **NativeUI Components** para interface premium
- **Expo Notifications** para alertas e lembretes
- **Suporte Web**: Renderização via React Native Web

### 2.2 Backend

- **Supabase** (Auth, Database, Storage, Realtime)
- **PostgreSQL com PostGIS** para queries geoespaciais
- **Edge Functions** para lógica serverless
- **Row Level Security (RLS)** para isolamento multi-tenant

### 2.3 Camada de IA

- **n8n** como orquestrador de workflows AI
- **Webhook Triggers** para comunicação app ↔ n8n
- **AI Agent Node** conectado a LLM (OpenAI/Anthropic)
- **Knowledge Base** com contexto da casa (finanças, tarefas, dispositivos)

## 3. Funcionalidades Core (MVP)

### 3.1 Gestão de Casa

**Criar Casa**

- Usuário cria uma casa ao entrar pela primeira vez
- Geração automática de código de convite
- Proprietário tem permissões administrativas

**Adicionar Membros**

- Convite via código ou link
- Níveis de permissão: Admin, Membro, Visualizador
- Histórico de ações por membro

### 3.2 Gestão Financeira

**Registro de Despesas**

- Categorização automática via AI (aluguel, luz, água, internet, alimentação)
- Upload de comprovantes/fotos
- Divisão de custos entre membros
- Recorrência de contas mensais

**Relatórios Inteligentes**

- Dashboard com visão mensal/anual
- Comparativo de gastos por categoria
- Alertas de gastos acima da média
- Previsão de despesas futuras

### 3.3 Gestão de Tarefas

**Criação de Tarefas**

- Título, descrição, responsável, prazo
- Prioridade (baixa, média, alta, urgente)
- Tags personalizadas
- Tarefas recorrentes (diárias, semanais, mensais)

**Acompanhamento**

- Status: Pendente, Em Progresso, Concluída
- Notificações antes do prazo
- Histórico de conclusões
- Gamificação (pontos por tarefa concluída)

### 3.4 Assistente Luma (AI Conversacional)

**Capacidades Principais**

```
Exemplos de interação:

Usuário: "Como está a situação financeira este mês?"
Luma: "Olá! 💰 Até agora vocês gastaram R$ 3.450 de um orçamento de R$ 4.000 (86%). 
As maiores despesas foram: Aluguel (R$ 1.500), Supermercado (R$ 980) e Energia (R$ 340).
Ainda restam R$ 550 para os próximos 10 dias."

Usuário: "Quais as tarefas dessa semana?"
Luma: "Aqui estão as tarefas desta semana: ✅ Limpeza da sala (Maria - Concluída) 
📋 Fazer compras (João - Pendente, vence amanhã) ⚠️ Pagar conta de luz (Você - Atrasada 2 dias)"
```

**Funcionalidades**

- Análise de contexto histórico da casa
- Respostas em linguagem natural
- Sugestões proativas (ex: "A conta de água está 30% acima do normal")
- Criação de tarefas via voz/texto
- Registro de despesas via conversa

## 4. Funcionalidades Futuras (Roadmap)

### 4.1 Integração IoT (Fase 2)

**Dispositivos Suportados**

- Aspiradores robôs (Roomba, Xiaomi, Roborock)
- Assistentes virtuais (Alexa, Google Home)
- Câmeras de segurança
- Termostatos inteligentes
- Fechaduras eletrônicas

**Comandos Exemplo**

```
Usuário: "Luma, gostaria que você limpe o quarto."
Luma: [Analisa dispositivos disponíveis]
      [Encontra Roomba na sala de estar]
      "Entendido! Vou enviar o Roomba para limpar o quarto. 
      Tempo estimado: 25 minutos. 🤖"
      
Se não houver dispositivo:
Luma: "Desculpe, não encontrei nenhum aspirador robô conectado. 
      Você pode adicionar um nas Configurações > Dispositivos."
```

### 4.2 Recursos Adicionais

- Planejamento de refeições com IA
- Lista de compras inteligente (baseada em histórico)
- Controle de estoque de despensa
- Integração com bancos (Open Banking)
- Manutenção preventiva de eletrodomésticos

## 5. Arquitetura de Dados

### 5.1 Padrão Multi-Tenant

**Estratégia**: Shared Database with Tenant Identifier

- Todas as tabelas possuem campo `house_id`
- Row Level Security (RLS) no PostgreSQL
- Isolamento lógico via políticas de acesso
- Queries automáticas filtradas por casa

### 5.2 Entidades Principais

- **Houses**: Casas/residências
- **Users**: Usuários do sistema
- **HouseMembers**: Relacionamento usuário ↔ casa
- **Expenses**: Despesas financeiras
- **ExpenseCategories**: Categorias de despesas
- **Tasks**: Tarefas domésticas
- **Conversations**: Histórico com Luma
- **Devices**: Dispositivos IoT (futuro)

## 6. Integração n8n ↔ App

### 6.1 Fluxo de Comunicação

```
1. Usuário envia mensagem à Luma no app
2. App dispara webhook POST → n8n
3. n8n recebe: { user_id, house_id, message, context }
4. n8n Agent Node:
   - Consulta banco de dados (via Supabase API)
   - Busca contexto relevante (últimas conversas, dados da casa)
   - Envia prompt enriquecido para LLM
5. LLM processa e retorna resposta estruturada
6. n8n envia resposta → webhook do app
7. App exibe resposta da Luma ao usuário
```

### 6.2 Endpoints n8n

```
POST /webhook/luma/chat
Body: {
  "house_id": "uuid",
  "user_id": "uuid",
  "message": "Como está a situação financeira?",
  "context": {
    "current_month": "2025-11",
    "user_role": "admin"
  }
}

Response: {
  "response": "Olá! 💰 Até agora vocês...",
  "metadata": {
    "processing_time_ms": 850,
    "sources_used": ["expenses", "budgets"]
  }
}
```

## 7. Experiência do Usuário

### 7.1 Onboarding

1. **Tela de Boas-Vindas**: Animação explicando o conceito
2. **Autenticação**: Email/senha ou social login (Google, Apple)
3. **Criação da Casa**: Nome, endereço (opcional), foto
4. **Tutorial Interativo**: Guia de 3 etapas com a Luma
5. **Primeira Interação**: "Como posso ajudar você hoje?"

### 7.2 Navegação Principal

- **Home**: Dashboard com resumo financeiro + próximas tarefas
- **Chat Luma**: Tela de conversa com a assistente
- **Finanças**: Lista de despesas + gráficos
- **Tarefas**: Board estilo Kanban
- **Casa**: Membros, configurações, dispositivos
- **Perfil**: Dados pessoais, notificações, tema

### 7.3 Design System

- **Cores**: Tema claro/escuro
- **Tipografia**: Inter (sans-serif moderna)
- **Ícones**: Phosphor Icons (consistência)
- **Animações**: Micro-interações com Reanimated
- **Feedback**: Loading states, empty states, error states

## 8. Segurança e Privacidade

### 8.1 Autenticação

- JWT tokens com refresh automático
- Autenticação multifator (opcional)
- Biometria (Face ID / Touch ID)

### 8.2 Autorização

- Row Level Security (RLS) no Supabase
- Políticas baseadas em `house_id` + `user_id`
- Logs de auditoria para ações administrativas

### 8.3 Dados Sensíveis

- Criptografia em repouso (AES-256)
- Criptografia em trânsito (TLS 1.3)
- LGPD/GDPR compliance
- Exportação de dados sob demanda

## 9. Métricas de Sucesso

### 9.1 KPIs Primários

- **Retenção D7/D30**: % usuários ativos após 7/30 dias
- **Engajamento com Luma**: Média de mensagens/dia por usuário
- **Tarefas Concluídas**: % conclusão no prazo
- **Despesas Registradas**: Média por casa/mês

### 9.2 KPIs Secundários

- **Tempo de Resposta Luma**: < 2 segundos
- **NPS (Net Promoter Score)**: Meta > 50
- **Casas com 2+ Membros**: % de adoção colaborativa
- **Crash-Free Rate**: > 99.5%

## 10. Roadmap de Desenvolvimento

### Fase 1 (MVP - 12 semanas)

- ✅ Semanas 1-2: Setup projeto + autenticação
- ✅ Semanas 3-4: CRUD casas + membros
- ✅ Semanas 5-6: Gestão financeira
- ✅ Semanas 7-8: Gestão de tarefas
- ✅ Semanas 9-10: Integração n8n + Luma básica
- ✅ Semanas 11-12: Testes + deploy beta

### Fase 2 (4-6 meses pós-MVP)

- Dashboard avançado com analytics
- Notificações push inteligentes
- Modo offline com sincronização
- Aprimoramento da Luma (contexto expandido)

### Fase 3 (6-12 meses)

- Integração IoT (primeira wave de dispositivos)
- Automações baseadas em triggers
- API pública para integrações externas
- App para tablets/web desktop
# 🏠 Luma AI Assistant - Guia Completo de Instalação

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Supabase](#configuração-do-supabase)
3. [Configuração do n8n](#configuração-do-n8n)
4. [Instalação dos Workflows](#instalação-dos-workflows)
5. [Configuração do App Mobile](#configuração-do-app-mobile)
6. [Testes](#testes)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### Serviços Necessários
- ✅ **Supabase** (Banco de dados + Storage)
- ✅ **n8n** (rodando em Docker ou cloud)
- ✅ **OpenAI API Key** (GPT-4)
- ✅ **App Mobile** (Expo)

### Versões Recomendadas
```bash
n8n: v1.79.0 ou superior
Node.js: v20.x
Docker: v24.x (se usando Docker)
```

---

## 🗄️ Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiI...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiI...` (usar no n8n)

### 2. Executar Schema SQL

Cole o schema Prisma fornecido no Supabase SQL Editor:

```sql
-- Execute o schema completo do luma_prisma_schema.txt
-- Inclui todas as tabelas: users, houses, expenses, tasks, etc.
```

### 3. Habilitar Row Level Security (RLS)

```sql
-- Exemplo de política para expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their house expenses"
  ON expenses FOR SELECT
  USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Repita para todas as tabelas
```

### 4. Criar Índices para Performance

```sql
-- Índices essenciais
CREATE INDEX idx_expenses_house_date ON expenses(house_id, expense_date DESC);
CREATE INDEX idx_tasks_house_status ON tasks(house_id, status);
CREATE INDEX idx_conversations_house_user ON conversations(house_id, user_id, created_at DESC);
```

---

## 🔧 Configuração do n8n

### Opção 1: Docker (Recomendado)

```bash
# docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=seu-password-forte
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://seu-dominio.com/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
```

```bash
# Iniciar n8n
docker-compose up -d

# Ver logs
docker-compose logs -f n8n
```

### Opção 2: NPM

```bash
npm install -g n8n

# Iniciar
n8n start
```

### Configurar Credenciais no n8n

#### 1. Supabase Credentials
- **Nome**: `Supabase Luma`
- **Host**: `https://seu-projeto.supabase.co`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiI...`

#### 2. OpenAI Credentials
- **Nome**: `OpenAI Luma`
- **API Key**: `sk-proj-...`

---

## 📦 Instalação dos Workflows

### Ordem de Instalação

```
1️⃣ Tool Workflows (sub-workflows)
2️⃣ Workflow Principal com Tools
```

### 1. Importar Tool Workflows

Para cada tool no arquivo `luma_tool_workflows.json`:

1. n8n → **Workflows** → **Import from File**
2. Cole o JSON do workflow
3. Clique em **Save**
4. **Ative o workflow** (toggle no topo)
5. **Copie o Workflow ID** da URL

Workflows criados:
- ✅ Tool - Financial Summary (`ID: abc-123`)
- ✅ Tool - Get Tasks (`ID: def-456`)
- ✅ Tool - Create Task (`ID: ghi-789`)
- ✅ Tool - Create Expense (`ID: jkl-012`)
- ✅ Tool - Get House Members (`ID: mno-345`)

### 2. Configurar IDs nos Tool Workflow Nodes

No workflow principal (`luma_workflow_with_tools.json`):

1. Abra o workflow principal
2. Para cada **Tool Workflow** node:
   - Financial Summary Tool → `workflowId: "abc-123"`
   - Tasks Tool → `workflowId: "def-456"`
   - Create Task Tool → `workflowId: "ghi-789"`
   - Create Expense Tool → `workflowId: "jkl-012"`
   - House Members Tool → `workflowId: "mno-345"`
3. **Save**
4. **Ativar workflow**

### 3. Obter Webhook URL

1. Abra o workflow principal
2. Clique no node **"When Chat Message Received"**
3. Copie a **Production URL**:
   ```
   https://seu-n8n.com/webhook/luma/chat
   ```

---

## 📱 Configuração do App Mobile

### 1. Configurar Variáveis de Ambiente

Crie `.env` no projeto Expo:

```bash
# .env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/luma/chat
```

### 2. Implementar Cliente Luma

```typescript
// app/services/lumaClient.ts
import axios from 'axios';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export interface LumaRequest {
  house_id: string;
  user_id: string;
  message: string;
}

export interface LumaResponse {
  success: boolean;
  response: string;
  metadata: {
    session_id: string;
    processing_time_ms: number;
    tools_used: string[];
    model: string;
  };
}

export const sendMessageToLuma = async (
  request: LumaRequest
): Promise<LumaResponse> => {
  try {
    const response = await axios.post<LumaResponse>(
      WEBHOOK_URL,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30s timeout
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Luma error:', error);
    throw new Error('Falha ao comunicar com Luma');
  }
};
```

### 3. Implementar UI do Chat

```typescript
// app/screens/ChatScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text } from 'react-native';
import { sendMessageToLuma } from '../services/lumaClient';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const { user, currentHouse } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessageToLuma({
        house_id: currentHouse.id,
        user_id: user.id,
        message: input,
      });

      const lumaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, lumaMessage]);
    } catch (error) {
      console.error(error);
      // Mostrar erro na UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.isUser ? 'flex-end' : 'flex-start',
              backgroundColor: item.isUser ? '#007AFF' : '#E5E5EA',
              padding: 12,
              borderRadius: 16,
              margin: 8,
              maxWidth: '80%',
            }}
          >
            <Text
              style={{
                color: item.isUser ? 'white' : 'black',
              }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', padding: 16 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte algo à Luma..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        />
        <Button
          title="Enviar"
          onPress={sendMessage}
          disabled={loading}
        />
      </View>
    </View>
  );
}
```

---

## 🧪 Testes

### 1. Testar Tool Workflows

Para cada tool workflow:

```bash
# Via n8n UI
1. Abra o workflow tool
2. Clique em "Execute Workflow"
3. Cole o JSON de teste:

# Financial Summary Tool
{
  "house_id": "seu-house-id-aqui"
}

# Tasks Tool
{
  "house_id": "seu-house-id-aqui",
  "status_filter": "PENDING"
}

# Create Task Tool
{
  "house_id": "seu-house-id-aqui",
  "created_by_id": "seu-user-id-aqui",
  "title": "Teste de Tarefa",
  "priority": "MEDIUM"
}
```

### 2. Testar Workflow Principal

```bash
# Via cURL
curl -X POST https://seu-n8n.com/webhook/luma/chat \
  -H "Content-Type: application/json" \
  -d '{
    "house_id": "seu-house-id-aqui",
    "user_id": "seu-user-id-aqui",
    "message": "Como está nossa situação financeira?"
  }'

# Resposta esperada:
{
  "success": true,
  "response": "Olá! 💰 Este mês vocês gastaram...",
  "metadata": {
    "session_id": "house_user",
    "processing_time_ms": 1250,
    "tools_used": ["get_financial_summary"],
    "model": "gpt-4o"
  }
}
```

### 3. Casos de Teste

#### Consulta Financeira
```
Mensagem: "Como estão os gastos este mês?"
Esperado: Resumo com total, orçamento, categorias
```

#### Criar Tarefa
```
Mensagem: "Crie uma tarefa para comprar leite amanhã"
Esperado: Confirmação com ID da tarefa criada
```

#### Listar Tarefas
```
Mensagem: "Quais tarefas pendentes temos?"
Esperado: Lista de tarefas com status e prazos
```

#### Registrar Despesa
```
Mensagem: "Registre uma despesa de R$ 150 para conta de luz"
Esperado: Confirmação com ID da despesa
```

---

## 🔧 Troubleshooting

### Erro: "Webhook não encontrado"

**Causa**: Workflow não está ativo ou URL incorreta

**Solução**:
```bash
1. Verifique se o workflow está ATIVO (toggle verde)
2. Confirme a URL do webhook no node
3. Teste com cURL diretamente
```

### Erro: "Supabase credentials invalid"

**Causa**: Service Role Key incorreta ou projeto errado

**Solução**:
```bash
1. Vá no Supabase → Settings → API
2. Copie a Service Role Key (não a Anon Key)
3. Reconfigure as credenciais no n8n
4. Salve e teste novamente
```

### Erro: "OpenAI rate limit"

**Causa**: Muitas requisições ou quota excedida

**Solução**:
```bash
1. Verifique seu plano OpenAI
2. Adicione rate limiting no app
3. Configure retry com backoff
```

### Erro: "Tool workflow not found"

**Causa**: IDs dos workflows tools incorretos

**Solução**:
```bash
1. Abra cada tool workflow
2. Copie o ID da URL (ex: 123abc)
3. Atualize os Tool Workflow nodes no workflow principal
4. Salve e reative
```

### Luma não está usando os tools

**Causa**: System message não está instruindo corretamente

**Solução**:
```bash
1. Verifique o system message do AI Agent
2. Certifique-se que os tools estão conectados
3. Teste com comandos explícitos ("use a ferramenta X")
```

### Performance lenta

**Soluções**:
```bash
1. Adicione índices no Supabase
2. Limite de registros nas queries (LIMIT 50)
3. Use cache quando apropriado
4. Configure timeout adequado (30s)
```

---

## 📊 Monitoramento

### Logs do n8n

```bash
# Docker
docker-compose logs -f n8n

# Ver execuções
n8n → Executions → Ver últimas execuções
```

### Métricas Importantes

- ⏱️ **Tempo de Resposta**: < 3s ideal
- ✅ **Taxa de Sucesso**: > 95%
- 🔄 **Tools Usados**: Verificar quais tools são mais usados
- 💬 **Conversas/dia**: Monitorar engajamento

### Dashboard Supabase

```sql
-- Conversas por dia
SELECT DATE(created_at) as date, COUNT(*) as count
FROM conversations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Tools mais usados
SELECT
  metadata->>'tools_used' as tools,
  COUNT(*) as count
FROM conversations
WHERE metadata->>'tools_used' IS NOT NULL
GROUP BY tools
ORDER BY count DESC;
```

---

## 🚀 Próximos Passos

### Melhorias Futuras

1. **Adicionar mais tools**:
   - Update Task
   - Delete Expense
   - Get Member Tasks
   - Budget Analysis

2. **Implementar notificações**:
   - Push notifications via Expo
   - Email notifications via SendGrid

3. **Adicionar IoT**:
   - Integração com dispositivos
   - Comandos de automação

4. **Analytics avançados**:
   - Dashboard de insights
   - Previsões com ML

5. **Multi-idioma**:
   - Suporte para inglês e espanhol

---

## 📚 Recursos Adicionais

- [Documentação n8n](https://docs.n8n.io)
- [Documentação Supabase](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Expo Documentation](https://docs.expo.dev)

---

## 💡 Dicas Finais

1. **Backup Regular**: Configure backup automático do Supabase
2. **Versionamento**: Use Git para versionar workflows
3. **Staging**: Tenha ambiente de teste antes de prod
4. **Segurança**: Use HTTPS sempre, valide inputs
5. **Custos**: Monitore custos OpenAI e Supabase

---

**🎉 Pronto! Sua Luma AI Assistant está configurada e pronta para uso!**

Para suporte, entre em contato ou abra uma issue no repositório.
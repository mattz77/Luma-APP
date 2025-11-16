# 🚀 Como Configurar Groq (Gratuito) no n8n

## ✅ Por que Groq?

- **100% Gratuito** - Sem necessidade de cartão de crédito
- **Limite generoso** - ~30 requisições por minuto (suficiente para testes)
- **Muito rápido** - Inferência ultra-rápida
- **Fácil configuração** - Apenas API Key

## 📋 Passo a Passo

### 1. Obter API Key do Groq

1. **Acesse:** https://console.groq.com/
2. **Crie uma conta** (pode usar Google/GitHub)
3. **Vá em "API Keys"** (menu lateral ou em Settings)
4. **Clique em "Create API Key"**
5. **Dê um nome** (ex: "Luma Assistant")
6. **Copie a API Key** (começa com `gsk_...`)
   - ⚠️ **IMPORTANTE:** Copie imediatamente, ela só aparece uma vez!

### 2. Criar Credencial no n8n

1. **No n8n, acesse:** http://localhost:5678
2. **Vá em Credentials** (menu lateral esquerdo)
3. **Clique em "Add Credential"** (botão no topo)
4. **Procure por "Groq"** na busca
5. **Selecione "Groq API"**
6. **Cole sua API Key** no campo "API Key"
7. **Dê um nome** (ex: "Groq account")
8. **Clique em "Save"** (botão vermelho no topo)

### 3. Atualizar o Workflow

O workflow será atualizado para usar Groq em vez de DeepSeek/OpenAI.

### 4. Testar

Após configurar, teste o webhook:

```powershell
.\debug_webhook.ps1
```

## ⚠️ Limites do Groq

- **Rate Limit:** ~30 requisições por minuto
- **Sem limite diário claro** (pode variar)
- **Modelos disponíveis:** Llama 3, Mixtral, Qwen
- **Se exceder limites:** Pode receber erro 429 (Too Many Requests)

## 💡 Dica

Se você exceder o rate limit do Groq, aguarde alguns minutos e tente novamente. Para produção, considere migrar para DeepSeek que é muito barato.

---

**Pronto!** Agora é só obter a API Key do Groq e configurar no n8n! 🎉


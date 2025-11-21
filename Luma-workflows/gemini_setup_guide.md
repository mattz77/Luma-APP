# 🔧 Configuração do Google Gemini Pro no Luma

## ✅ Workflow Atualizado

O workflow `luma_workflow_with_tools.json` foi atualizado para usar **Google Gemini Pro** ao invés do OpenAI GPT-4.

## 📋 Passos para Configurar no n8n

### 1. Criar Credenciais do Google Gemini

1. **No n8n**, vá em **Credentials** (Credenciais)
2. Clique em **Add Credential** (Adicionar Credencial)
3. Procure por **"Google Gemini(PaLM) Api"** ou **"Google PaLM API"**
4. Preencha os campos:
   - **Host**: `https://generativelanguage.googleapis.com` (já deve vir preenchido)
   - **API Key**: Cole sua chave API do Google Gemini
     - Esta é a chave que você viu no Google AI Studio: `AIzaSyCTWpMG3b01_9uafb61FK3SgU6nsu6px98`
   - **Allowed HTTP Request Domains**: Deixe como "All" (ou configure conforme necessário)
5. Clique em **Test Connection** (Testar Conexão) para verificar
6. Clique em **Save** (Salvar)
7. Dê um nome descritivo, exemplo: **"Google Gemini Luma"**

### 2. Atualizar o Workflow no n8n

1. **Importe o workflow atualizado** (`luma_workflow_with_tools.json`) no n8n
2. **Abra o workflow**
3. **Clique no nó "Google Gemini Pro"**
4. **Na seção "Credential to connect with"**, selecione as credenciais que você acabou de criar
5. **Verifique o modelo selecionado**:
   - Padrão: `models/gemini-1.5-pro` (recomendado para Pro)
   - Alternativas disponíveis:
     - `models/gemini-2.5-flash` (mais rápido, ainda em beta)
     - `models/gemini-1.5-flash` (rápido e econômico)
     - `models/gemini-pro` (versão anterior)
6. **Ajuste as opções se necessário**:
   - **Temperature**: 0.7 (padrão, controla criatividade)
   - **Max Output Tokens**: 1500 (padrão)
7. **Salve o workflow**

### 3. Modelos Disponíveis

O n8n carrega dinamicamente os modelos disponíveis na sua conta do Google Gemini. Você pode ver todos os modelos disponíveis clicando no dropdown "Model" no nó.

**Modelos Recomendados para Tool Calling:**
- ✅ `models/gemini-1.5-pro` - **RECOMENDADO** - Melhor qualidade, suporta tool calling
- ✅ `models/gemini-2.5-flash` - Mais rápido, experimental, suporta tool calling
- ✅ `models/gemini-1.5-flash` - Rápido e econômico, suporta tool calling
- ⚠️ `models/gemini-pro` - Versão anterior, pode ter limitações

**Nota:** Todos os modelos Gemini 1.5+ suportam **Function Calling** (tool calling), que é essencial para o AI Agent funcionar com as ferramentas (Financial Summary, Tasks, etc.).

### 4. Testar o Workflow

1. **Ative o workflow** (toggle no canto superior direito)
2. **Teste enviando uma mensagem** do app Luma
3. **Verifique os logs** se houver erro:
   - Certifique-se que a API Key está correta
   - Verifique que o modelo selecionado existe na sua conta
   - Confirme que as tool workflows estão criadas e ativas

### 5. Troubleshooting

**Erro: "Invalid API Key"**
- Verifique se a chave está correta (começa com `AIza...`)
- Confirme que a chave está ativa no Google AI Studio

**Erro: "Model not found"**
- O modelo pode não estar disponível na sua conta
- Tente usar `models/gemini-1.5-flash` (disponível para todos)

**Erro: "Tool calling not supported"**
- Certifique-se de usar Gemini 1.5+ (`gemini-1.5-pro` ou `gemini-1.5-flash`)
- Versões antigas do Gemini não suportam function calling

**O Agent não está usando as ferramentas:**
- Verifique que todas as tool workflows estão criadas e ativas
- Confirme que os IDs dos workflows estão corretos no nó "Tool Workflow"

## 🎯 Vantagens do Gemini Pro

- ✅ **Mais econômico** que GPT-4
- ✅ **Boa qualidade** de respostas
- ✅ **Suporte completo a tool calling**
- ✅ **Context window grande** (até 1 milhão de tokens no 1.5 Pro)
- ✅ **Latência baixa** com modelos Flash

## 📝 Nota Importante

Se você quiser usar o modelo **Gemini 2.5 Flash** (mais recente e rápido), altere:
- `models/gemini-1.5-pro` → `models/gemini-2.5-flash`

Mas lembre-se que o 2.5 Flash ainda está em versão experimental, então o 1.5 Pro é mais estável para produção.

---

**Pronto!** Agora o Luma está usando Google Gemini Pro! 🎉


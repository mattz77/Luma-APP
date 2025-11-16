# ⚠️ Problema: Tool Calling no Groq

## 🔴 Erro Encontrado

O erro é: **"`tool calling` is not supported with this model"**

Isso significa que o modelo selecionado não suporta chamadas de ferramentas (tool calling), que é necessário para o AI Agent usar as ferramentas (Financial Summary, Tasks, etc.).

## ✅ Solução

### Modelos Groq que SUPORTAM Tool Calling:

1. **`llama-3.3-70b-versatile`** ⭐ RECOMENDADO
   - Suporta tool calling
   - Boa qualidade
   - Gratuito

2. **`llama-3.1-8b-instant`**
   - Suporta tool calling
   - Mais rápido
   - Gratuito

3. **`mixtral-8x7b-32768`**
   - Suporta tool calling
   - Boa qualidade
   - Gratuito

### Modelos Groq que NÃO SUPORTAM Tool Calling:

- ❌ `groq/compound-mini`
- ❌ `llama-3.1-70b-versatile` (versão antiga)
- ❌ `whisper-large-v3-turbo` (é para áudio, não chat)

## 🎯 Recomendação

**Use `llama-3.3-70b-versatile`** - É o modelo mais recente e suporta tool calling!

## 📝 Como Trocar no n8n

1. **Abra o workflow "Luma - AI Assistant with Action Tools"**
2. **Clique no nó "Groq Chat Model"**
3. **No campo "Model", selecione `llama-3.3-70b-versatile`**
4. **Salve o workflow**

---

**Após trocar para um modelo que suporta tool calling, o workflow deve funcionar!** 🎉


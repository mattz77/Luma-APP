# 💳 Modelo de Cobrança do Google Gemini API

## 🔍 Como Funciona a Cobrança

### ⚠️ **IMPORTANTE: API é SEMPRE pay-as-you-go (pago por uso)**

O **plano Google AI Pro** (assinatura mensal) **NÃO inclui** uso da API do Gemini.

**Dois produtos diferentes:**
1. **Google AI Pro (App)** - Assinatura mensal ($22/mês)
   - Acesso ao app Gemini com modelo Pro
   - Geração de imagens/vídeos
   - Integração com Gmail, Drive, etc.
   - **NÃO inclui uso da API**

2. **Gemini API** - Pay-as-you-go (pago por uso)
   - **SEMPRE cobrado separadamente**
   - Baseado em **tokens processados**
   - **Mesmo tendo plano Pro, você paga pela API**

## 🆓 Free Tier (Nível Gratuito)

O Google Gemini API oferece um **nível gratuito** (free tier) com quota mensal:

### Quotas Gratuitas Estimadas:
- **15 RPM** (Requests Per Minute)
- **1.000.000 tokens/dia** (aproximadamente)
- **Cota mensal generosa** para testes e desenvolvimento

### O que significa na prática:
- **Você pode usar GRÁTIS até atingir a quota**
- Depois da quota, começa a pagar **por tokens processados**
- Não há cobrança automática até você **configurar faturamento**

## 💰 Preços dos Modelos (Após Free Tier)

### Modelos Flash (Recomendado para Luma):
| Modelo | Input (1M tokens) | Output (1M tokens) | Custo Mensal* |
|--------|-------------------|-------------------|---------------|
| **2.0 Flash-001** | $0.075 | $0.30 | **$3-5** |
| **1.5 Flash** | $0.075 | $0.30 | $3-5 |
| **2.0 Flash Lite** | $0.05 | $0.20 | **$2-3** |

### Modelos Pro (Mais Caros):
| Modelo | Input (1M tokens) | Output (1M tokens) | Custo Mensal* |
|--------|-------------------|-------------------|---------------|
| **1.5 Pro** | $1.25 | $5.00 | **$37-50** |
| **2.0 Pro** | $1.50 | $6.00 | **$45-60** |

*Estimativa para Luma AI: ~1000 mensagens/dia, 500 tokens input, 300 tokens output

## 📊 Exemplo Prático para Luma AI

### Cenário: Luma AI em Produção

**Uso estimado:**
- 1000 mensagens/dia
- 500 tokens input por mensagem
- 300 tokens output por mensagem
- 30 dias/mês

**Cálculo mensal:**
- Input: 1000 × 500 × 30 = 15M tokens/mês
- Output: 1000 × 300 × 30 = 9M tokens/mês

**Custo com Gemini 2.0 Flash-001:**
- Input: 15M × $0.075 = **$1.13**
- Output: 9M × $0.30 = **$2.70**
- **Total: ~$3.83/mês** 💰

**Com free tier:**
- Primeiro mês pode ser **GRÁTIS** (dentro da quota)
- Depois: ~$3-5/mês

## 🎯 Respostas Diretas

### ❓ **"Vou pagar avulso usando a key?"**
✅ **SIM** - Você paga **por tokens processados** após o free tier

### ❓ **"Está incluído no plano Pro?"**
❌ **NÃO** - O plano Google AI Pro **NÃO inclui** uso da API
- O plano Pro é apenas para o **app Gemini**
- A API é **sempre cobrada separadamente**

### ❓ **"Preciso configurar faturamento?"**
⚠️ **SIM, mas não imediatamente:**
- Você pode usar **GRÁTIS** até atingir a quota do free tier
- Quando quiser continuar usando, precisa **configurar faturamento**
- Você só é cobrado **após** configurar faturamento

### ❓ **"Quando começo a pagar?"**
1. **Usa free tier GRÁTIS** (até quota mensal)
2. **Quando atingir a quota** → precisa configurar faturamento
3. **Depois do faturamento configurado** → paga por uso

### ❓ **"Posso usar sem configurar faturamento?"**
✅ **SIM** - Você pode usar **GRÁTIS** no free tier
- Mas há limite de requests/minuto (15 RPM)
- E limite de tokens/dia (aprox. 1M)

## 🔄 Como Funciona na Prática

### ⚠️ **IMPORTANTE: API TRAVA quando Free Tier acaba!**

**A API NÃO ativa automaticamente o pay-as-you-go!**

### Etapas:
1. **Usa API Key GRÁTIS** (free tier)
   - Até quota mensal
   - Sem necessidade de cartão de crédito
   - Funciona normalmente

2. **Atinge a quota do free tier**
   - ⚠️ **API TRAVA/INTERROMPE** automaticamente
   - ❌ **NÃO funciona mais** até configurar faturamento
   - ❌ **NÃO ativa automaticamente** o pay-as-you-go
   - ✅ Você precisa **ativar manualmente** o faturamento

3. **Configurar faturamento** (manual)
   - Acesse Google AI Studio
   - Clique em "Configurar faturamento"
   - Adicione cartão de crédito
   - **Apenas depois disso** a API volta a funcionar

4. **Depois do faturamento configurado**
   - API volta a funcionar
   - Cobrado **por tokens processados**
   - No final do mês
   - **Pay-as-you-go** (só paga o que usar)

### 🚨 **Resumo Crítico:**

| Situação | O que acontece |
|----------|----------------|
| **Durante free tier** | ✅ API funciona GRÁTIS |
| **Ao atingir quota** | ⚠️ **API TRAVA** automaticamente |
| **Sem faturamento** | ❌ API **NÃO funciona** |
| **Com faturamento** | ✅ API funciona (paga por uso) |

## 💡 Recomendações para Luma AI

### 🎯 **Estratégia Recomendada:**
1. **Comece GRÁTIS** (free tier)
   - Teste o workflow
   - Monitore uso
   - Veja se atende suas necessidades

2. **Use modelo Flash** (`gemini-2.0-flash-001`)
   - Mais barato (~$3-5/mês)
   - Suficiente para gestão doméstica
   - Velocidade alta

3. **Monitore custos** no Google AI Studio
   - Veja uso diário
   - Acompanhe quando vai atingir quota
   - Configure faturamento apenas quando necessário

4. **Configure alertas de uso**
   - No Google Cloud Console
   - Receba notificações de uso
   - Controle gastos

## 📝 Resumo Final

### ✅ **O que você precisa saber:**

1. **API é SEMPRE pay-as-you-go**
   - Mesmo com plano Pro, paga por uso da API

2. **Free tier disponível**
   - Use GRÁTIS até quota mensal
   - Sem necessidade de cartão de crédito inicial

3. **Configure faturamento apenas quando necessário**
   - Quando quiser continuar usando
   - Ou quando atingir a quota

4. **Custo estimado para Luma: ~$3-5/mês**
   - Com modelo Flash 2.0-001
   - Após free tier

5. **Sempre pague apenas pelo que usar**
   - Não há mensalidade fixa para API
   - Pay-as-you-go = paga por tokens processados

## 🎯 Conclusão

**Para Luma AI:**
- ✅ **Comece GRÁTIS** no free tier
- ✅ **Configure faturamento** quando necessário
- ✅ **Use modelo Flash** para custo baixo (~$3-5/mês)
- ✅ **Monitore uso** no Google AI Studio

**Não há assinatura mensal para API - é sempre pay-as-you-go!** 💰


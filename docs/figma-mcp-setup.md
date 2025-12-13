# Guia de Instalação do Figma MCP Server no Cursor

Este guia explica como configurar o servidor MCP do Figma no Cursor IDE para Windows, permitindo que você gere código diretamente a partir de designs do Figma.

## 📋 Pré-requisitos

- **Cursor IDE** instalado e atualizado
- **Figma Desktop App** instalado (para servidor Desktop) OU **Conta Figma** (para servidor Remote)

## 💰 Requisitos de Plano Figma

### ⚠️ IMPORTANTE: Diferenças entre as Opções

| Recurso | Opção 1: Desktop Server | Opção 2: Remote Server |
|---------|------------------------|------------------------|
| **Acesso ao Dev Mode** | ✅ **OBRIGATÓRIO** (requer plano pago) | ❌ **NÃO necessário** |
| **Plano Mínimo** | Dev ou Full seat (Professional/Organization/Enterprise) | ✅ **Starter (GRATUITO)** funciona! |
| **Limite de Uso** | Limites por minuto (Tier 1 REST API) | Starter/View/Collab: **6 chamadas/mês** |
| | | Dev/Full: Limites por minuto |

### 🎯 Resumo Rápido

- **Opção 1 (Desktop)**: Requer **plano pago** com Dev Mode
- **Opção 2 (Remote)**: Funciona com **plano gratuito (Starter)**, mas limitado a 6 chamadas/mês

## 🎯 Duas Opções de Configuração

O Figma oferece duas formas de conectar o MCP server:

### Opção 1: Desktop MCP Server
- ✅ Executa localmente através do Figma Desktop App
- ✅ Mais rápido e privado
- ✅ Requer Figma Desktop App aberto
- ✅ Endpoint local: `http://127.0.0.1:3845/mcp`
- ⚠️ **REQUER Dev Mode** (apenas planos pagos: Dev ou Full seat)
- ⚠️ **NÃO funciona com plano gratuito**

### Opção 2: Remote MCP Server (✅ RECOMENDADO para plano gratuito)
- ✅ Conecta diretamente ao endpoint hospedado do Figma
- ✅ **NÃO requer Dev Mode** - funciona com plano Starter (gratuito)
- ✅ Não requer app desktop aberto
- ✅ Endpoint: `https://mcp.figma.com/mcp`
- ⚠️ Requer autenticação com token Figma
- ⚠️ Plano Starter: limitado a **6 chamadas por mês**

---

## 🚀 Opção 1: Configuração Desktop MCP Server

⚠️ **ATENÇÃO**: Esta opção **REQUER plano pago** do Figma com acesso ao Dev Mode (Dev ou Full seat). Se você tem plano gratuito, use a **Opção 2 (Remote Server)**.

### Passo 1: Habilitar o Servidor Desktop no Figma

1. Abra o **Figma Desktop App** (certifique-se de estar na versão mais recente)
2. Crie ou abra um arquivo Figma Design
3. No toolbar inferior, alterne para **Dev Mode** (ou pressione `Shift+D`)
   - ⚠️ Se você não conseguir acessar o Dev Mode, significa que seu plano não tem acesso. Use a Opção 2.
4. No painel de inspeção, localize a seção **MCP server**
5. Clique em **Enable desktop MCP server**

Uma mensagem de confirmação aparecerá na parte inferior da janela quando o servidor estiver rodando.

**Anote o endereço**: `http://127.0.0.1:3845/mcp`

### Passo 2: Configurar no Cursor

1. Abra o **Cursor IDE**
2. Navegue até **Settings** (canto superior direito) → **MCP**
3. Clique em **Add MCP** para adicionar um novo servidor MCP

### Passo 3: Criar Arquivo de Configuração

Crie ou edite o arquivo de configuração MCP do Cursor. No Windows, o arquivo geralmente está em:

```
%APPDATA%\Cursor\User\globalStorage\mcp.json
```

Ou você pode criar um arquivo `.cursor/mcp.json` na raiz do seu projeto:

**Estrutura do arquivo `.cursor/mcp.json`:**

```json
{
  "mcpServers": {
    "figma-desktop": {
      "url": "http://127.0.0.1:3845/mcp",
      "transport": "http"
    }
  }
}
```

**OU se o Cursor usar configuração via Settings UI:**

1. No painel MCP do Cursor, adicione:
   - **Name**: `figma-desktop`
   - **URL**: `http://127.0.0.1:3845/mcp`
   - **Transport**: `http`

### Passo 4: Reiniciar o Cursor

Feche e reabra o Cursor IDE para aplicar as mudanças.

---

## 🌐 Opção 2: Configuração Remote MCP Server

✅ **RECOMENDADO para usuários com plano gratuito (Starter)**

Esta opção **NÃO requer Dev Mode** e funciona mesmo com plano Starter (gratuito), mas tem limite de **6 chamadas por mês**.

### Passo 1: Preparar Conta Figma

⚠️ **NÃO é necessário criar Personal Access Token!** O servidor Remote usa OAuth flow, que o Cursor gerencia automaticamente.

Você só precisa:
1. Ter uma conta Figma (gratuita ou paga)
2. Estar logado no navegador quando o Cursor abrir a janela de OAuth

### Passo 2: Configurar no Cursor

1. Abra o **Cursor IDE**
2. Navegue até **Settings** → **MCP**
3. Clique em **Add MCP**

### Passo 3: Criar Arquivo de Configuração

⚠️ **IMPORTANTE**: O servidor Figma MCP Remote **NÃO aceita Bearer tokens diretamente**. Ele requer **OAuth flow**, que o Cursor gerencia automaticamente. **NÃO adicione headers de Authorization**.

Crie ou edite o arquivo `.cursor/mcp.json` na raiz do projeto:

```json
{
  "mcpServers": {
    "figma-remote": {
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

**OU se o Cursor usar configuração via Settings UI:**

1. No painel MCP do Cursor, adicione:
   - **Name**: `figma-remote`
   - **URL**: `https://mcp.figma.com/mcp`
   - **Transport**: `http` (ou deixe em branco, o Cursor detecta automaticamente)
   - **NÃO adicione headers** - o Cursor gerencia OAuth automaticamente

### Passo 3.1: Autenticação OAuth (Primeira Vez)

Quando você configurar pela primeira vez, o Cursor irá:
1. Detectar que o servidor requer OAuth
2. Abrir uma janela do navegador para você fazer login no Figma
3. Após o login, o Cursor salvará os tokens automaticamente
4. Você não precisará fazer login novamente (tokens são renovados automaticamente)

### Passo 4: Reiniciar o Cursor

Feche e reabra o Cursor IDE para aplicar as mudanças.

---

## ✅ Verificação da Instalação

Após configurar e reiniciar o Cursor:

1. Abra o chat do Cursor
2. Teste com um prompt como:
   ```
   Liste as ferramentas disponíveis do Figma MCP
   ```
3. Ou peça para implementar um design:
   ```
   Implemente o design do frame selecionado no Figma
   ```

Se o servidor estiver funcionando, você verá as ferramentas do Figma disponíveis.

---

## 🎨 Como Usar o Figma MCP

### Método 1: Selection-based (Desktop Server apenas)

1. **Selecione um frame ou layer** dentro do Figma Desktop App
2. No Cursor, peça:
   ```
   Implemente o design que está selecionado no Figma
   ```
3. O MCP server detectará automaticamente a seleção atual

### Método 2: Link-based (Ambos os servidores)

1. **Copie o link** de um frame ou layer no Figma
2. No Cursor, cole o link e peça:
   ```
   Implemente o design neste link: [cole o link do Figma]
   ```
3. O MCP server extrairá o `node-id` do link automaticamente

### Exemplo de Uso Completo

```
Implemente este design do Figma em React Native usando Expo:
https://www.figma.com/file/abc123/Design-System?node-id=123:456

Use os componentes do gluestack-ui que já temos configurados.
```

---

## 🔧 Ferramentas Disponíveis no Figma MCP

O servidor MCP do Figma oferece várias ferramentas:

- **Gerar código a partir de frames selecionados**
- **Extrair contexto de design** (variáveis, componentes, layout)
- **Recuperar recursos do FigJam** (diagramas, fluxos, mapas de arquitetura)
- **Recuperar recursos do Make** (código de protótipos)
- **Manter componentes consistentes com Code Connect**

---

## 🐛 Troubleshooting

### Servidor Desktop não conecta

1. Verifique se o Figma Desktop App está aberto
2. Verifique se o Dev Mode está ativado (`Shift+D`)
3. Verifique se o servidor MCP está habilitado no painel de inspeção
4. Verifique se a porta `3845` não está bloqueada pelo firewall
5. Teste acessando `http://127.0.0.1:3845/mcp` no navegador (deve retornar JSON)

### Servidor Remote retorna erro 401 ou 405

⚠️ **O servidor Figma MCP Remote NÃO aceita Bearer tokens**. Ele requer OAuth flow.

1. **Remova qualquer header de Authorization** do arquivo `mcp.json`
2. A configuração deve ser apenas: `{"url": "https://mcp.figma.com/mcp"}`
3. O Cursor gerencia OAuth automaticamente - na primeira conexão, ele abrirá o navegador para login
4. Se você adicionou headers manualmente, remova-os e reinicie o Cursor

### Erro "OAuth provider needs auth callback"

Isso é **normal** na primeira conexão. O Cursor irá:
1. Abrir uma janela do navegador para login no Figma
2. Após o login, salvar os tokens automaticamente
3. Conectar ao servidor MCP

Se a janela não abrir:
1. Verifique se pop-ups estão bloqueados
2. Tente clicar manualmente no link de OAuth que aparece nos logs
3. Reinicie o Cursor após completar o OAuth

### Cursor não detecta o servidor MCP

1. Verifique o arquivo de configuração `.cursor/mcp.json`
2. Verifique se o JSON está válido (use um validador JSON)
3. Reinicie o Cursor completamente
4. Verifique os logs do Cursor (Help → Toggle Developer Tools → Console)

### Limite de chamadas excedido

- **Starter/View/Collab**: Máximo **6 chamadas por mês** (plano gratuito)
- **Dev/Full**: Limites por minuto (mesmos limites da REST API Tier 1)
- ⚠️ Se você atingir o limite de 6 chamadas no plano Starter, terá que:
  - Aguardar o próximo mês, OU
  - Fazer upgrade para plano pago (Professional/Organization/Enterprise)

---

## 📚 Recursos Adicionais

- [Documentação Oficial do Figma MCP](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma MCP Collection](https://www.figma.com/community/collection/figma-mcp)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

---

## 🔐 Segurança

⚠️ **IMPORTANTE**: 

- **Nunca commite tokens** no repositório Git
- Adicione `.cursor/mcp.json` ao `.gitignore` se contiver tokens
- Use variáveis de ambiente quando possível
- Regenerar tokens periodicamente

**Exemplo de `.gitignore`:**

```
# MCP Config (pode conter tokens)
.cursor/mcp.json
```

---

## 📝 Notas Finais

### Qual Opção Escolher?

- **Plano Gratuito (Starter)**: Use **Opção 2 (Remote Server)** - funciona sem Dev Mode, mas limitado a 6 chamadas/mês
- **Plano Pago (Dev/Full)**: Pode usar qualquer uma das opções:
  - **Opção 1 (Desktop)**: Mais rápido, privado, sem limites mensais
  - **Opção 2 (Remote)**: Útil para CI/CD ou quando desktop app não está disponível

### Limitações do Plano Gratuito

Se você está no plano Starter (gratuito):
- ✅ Pode usar a **Opção 2 (Remote Server)**
- ❌ **NÃO pode usar** a Opção 1 (Desktop Server) - requer Dev Mode
- ⚠️ Limite de **6 chamadas por mês** na Opção 2
- 💡 Considere fazer upgrade se precisar de mais uso

### Funcionalidades

- Ambos os métodos suportam as mesmas ferramentas e funcionalidades
- O Figma MCP funciona melhor quando combinado com Code Connect para manter consistência com seu design system

---

**Última atualização**: Janeiro 2025
**Versão do Cursor**: Compatível com versões que suportam MCP
**Versão do Figma**: Requer versão mais recente do Desktop App


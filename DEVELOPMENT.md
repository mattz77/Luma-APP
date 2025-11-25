# 🔧 Guia de Desenvolvimento - Luma APP

Este documento contém informações importantes para desenvolvedores que trabalham no projeto Luma.

## 📚 Estrutura de Branches

Este projeto mantém dois branches principais:

### `main` (público)
- **Propósito**: Branch público seguro para compartilhamento
- **Conteúdo**: Código sanitizado sem dados sensíveis
- **Status**: Pode ser compartilhado publicamente (LinkedIn, portfolio, etc.)

### `private-config` (privado)
- **Propósito**: Branch de desenvolvimento com configurações reais
- **Conteúdo**: Todas as credenciais e configurações sensíveis
- **Status**: NUNCA compartilhar publicamente

## 🔄 Como Alternar Entre Branches

### Para Desenvolvimento (com credenciais reais)

```bash
# Salvar alterações atuais
git stash

# Alternar para branch privado
git checkout private-config

# Restaurar alterações (se houver)
git stash pop
```

### Para Versão Pública (sem credenciais)

```bash
# Salvar alterações atuais
git stash

# Alternar para branch público
git checkout main

# Restaurar alterações (se houver)
git stash pop
```

## 📁 Diferenças Entre os Branches

### Arquivos Presentes Apenas no `private-config`:

- `Luma-workflows/` - Pasta completa com workflows n8n e scripts de configuração
  - `supabase_credentials_setup.md` - Credenciais Supabase reais
  - `openai_api_key_setup.md` - Instruções OpenAI com referências ao projeto
  - `*.ps1` - Scripts PowerShell de teste
  - `*.json` - Workflows n8n com configurações
  - E outros arquivos de configuração

### Dados Sanitizados no `main`:

- URLs Supabase substituídas por placeholders
- Project IDs substituídos por valores genéricos
- Credenciais de teste substituídas
- Chaves API removidas ou substituídas

## 🔐 Variáveis de Ambiente

### Branch `private-config`
O arquivo `luma-app/.env.local` contém as credenciais reais:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-real-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[sua-chave-anon-real]
EXPO_PUBLIC_N8N_WEBHOOK_URL=[sua-url-n8n-real]
```

### Branch `main`
Usar o arquivo `luma-app/env.example` como template:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
EXPO_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance/webhook
```

## 🚨 Regras Importantes

### ⚠️ NUNCA:
- Fazer commit de `.env.local` em nenhum branch
- Fazer push do branch `private-config` para repositórios públicos
- Compartilhar screenshots com dados sensíveis visíveis
- Copiar credenciais reais para o branch `main`

### ✅ SEMPRE:
- Trabalhar no branch `private-config` para desenvolvimento local
- Verificar que está no branch correto antes de commits
- Manter o `.gitignore` atualizado
- Fazer backup das credenciais em local seguro (gerenciador de senhas)

## 🔄 Workflow de Desenvolvimento Recomendado

### 1. Desenvolvimento Diário
```bash
# Trabalhe no branch privado
git checkout private-config

# Faça suas alterações normalmente
git add .
git commit -m "feat: sua feature"

# Push para repositório privado (se houver)
git push origin private-config
```

### 2. Ao Compartilhar Código Publicamente
```bash
# Merge suas alterações para main (apenas código, não credenciais)
git checkout main
git merge private-config --no-commit

# Reverta arquivos sensíveis
git checkout main -- README.md
git checkout main -- .gitignore

# Verifique que não há dados sensíveis
git diff --staged

# Commit e push
git commit -m "feat: sua feature (versão pública)"
git push origin main
```

### 3. Sincronizar Branches
```bash
# No branch private-config
git checkout private-config

# Pegar atualizações do main
git merge main

# Resolver conflitos se houver
# Manter sempre as credenciais do private-config
```

## 📝 Checklist Antes de Push Público

Antes de fazer push para o branch `main`:

- [ ] Verificar que não há URLs reais do Supabase
- [ ] Verificar que não há chaves API
- [ ] Verificar que não há credenciais de usuário
- [ ] Verificar que pasta `Luma-workflows/` não está no tracking
- [ ] Verificar que arquivos `.env.local` estão no .gitignore
- [ ] Rodar `git diff` para revisar mudanças
- [ ] Testar build localmente com configuração de exemplo

## 🛠️ Configuração Inicial para Novos Desenvolvedores

Se você é novo no projeto:

1. Clone o repositório
2. Peça acesso ao branch `private-config` ao mantenedor
3. Checkout no branch privado: `git checkout private-config`
4. Copie o arquivo `.env.local` do branch privado ou crie um novo com credenciais válidas
5. Instale dependências: `cd luma-app && npm install`
6. Siga o guia em `SETUP.md` para configuração completa

## 📞 Suporte

Em caso de dúvidas sobre:
- Credenciais perdidas: verifique o branch `private-config`
- Configuração do projeto: veja `SETUP.md`
- Políticas de segurança: veja `SECURITY.md`

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [n8n Documentation](https://docs.n8n.io)
- [Expo Documentation](https://docs.expo.dev)

---

**Última Atualização**: Janeiro 2025  
**Mantenedor**: Equipe Luma


# 🔐 Política de Segurança - Luma APP

## 📢 Reportar Vulnerabilidades

Se você descobriu uma vulnerabilidade de segurança, **NÃO** abra uma issue pública.

### Como Reportar

Envie um email para: **security@luma-app.com** (ou contato do mantenedor)

Inclua:
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestões de correção (se houver)

Responderemos em até 48 horas.

## 🛡️ Práticas de Segurança

### Autenticação

- ✅ Implementamos Supabase Auth com JWT
- ✅ Tokens são armazenados de forma segura
- ✅ Sessões expiram automaticamente
- ✅ Suporte a autenticação multi-fator (futuro)

### Autorização

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Isolamento multi-tenant por `house_id`
- ✅ Verificação de permissões em cada operação
- ✅ Roles definidas: `admin`, `member`, `viewer`

### Dados Sensíveis

#### ⚠️ O que NUNCA deve ser commitado:

- Chaves API (OpenAI, Anthropic, etc.)
- Credenciais Supabase (service_role key)
- Senhas de banco de dados
- Tokens de acesso
- Variáveis de ambiente com valores reais
- Arquivos `.env.local`
- Logs com informações pessoais

#### ✅ O que pode ser commitado:

- Arquivos `.env.example` com placeholders
- Estrutura de código
- Testes sem dados reais
- Documentação sem credenciais

### Criptografia

- ✅ Todas as conexões usam HTTPS/TLS
- ✅ Senhas hasheadas com bcrypt (Supabase)
- ✅ Tokens JWT assinados
- ✅ Dados em trânsito criptografados

### Proteção de Dados (LGPD/GDPR)

#### Dados Coletados

- Email e nome do usuário (registro)
- Avatar (opcional)
- Dados de uso do app (analytics - futuro)
- Conversas com IA (para melhorias)

#### Direitos do Usuário

- ✅ Acesso aos próprios dados
- ✅ Correção de dados incorretos
- ✅ Exclusão da conta
- ✅ Exportação de dados (futuro)
- ✅ Portabilidade (futuro)

#### Retenção de Dados

- Dados de usuário: mantidos enquanto conta ativa
- Conversas com IA: 90 dias
- Logs de sistema: 30 dias
- Dados de casas: mantidos até exclusão manual

## 🔒 Configurações de Segurança

### Supabase

#### Row Level Security (RLS)

Todas as tabelas têm RLS ativado:

```sql
-- Exemplo: tabela expenses
CREATE POLICY "Users can view expenses from their houses"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM house_members
    WHERE house_members.house_id = expenses.house_id
    AND house_members.user_id = auth.uid()
  )
);
```

#### Service Role vs Anon Key

- **Anon Key**: Usada no app mobile (pública, limitada por RLS)
- **Service Role Key**: Usada apenas server-side (n8n, Edge Functions)

**⚠️ NUNCA exponha Service Role Key no cliente!**

### n8n Workflows

- ✅ Credenciais armazenadas no n8n vault
- ✅ Webhooks com validação de origem
- ✅ Rate limiting configurado
- ✅ Logs não contêm dados sensíveis

### Variáveis de Ambiente

#### Desenvolvimento
```env
# .env.local (NUNCA commitar)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Produção
- Use secrets do GitHub Actions
- Configure no EAS (Expo Application Services)
- Rotacione chaves regularmente

## 🚨 Incidentes de Segurança

### Histórico

Nenhum incidente reportado até o momento.

### Resposta a Incidentes

Em caso de breach:

1. **Identificação** (0-1h)
   - Detectar e confirmar incidente
   - Avaliar escopo e impacto

2. **Contenção** (1-4h)
   - Isolar sistemas afetados
   - Revogar credenciais comprometidas
   - Bloquear acessos não autorizados

3. **Erradicação** (4-24h)
   - Identificar causa raiz
   - Corrigir vulnerabilidade
   - Atualizar sistemas

4. **Recuperação** (24-48h)
   - Restaurar operações normais
   - Monitorar sistemas
   - Validar correções

5. **Comunicação** (48-72h)
   - Notificar usuários afetados
   - Reportar para autoridades (se necessário)
   - Publicar post-mortem

## 🛠️ Ferramentas de Segurança

### Em Uso

- **Supabase Auth**: Autenticação e JWT
- **Supabase RLS**: Autorização granular
- **Git-crypt**: Criptografia de arquivos sensíveis (branch privado)
- **npm audit**: Verificação de vulnerabilidades

### Recomendadas

- **Dependabot**: Atualizações automáticas de segurança
- **CodeQL**: Análise estática de código
- **OWASP ZAP**: Teste de penetração
- **Snyk**: Monitoramento de dependências

## 📋 Checklist de Segurança

Antes de cada release:

- [ ] Rodar `npm audit` e corrigir vulnerabilidades
- [ ] Verificar que não há secrets no código
- [ ] Confirmar RLS em novas tabelas
- [ ] Atualizar dependências de segurança
- [ ] Revisar logs de acesso
- [ ] Testar fluxos de autenticação
- [ ] Validar permissões de usuários
- [ ] Verificar CORS e CSP configurados

## 🔄 Atualizações de Segurança

Este documento é revisado:
- Mensalmente (rotina)
- Após incidentes
- Quando novas features são adicionadas
- Quando regulamentações mudam

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Expo Security](https://docs.expo.dev/guides/security/)
- [LGPD](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [GDPR](https://gdpr.eu/)

## 📞 Contato de Segurança

- **Email**: security@luma-app.com
- **PGP Key**: (adicionar se houver)
- **Resposta**: Até 48 horas

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Próxima Revisão**: Abril 2025


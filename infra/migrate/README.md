# Migração de Infra — Luma Self-Hosted

Scripts para mover **toda a infra** para uma nova máquina Windows 11 com Docker Desktop.

## O que é migrado

| Stack | Dados | Método |
|-------|-------|--------|
| TS3 Server | `volumes/ts3-data/` (SQLite + files) | Cópia de pasta |
| n8n (CordenaAi) | `cordenaain8n_n8n_storage` + banco | Volume export + pg_dump |
| Supabase | Banco PostgreSQL | pg_dump + bind mount zip |
| Proxy | Configs traefik + cloudflared | Cópia de pasta |
| Imagens custom | `luma/web`, `luma/portfolio`, `cordenaain8n-n8n`, `cordenaain8n-n8n-runner` | `docker save` |

## Passos

### Na máquina ATUAL (origem)

```powershell
# Como Administrador
powershell infra\migrate\01-export.ps1
```

Gera pasta `luma-migrate-<timestamp>` na Área de Trabalho.  
Leia o `MANIFEST.txt` — lista os `.env` a copiar manualmente.

### Na máquina NOVA (destino)

**1. Instalar pré-requisitos** (como Admin, reboot necessário):
```powershell
powershell 00-prereqs.ps1
# Reboot
# Abra Docker Desktop, aguarde engine verde
```

**2. Clonar repositórios:**
```powershell
git clone https://github.com/mattz77/Luma-APP.git   C:\Users\<user>\Documents\Luma-APP
git clone <CordenaAi-repo>                           C:\Users\<user>\Documents\CordenaAi
# Copie manualmente: Claude\Projects\TS3 Server para CS2 (Self-hosted)\
```

**3. Copiar `.env` por canal seguro** (USB, SFTP — nunca via git):
```
infra\proxy\.env
infra\supabase\.env
CordenaAi\commitBriefing\.env
TS3 Server\(.env)
```

**4. Copiar pasta de export para a nova máquina**

**5. Restaurar** (como Admin):
```powershell
powershell infra\migrate\02-restore.ps1 -ExportDir "C:\...\luma-migrate-2026-05-22_..."
```

**6. Passos manuais pós-restore:**
- Cloudflare DNS: atualizar A record `ts.nicebyte.ia.br` → novo IP (nuvem cinza)
- Cloudflare Tunnel: verificar/recriar se necessário
- Task Scheduler: `powershell infra\install-task-scheduler.ps1`
- Git hooks: `powershell infra\install-hooks.ps1`

## Migração só do TS3

Para mover apenas o TS3 (sem toda a infra):

```powershell
# Na origem
powershell "Claude\Projects\TS3 Server para CS2 (Self-hosted)\scripts\export-migrate.ps1"

# Na destino (após Docker instalado e luma-net criada)
# Extraia o ZIP → rode setup-new-machine.ps1
```

## Notas

- `.env` **nunca** vão para o git — transferência por canal seguro
- Tunnel Cloudflare: mesmo UUID funciona em outra máquina desde que o `.json` de credenciais seja copiado (`infra/proxy/cloudflared/2cae17fe-....json`)
- Supabase: se o pg_dump falhar, o `supabase-db-data.zip` (bind mount raw) é o fallback — descompacte em `infra/supabase/volumes/db/data/`

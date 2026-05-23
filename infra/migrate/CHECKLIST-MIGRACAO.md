# Checklist de Migração — Luma Self-Hosted (Windows → Windows)

## Categorias

| Categoria | Como transferir |
|-----------|----------------|
| **A — Git** | `git clone` na nova máquina — automático |
| **B — Segredos** | Pendrive/SFTP — **nunca via git** |
| **C — Dados** | Gerado por `01-export.ps1` |
| **D — Imagens Docker** | Rebuild a partir do clone **OU** `docker save` se não tiver Dockerfile |
| **E — Docker Hub** | Pull automático no primeiro `docker compose up` |

---

## A — Clonar repositórios (na nova máquina, antes do restore)

```powershell
# Luma-APP (contém toda a infra: proxy, supabase compose, traefik, etc.)
git clone https://github.com/mattz77/Luma-APP.git C:\Users\<user>\Documents\Luma-APP

# CordenaAi (contém n8n commitBriefing: compose prd, Dockerfiles, workflows)
git clone <url-cordenaai>                          C:\Users\<user>\Documents\CordenaAi
```

**O clone do Luma-APP já traz:**
```
infra/proxy/docker-compose.yml
infra/proxy/traefik/traefik.yml
infra/proxy/traefik/dynamic/*.yml        (todos os configs de rota)
infra/proxy/traefik/dynamic/crowdsec.yml.template
infra/proxy/cloudflared/config.yml
infra/proxy/crowdsec/acquis.yaml
infra/proxy/luma-web/Dockerfile          (para rebuild luma/web)
infra/proxy/luma-web/dist/               (bundle web app — no git)
infra/proxy/luma-web/nginx.conf
infra/supabase/docker-compose.yml
infra/n8n/docker-compose.yml
infra/docker-compose.network.yml         (cria luma-net)
infra/deploy.ps1
infra/install-task-scheduler.ps1
infra/install-hooks.ps1
infra/auto-pull-deploy.ps1
infra/migrate/00-prereqs.ps1
infra/migrate/01-export.ps1
infra/migrate/02-restore.ps1
```

**O clone do CordenaAi já traz:**
```
commitBriefing/docker-compose.prd.yml    (compose produção n8n)
commitBriefing/Dockerfile                (imagem cordenaain8n-n8n)
commitBriefing/Dockerfile.runner         (imagem cordenaain8n-n8n-runner)
commitBriefing/init-data.sh              (init postgres n8n)
commitBriefing/n8n-task-runners.json
commitBriefing/workflows/*.json          (workflows n8n — importar via UI)
```

**TS3 — não está num repo próprio limpo. Copiar pasta manualmente:**
```
Claude\Projects\TS3 Server para CS2 (Self-hosted)\
  docker-compose.yml
  scripts\*.ps1
  scripts\*.py
```
(O `.env` e `volumes/` vêm pelas categorias B e C abaixo)

---

## B — Segredos — transferir por canal seguro (USB/SFTP)

> ⚠️ NUNCA comitar estes arquivos. Não passar por email/chat.

### Proxy
| Arquivo (origem) | Destino na nova máquina |
|-----------------|------------------------|
| `infra/proxy/.env` | `infra/proxy/.env` |
| `infra/proxy/cloudflared/2cae17fe-241b-4d0a-9fe0-6fc5d7d660ba.json` | mesmo caminho |
| `infra/proxy/cloudflared/cert.pem` | mesmo caminho |
| `infra/proxy/traefik/certs/origin.crt` | mesmo caminho |
| `infra/proxy/traefik/certs/origin.key` | mesmo caminho |
| `infra/proxy/traefik/certs/origin.pfx` | mesmo caminho |

### Supabase
| Arquivo (origem) | Destino na nova máquina |
|-----------------|------------------------|
| `infra/supabase/.env` | `infra/supabase/.env` |

### n8n (CordenaAi)
| Arquivo (origem) | Destino na nova máquina |
|-----------------|------------------------|
| `CordenaAi/commitBriefing/.env` | `CordenaAi/commitBriefing/.env` |

### TS3
| Arquivo (origem) | Destino na nova máquina |
|-----------------|------------------------|
| `Claude\Projects\TS3 Server para CS2 (Self-hosted)\.env` | mesmo caminho |

---

## C — Dados — gerados por `01-export.ps1`

Execute na máquina atual:
```powershell
# Como Administrador
powershell C:\Users\olive\Documents\Luma-APP\infra\migrate\01-export.ps1
```

Gera `luma-migrate-<timestamp>\` na Área de Trabalho com:

| Arquivo no export | Conteúdo |
|------------------|---------|
| `ts3-data/ts3-data/` | SQLite DB + files (avatares, ícones) |
| `n8n-db.dump` | Banco n8n (pg_dump custom format) |
| `n8n-storage.tar.gz` | Volume `/home/node/.n8n` (credentials, configs n8n) |
| `n8n-db-storage-fallback.tar.gz` | Volume postgres n8n (fallback) |
| `supabase-full.sql` | pg_dumpall supabase |
| `supabase-db-data.zip` | Bind mount postgres bruto (fallback) |
| `proxy-configs/` | Cópia das configs traefik + cloudflared |
| `proxy-crowdsec-db.tar.gz` | Volume crowdsec |
| `portfolio-image.tar` | Imagem luma/portfolio (sem Dockerfile público) |
| `MANIFEST.txt` | Instruções + lista de .env |

---

## D — Imagens Docker customizadas

### Rebuild a partir do clone (preferível — sem transferir arquivo)

```powershell
# luma/web — Dockerfile em git, dist/ também em git
cd C:\...\Luma-APP
docker build -t luma/web -f infra/proxy/luma-web/Dockerfile infra/proxy/luma-web/

# cordenaain8n-n8n — Dockerfile em git
cd C:\...\CordenaAi\commitBriefing
docker build -t cordenaain8n-n8n -f Dockerfile .

# cordenaain8n-n8n-runner — Dockerfile.runner em git
docker build -t cordenaain8n-n8n-runner -f Dockerfile.runner .
```

### Via arquivo (gerado pelo export)
```powershell
# luma/portfolio — sem Dockerfile no repo, gerado pelo export
docker load -i luma-migrate-<ts>\portfolio-image.tar
```

---

## E — Imagens do Docker Hub (pull automático)

Não precisa transferir — `docker compose up` faz o pull:

```
traefik:v3.4.0
cloudflare/cloudflared:2024.12.0
tecnativa/docker-socket-proxy:0.3.0
louislam/uptime-kuma:1.23.15
crowdsecurity/crowdsec:v1.6.3
supabase/postgres:15.8.1.060          (~3 GB — pode demorar)
supabase/gotrue:v2.164.0
supabase/studio:20240729-ce42139
supabase/edge-runtime:v1.67.4
supabase/realtime:v2.30.34
supabase/storage-api:v0.46.4
supabase/postgres-meta:v0.83.2
postgrest/postgrest:v12.2.0
kong:2.8.1
prodrigestivill/postgres-backup-local:15
prodrigestivill/postgres-backup-local:16
rclone/rclone:latest
docker.n8n.io/n8nio/n8n:2.12.3
n8nio/runners:2.12.3
postgres:16
teamspeak:latest
alpine:latest
```

Total download estimado: **~12 GB** — garanta conexão boa antes de rodar restore.

---

## Sequência completa na nova máquina

```
[Máquina atual]
  1. powershell infra\migrate\01-export.ps1
  2. Copie export + segredos (cat. B) para pendrive/SFTP

[Nova máquina — como Administrador]
  3. Copie o export + segredos para a máquina

  4. powershell 00-prereqs.ps1          # instala Docker, Git, Python, Node
  5. REBOOT
  6. Abra Docker Desktop → aguarde engine verde

  7. git clone ... Luma-APP
     git clone ... CordenaAi
     Copie pasta TS3 manualmente

  8. Copie os .env (cat. B) nos caminhos corretos

  9. [Rebuild imagens cat. D]
     docker build -t luma/web ...
     docker build -t cordenaain8n-n8n ...
     docker build -t cordenaain8n-n8n-runner ...
     docker load -i portfolio-image.tar

 10. powershell infra\migrate\02-restore.ps1 -ExportDir "C:\...\luma-migrate-..."

 11. DNS Cloudflare: A record ts.nicebyte.ia.br → IP novo (nuvem CINZA)
 12. powershell infra\install-task-scheduler.ps1
 13. powershell infra\install-hooks.ps1
 14. Testar: https://luma-status.nicebyte.ia.br
```

---

## O que NÃO precisa transferir

- `infra/supabase/volumes/db/data/` — restaurado via pg_dump (supabase-full.sql)
- `infra/proxy/traefik/dynamic/crowdsec.yml` — gerado automaticamente pelo deploy.ps1
- `infra/logs/` — gitignored, dispensável
- `luma-app/node_modules/`, `.expo/`, etc. — reinstalados com npm install

# Luma Infrastructure — Deploy Guide

## Startup order

```
1. network          → once (shared luma-net)
2. proxy            → Traefik + cloudflared + monitoring
3. supabase         → DB + Kong + Auth + Rest + Realtime + Storage + Studio + Backups
4. n8n              → n8n + its dedicated postgres
5. floci            → DEV/CI only, do not start in prod
```

---

## 1. Create shared network (once)

```bash
docker compose -f docker-compose.network.yml up -d
```

---

## 2. Cloudflare Tunnel setup (do once after DNS propagates)

```bash
# Install cloudflared on Windows
winget install Cloudflare.cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create luma
# → outputs UUID, saves credentials JSON to ~/.cloudflared/<UUID>.json

# Copy credentials to infra/proxy/cloudflared/
copy %USERPROFILE%\.cloudflared\<UUID>.json infra\proxy\cloudflared\<UUID>.json

# Update infra/proxy/cloudflared/config.yml — replace <TUNNEL_UUID> with real UUID

# Add CNAMEs in Cloudflare dashboard (or via CLI):
cloudflared tunnel route dns luma nicebyte.ia.br
cloudflared tunnel route dns luma www.nicebyte.ia.br
cloudflared tunnel route dns luma api.luma.nicebyte.ia.br
cloudflared tunnel route dns luma n8n.luma.nicebyte.ia.br
cloudflared tunnel route dns luma studio.luma.nicebyte.ia.br
cloudflared tunnel route dns luma status.luma.nicebyte.ia.br
```

---

## 3. Cloudflare origin certificate

1. Cloudflare Dashboard → nicebyte.ia.br → SSL/TLS → Origin Server → Create Certificate
2. Choose RSA 2048, valid 15 years, all subdomains (*.nicebyte.ia.br + nicebyte.ia.br)
3. Save cert → `infra/proxy/traefik/certs/origin.crt`
4. Save key → `infra/proxy/traefik/certs/origin.key`

SSL/TLS settings:
- Mode: **Full (Strict)**
- Always Use HTTPS: **ON**
- Automatic HTTPS Rewrites: **ON**
- DNSSEC: **OFF** (during transition)

---

## 4. Generate secrets

```bash
# Supabase
openssl rand -base64 32   # JWT_SECRET
# Then generate ANON_KEY + SERVICE_ROLE_KEY:
# https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

# n8n
openssl rand -base64 32   # N8N_DB_PASSWORD
openssl rand -base64 32   # N8N_ENCRYPTION_KEY
openssl rand -base64 24   # N8N_AUTH_PASSWORD
```

Fill in:
- `infra/supabase/.env`
- `infra/n8n/.env`

---

## 5. Start proxy stack

```bash
cd infra/proxy

# First run: CrowdSec needs to start before getting bouncer key
docker compose up -d crowdsec
# Wait ~30s then generate bouncer key:
docker compose exec crowdsec cscli bouncers add traefik-bouncer
# Copy output key into .env → CROWDSEC_API_KEY=

docker compose --env-file .env up -d
```

---

## 6. Start Supabase

```bash
cd infra/supabase
docker compose --env-file .env up -d

# Verify Kong is up:
curl https://api.luma.nicebyte.ia.br/rest/v1/
```

---

## 7. Start n8n

```bash
cd infra/n8n
docker compose --env-file .env up -d

# Import workflows via n8n MCP or UI at:
# https://n8n.luma.nicebyte.ia.br (requires CF Access OTP)
```

---

## 8. Build + start portfolio

```bash
# From project root (prj_portfolio/ must exist)
docker build -t luma/portfolio:latest prj_portfolio/
# Then proxy compose already references this image (started in step 5)
```

---

## 9. Cloudflare Access policies (Zero Trust dashboard)

- `studio.luma.nicebyte.ia.br` → email OTP → mattz77.mo@gmail.com only
- `n8n.luma.nicebyte.ia.br` with path NOT `/webhook/*` → email OTP

---

## 10. App cutover (after self-hosted is verified)

Update `luma-app/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://api.luma.nicebyte.ia.br
EXPO_PUBLIC_SUPABASE_ANON_KEY=<new-self-hosted-anon-key>
EXPO_PUBLIC_N8N_WEBHOOK_URL=https://n8n.luma.nicebyte.ia.br
```

Push OTA via EAS Update (baked env vars require bundle update):
```bash
eas update --branch production --message "migrate to self-hosted infra"
```

---

## 11. Auto-Deploy Pipeline

Automated deployment triggered by git push to `origin/main`. Two mechanisms work in parallel:

### Architecture

```
git push origin main
        │
        ├── Task Scheduler (every 5 min)
        │   └── auto-pull-deploy.ps1
        │       ├── git fetch + pull
        │       ├── infra/** changed → deploy.ps1 (Docker stacks)
        │       ├── luma-app/** changed → deploy-app.ps1 (EAS OTA)
        │       └── push heartbeat → Uptime Kuma
        │
        └── Manual: git pull
            └── post-merge hook
                ├── infra/** changed → deploy.ps1
                └── luma-app/** changed → deploy-app.ps1
```

### Scripts

| Script | Purpose |
|--------|---------|
| `infra/deploy.ps1` | Idempotent Docker stack deploy (proxy + supabase + n8n) |
| `infra/deploy-app.ps1` | EAS Update OTA for luma-app (bun install + eas update) |
| `infra/auto-pull-deploy.ps1` | Orchestrator: fetch, detect changes, route deploys, push Kuma |
| `infra/install-task-scheduler.ps1` | Registers Windows Task Scheduler job (5 min interval) |
| `infra/install-hooks.ps1` | Copies versioned hooks from `infra/hooks/` to `.git/hooks/` |
| `infra/hooks/post-merge` | Git hook: deploy after `git pull` if infra/ or luma-app/ changed |

### First-time setup (run once)

```powershell
cd C:\Users\olive\Documents\Luma-APP

# 1. Install git hooks
powershell -ExecutionPolicy Bypass -File infra\install-hooks.ps1

# 2. Register Task Scheduler + Uptime Kuma push URL
powershell -ExecutionPolicy Bypass -File infra\install-task-scheduler.ps1 `
  -KumaPushUrl "https://luma-status.nicebyte.ia.br/api/push/<TOKEN>"

# 3. Ensure EAS CLI is logged in
cd luma-app
npx eas-cli login
```

### Change detection rules

| Path changed | Action | Excludes |
|---|---|---|
| `infra/**` | Docker compose up -d (all stacks) | `infra/logs/` |
| `luma-app/**` | EAS Update (OTA push) | `docs/`, `e2e/`, `*.test.*`, `*.spec.*`, `*.md` |
| Other paths | Pull only, no deploy | — |

### Manual deploy commands

```powershell
# Deploy all Docker stacks
powershell infra/deploy.ps1

# Deploy single stack
powershell infra/deploy.ps1 -Stacks supabase

# Deploy app (EAS OTA)
powershell infra/deploy-app.ps1

# Trigger scheduled task manually
Start-ScheduledTask -TaskName LumaInfraAutoDeploy
```

### Logs

- `infra/logs/auto-pull-YYYYMMDD.log` — scheduler runs
- `infra/logs/deploy-YYYYMMDD.log` — Docker stack deploys
- `infra/logs/deploy-app-YYYYMMDD.log` — EAS update deploys

### Monitoring

Uptime Kuma push monitor at `luma-status.nicebyte.ia.br`:
- Monitor type: **Push**
- Heartbeat interval: 300s (5 min)
- Messages: `up-to-date`, `pulled (no-op)`, `deployed: infra:N, app:N`
- Alert: heartbeat missed = scheduler stopped or deploy failed

---

## 12. Offsite Backups (Cloudflare R2)

### Architecture

```
supabase-backup container
  └── pg_dump every 6h → ./volumes/backups/
        └── rclone-sync container
              └── rclone sync → R2 bucket "luma-backups" (every 6h)
```

### R2 bucket setup (done once)

1. Cloudflare Dashboard → R2 Object Storage → Create Bucket: `luma-backups`
2. R2 → Manage API Tokens → Create API Token:
   - Name: `luma-backup-rclone`
   - Permissions: Object Read & Write
   - Bucket scope: `luma-backups` only
3. Copy Access Key ID, Secret Access Key, Endpoint URL

### Environment variables (infra/supabase/.env)

```env
RCLONE_R2_ACCESS_KEY_ID=<access-key>
RCLONE_R2_SECRET_ACCESS_KEY=<secret-key>
RCLONE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

### Verify backups

```powershell
# Check local backups exist
docker exec supabase-supabase-backup-1 ls -la /backups/

# Check rclone-sync logs
docker compose -f infra/supabase/docker-compose.yml logs rclone-sync --tail 20

# Check R2 bucket (via Cloudflare Dashboard or rclone)
docker exec supabase-rclone-sync-1 rclone ls r2:luma-backups
```

### Backup schedule

| What | Schedule | Retention |
|------|----------|-----------|
| pg_dump (local) | Every 6h | 7 days / 4 weeks / 6 months |
| R2 sync (offsite) | Every 6h (after backup) | Mirrors local retention |

### Restore from R2

```bash
# Download specific backup
rclone copy r2:luma-backups/daily/postgres-YYYYMMDD.sql.gz ./restore/

# Restore
gunzip postgres-YYYYMMDD.sql.gz
docker exec -i supabase-supabase-db-1 psql -U supabase_admin -d postgres < postgres-YYYYMMDD.sql
```

---

## Verification checklist

- [ ] `curl https://api.luma.nicebyte.ia.br/rest/v1/` → PostgREST response
- [ ] Mobile login → JWT from self-hosted GoTrue
- [ ] Luma chat → n8n webhook response
- [ ] Receipt upload → signed URL (expires in 1h)
- [ ] `studio.luma.nicebyte.ia.br` → CF Access OTP prompt
- [ ] `nmap -Pn <home-ip>` → all ports filtered (tunnel only, no open ports)
- [ ] HMAC: request without X-Luma-Signature → 401
- [ ] HMAC replay: timestamp >5min → rejected
- [ ] 11 auth requests in 1min → Traefik rate-limit blocks
- [ ] Uptime Kuma → all monitors green (including Infra Auto-Deploy push)
- [ ] R2 bucket → backup files present
- [ ] Task Scheduler → `Get-ScheduledTaskInfo -TaskName LumaInfraAutoDeploy` → LastTaskResult: 0

---

## Blocked until propagation completes

All tunnel + DNS steps above (steps 2, 3, 9) require Cloudflare propagation.
Check: `dig NS nicebyte.ia.br` → should show `albert.ns.cloudflare.com`

---

## Security notes

**Never commit to git:**
- `infra/**/.env` (all env files with secrets)
- `infra/proxy/traefik/certs/` (TLS private keys)
- `infra/proxy/cloudflared/cert.pem` (tunnel certificate)
- `infra/proxy/cloudflared/*.json` (tunnel credentials)
- `infra/migration/` (contains user data dumps)

These are enforced via `.gitignore`.

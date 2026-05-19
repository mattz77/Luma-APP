# Luma Infrastructure — Deploy Guide

## Startup order

```
1. network          → once (shared luma-net)
2. proxy            → Traefik + cloudflared + monitoring
3. supabase         → DB + Kong + Auth + Rest + Realtime + Storage + Studio
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

---

## Blocked until propagation completes

All tunnel + DNS steps above (steps 2, 3, 9) require Cloudflare propagation.
Check: `dig NS nicebyte.ia.br` → should show `albert.ns.cloudflare.com`

# 02-restore.ps1 -- Restaura TUDO na maquina NOVA a partir do export
# Execute como Administrador apos:
#   - 00-prereqs.ps1 ter rodado + reboot
#   - Docker Desktop estar rodando (engine verde)
#   - Repositorios clonados nos caminhos corretos
#   - Arquivos .env copiados manualmente
#   - Pasta de export copiada para esta maquina
#
# Compativel com Windows PowerShell 5.1 (sem pwsh, sem Unicode especial).
#
# Uso:
#   .\02-restore.ps1 -ExportDir "C:\caminho\para\luma-migrate-2026-05-22_..."
#
# Parametros opcionais:
#   -LumaRoot    caminho do repo Luma-APP  (default: C:\Users\<atual>\Documents\Luma-APP)
#   -N8nRoot     caminho do commitBriefing (default: C:\Users\<atual>\Documents\CordenaAi\commitBriefing)
#   -TS3Root     caminho do projeto TS3    (default: C:\Users\<atual>\Documents\Claude\Projects\TS3 Server para CS2 (Self-hosted))

#Requires -RunAsAdministrator

param(
    [Parameter(Mandatory=$true)]
    [string]$ExportDir,

    [string]$LumaRoot = "C:\Users\$env:USERNAME\Documents\Luma-APP",
    [string]$N8nRoot  = "C:\Users\$env:USERNAME\Documents\CordenaAi\commitBriefing",
    [string]$TS3Root  = "C:\Users\$env:USERNAME\Documents\Claude\Projects\TS3 Server para CS2 (Self-hosted)"
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Msg)
    Write-Host ""
    Write-Host "==> $Msg" -ForegroundColor Cyan
}

function Assert-Path {
    param([string]$P, [string]$Label)
    if (-not (Test-Path $P)) {
        Write-Host "ERRO: $Label nao encontrado: $P" -ForegroundColor Red
        exit 1
    }
}

# ── Pre-flight checks ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Luma Infrastructure Restore" -ForegroundColor Cyan
Write-Host " Export: $ExportDir" -ForegroundColor Cyan
Write-Host "============================================================"

Assert-Path $ExportDir "Pasta de export"
Assert-Path $LumaRoot  "Luma-APP repo"
Assert-Path $N8nRoot   "CordenaAi commitBriefing"
Assert-Path $TS3Root   "TS3 projeto"

# Verifica Docker esta rodando
try {
    docker version | Out-Null
} catch {
    Write-Host "ERRO: Docker nao esta rodando. Abra o Docker Desktop e aguarde o engine iniciar." -ForegroundColor Red
    exit 1
}

# Verifica .env files existem
$envFiles = @(
    @{ Path = "$LumaRoot\infra\proxy\.env";     Label = "proxy .env" },
    @{ Path = "$LumaRoot\infra\supabase\.env";  Label = "supabase .env" },
    @{ Path = "$N8nRoot\.env";                  Label = "n8n (CordenaAi) .env" },
    @{ Path = "$TS3Root\.env";                  Label = "TS3 .env" }
)
$missingEnv = @()
foreach ($e in $envFiles) {
    if (-not (Test-Path $e.Path)) { $missingEnv += $e.Label }
}
if ($missingEnv.Count -gt 0) {
    Write-Host ""
    Write-Host "ERRO: Os seguintes .env nao foram copiados:" -ForegroundColor Red
    $missingEnv | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "Copie-os manualmente antes de continuar (veja MANIFEST.txt)." -ForegroundColor Yellow
    exit 1
}

Write-Host "Pre-flight OK. Iniciando restore..." -ForegroundColor Green

# ── 1. Imagens Docker customizadas ───────────────────────────────────────────
Write-Step "[1/8] Preparando imagens Docker customizadas..."

# luma/portfolio -- sem Dockerfile, carrega do tar
$portfolioTar = Join-Path $ExportDir "portfolio-image.tar"
if (Test-Path $portfolioTar) {
    Write-Host "   Carregando luma/portfolio do tar..."
    docker load -i $portfolioTar
    Write-Host "   OK: luma/portfolio"
} else {
    Write-Host "   portfolio-image.tar nao encontrado" -ForegroundColor Yellow
}

# luma/web -- rebuild a partir do Dockerfile (dist ja esta no repo)
Write-Host "   Rebuilding luma/web..."
$lumaWebDockerfile = "$LumaRoot\infra\proxy\luma-web\Dockerfile"
if (Test-Path $lumaWebDockerfile) {
    docker build -t luma/web -f $lumaWebDockerfile "$LumaRoot\infra\proxy\luma-web\" 2>&1 | Out-Null
    Write-Host "   OK: luma/web"
} else {
    Write-Host "   Dockerfile luma/web nao encontrado -- clone o repo Luma-APP primeiro" -ForegroundColor Red
    exit 1
}

# cordenaain8n-n8n e runner -- rebuild a partir do repo CordenaAi
$n8nDockerfile = "$N8nRoot\Dockerfile"
if (Test-Path $n8nDockerfile) {
    Write-Host "   Rebuilding cordenaain8n-n8n..."
    docker build -t cordenaain8n-n8n -f $n8nDockerfile $N8nRoot 2>&1 | Out-Null
    Write-Host "   OK: cordenaain8n-n8n"

    $runnerDockerfile = "$N8nRoot\Dockerfile.runner"
    if (Test-Path $runnerDockerfile) {
        Write-Host "   Rebuilding cordenaain8n-n8n-runner..."
        docker build -t cordenaain8n-n8n-runner -f $runnerDockerfile $N8nRoot 2>&1 | Out-Null
        Write-Host "   OK: cordenaain8n-n8n-runner"
    }
} else {
    Write-Host "   Dockerfile CordenaAi nao encontrado -- clone o repo CordenaAi primeiro" -ForegroundColor Red
    exit 1
}

# ── 2. Rede compartilhada luma-net ────────────────────────────────────────────
Write-Step "[2/8] Criando rede luma-net..."
$netExists = (docker network ls --filter name=luma-net --format "{{.Name}}") -eq 'luma-net'
if ($netExists) {
    Write-Host "   luma-net ja existe"
} else {
    docker network create luma-net
    Write-Host "   OK: luma-net criada"
}

# ── 3. TS3 dados ─────────────────────────────────────────────────────────────
Write-Step "[3/8] Restaurando dados TS3..."
$ts3DataSrc = Join-Path $ExportDir "ts3-data\ts3-data"
if (Test-Path $ts3DataSrc) {
    $ts3Dest = "$TS3Root\volumes\ts3-data"
    if (Test-Path $ts3Dest) {
        # Backup do existente por seguranca
        Rename-Item $ts3Dest "$ts3Dest.bak.$(Get-Date -Format 'yyyyMMddHHmm')" -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Force -Path "$TS3Root\volumes" | Out-Null
    Copy-Item -Recurse -Force $ts3DataSrc $ts3Dest
    New-Item -ItemType Directory -Force -Path "$TS3Root\volumes\ts3-logs" | Out-Null
    Write-Host "   OK: ts3-data restaurado"
} else {
    Write-Host "   AVISO: ts3-data nao encontrado no export" -ForegroundColor Yellow
}

# ── 4. n8n: restaurar volume n8n_storage ─────────────────────────────────────
Write-Step "[4/8] Restaurando volume n8n (n8n_storage)..."
$n8nStorageTar = Join-Path $ExportDir "n8n-storage.tar.gz"
if (Test-Path $n8nStorageTar) {
    # Cria volume se nao existe
    docker volume create cordenaain8n_n8n_storage | Out-Null
    # Restaura conteudo
    docker run --rm `
        -v "cordenaain8n_n8n_storage:/data" `
        -v "${ExportDir}:/backup:ro" `
        alpine `
        sh -c "cd /data && tar xzf /backup/n8n-storage.tar.gz"
    Write-Host "   OK: n8n_storage restaurado"
} else {
    Write-Host "   AVISO: n8n-storage.tar.gz nao encontrado" -ForegroundColor Yellow
}

# ── 5. n8n: restaurar banco PostgreSQL ───────────────────────────────────────
Write-Step "[5/8] Restaurando banco n8n (pg_dump)..."
$n8nDump = Join-Path $ExportDir "n8n-db.dump"
if (Test-Path $n8nDump) {
    # Inicia apenas postgres do n8n para restaurar
    $n8nCompose = "$N8nRoot\docker-compose.prd.yml"
    $n8nEnv     = "$N8nRoot\.env"
    Write-Host "   Iniciando postgres n8n temporariamente..."
    docker compose -f $n8nCompose --env-file $n8nEnv up -d postgres 2>&1 | Out-Null
    Start-Sleep -Seconds 12

    # Le credenciais do .env
    $pgUser = 'n8n'; $pgPass = ''; $pgDb = 'n8n'
    foreach ($line in Get-Content $n8nEnv) {
        if ($line -match '^POSTGRES_NON_ROOT_USER=(.+)$')     { $pgUser = $Matches[1].Trim() }
        if ($line -match '^POSTGRES_NON_ROOT_PASSWORD=(.+)$') { $pgPass = $Matches[1].Trim() }
        if ($line -match '^POSTGRES_DB=(.+)$')                { $pgDb   = $Matches[1].Trim() }
    }

    # Copia dump para container e restaura
    docker cp $n8nDump "cordenaain8n-postgres-1:/tmp/n8n-db.dump"
    docker exec cordenaain8n-postgres-1 `
        pg_restore -U $pgUser -d $pgDb --no-owner --no-acl `
        --clean --if-exists /tmp/n8n-db.dump 2>&1 | Out-Null

    Write-Host "   OK: banco n8n restaurado"
} else {
    Write-Host "   AVISO: n8n-db.dump nao encontrado - banco iniciara vazio" -ForegroundColor Yellow
}

# ── 6. Supabase: restaurar banco ─────────────────────────────────────────────
Write-Step "[6/8] Restaurando banco Supabase..."
$supaSql = Join-Path $ExportDir "supabase-full.sql"
if (Test-Path $supaSql) {
    # Inicia apenas supabase-db
    $supaCompose = "$LumaRoot\infra\supabase\docker-compose.yml"
    $supaEnv     = "$LumaRoot\infra\supabase\.env"
    Write-Host "   Iniciando supabase-db temporariamente..."
    docker compose -f $supaCompose --env-file $supaEnv up -d supabase-db 2>&1 | Out-Null
    Start-Sleep -Seconds 15

    docker cp $supaSql "supabase-supabase-db-1:/tmp/supabase-full.sql"
    docker exec supabase-supabase-db-1 `
        psql -U supabase_admin -f /tmp/supabase-full.sql 2>&1 | Out-Null
    Write-Host "   OK: banco supabase restaurado"
} else {
    Write-Host "   AVISO: supabase-full.sql nao encontrado" -ForegroundColor Yellow
    Write-Host "   Alternativa: descompacte supabase-db-data.zip em:" -ForegroundColor Yellow
    Write-Host "   $LumaRoot\infra\supabase\volumes\db\data" -ForegroundColor Yellow
}

# ── 7. Stacks em ordem ────────────────────────────────────────────────────────
Write-Step "[7/8] Iniciando todos os stacks..."

# Proxy primeiro (Traefik + cloudflared)
Write-Host "   Iniciando proxy..."
$proxyCompose = "$LumaRoot\infra\proxy\docker-compose.yml"
$proxyEnv     = "$LumaRoot\infra\proxy\.env"
docker compose -f $proxyCompose --env-file $proxyEnv up -d 2>&1 | Out-Null
Start-Sleep -Seconds 5
Write-Host "   OK: proxy"

# Supabase completo
Write-Host "   Iniciando supabase..."
$supaCompose = "$LumaRoot\infra\supabase\docker-compose.yml"
$supaEnv     = "$LumaRoot\infra\supabase\.env"
docker compose -f $supaCompose --env-file $supaEnv up -d 2>&1 | Out-Null
Start-Sleep -Seconds 10
Write-Host "   OK: supabase"

# n8n (CordenaAi)
Write-Host "   Iniciando n8n..."
$n8nCompose = "$N8nRoot\docker-compose.prd.yml"
$n8nEnv     = "$N8nRoot\.env"
docker compose -f $n8nCompose --env-file $n8nEnv up -d 2>&1 | Out-Null
Start-Sleep -Seconds 5
Write-Host "   OK: n8n"

# TS3
Write-Host "   Iniciando TS3..."
Push-Location $TS3Root
docker compose up -d 2>&1 | Out-Null
Pop-Location
Write-Host "   OK: ts3"

# ── 8. Firewall ───────────────────────────────────────────────────────────────
Write-Step "[8/8] Configurando firewall..."

# Portas HTTP/HTTPS para Traefik
$rules = @(
    @{ Name = "HTTP Inbound";             Protocol = "TCP"; Port = 80   },
    @{ Name = "HTTPS Inbound";            Protocol = "TCP"; Port = 443  },
    @{ Name = "TS3 Voice (UDP 9987)";     Protocol = "UDP"; Port = 9987 },
    @{ Name = "TS3 Query (TCP 10011)";    Protocol = "TCP"; Port = 10011 },
    @{ Name = "TS3 Transfer (TCP 30033)"; Protocol = "TCP"; Port = 30033 }
)
foreach ($rule in $rules) {
    $exists = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($exists) {
        Write-Host "   Ja existe: $($rule.Name)"
    } else {
        New-NetFirewallRule `
            -DisplayName $rule.Name `
            -Direction   Inbound `
            -Protocol    $rule.Protocol `
            -LocalPort   $rule.Port `
            -Action      Allow `
            -Profile     Any | Out-Null
        Write-Host "   Criada: $($rule.Name)"
    }
}

# ── Resultado ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Restore concluido!" -ForegroundColor Green
Write-Host ""
Write-Host " Status dos containers:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}`t{{.Status}}"
Write-Host ""
Write-Host " PASSOS MANUAIS RESTANTES:" -ForegroundColor Yellow
Write-Host "   1. Cloudflare DNS: atualizar A record ts.nicebyte.ia.br"
Write-Host "      -> IP publico desta maquina (nuvem CINZA, sem proxy)"
Write-Host "   2. Cloudflare Tunnel: verificar ou recriar tunnel"
Write-Host "      Se mesmo tunnel UUID: apenas garanta que cloudflared/.json esta correto"
Write-Host "      Se novo tunnel: gere novo token em dash.cloudflare.com"
Write-Host "   3. Windows Scheduled Task (auto-deploy):"
Write-Host "      cd $LumaRoot && powershell infra\install-task-scheduler.ps1"
Write-Host "   4. Git hooks:"
Write-Host "      cd $LumaRoot && powershell infra\install-hooks.ps1"
Write-Host "   5. Testar acesso: https://luma-status.nicebyte.ia.br"
Write-Host "   6. TS3 primeiro acesso: docker logs ts3-server | grep token"
Write-Host "============================================================" -ForegroundColor Green

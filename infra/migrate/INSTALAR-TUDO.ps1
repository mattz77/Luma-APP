# INSTALAR-TUDO.ps1 -- Migração completa Luma Self-Hosted
# Execute como Administrador. Se precisar de reboot, re-execute apos reiniciar.
# O script detecta onde parou e continua automaticamente.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File INSTALAR-TUDO.ps1 -ExportDir "C:\caminho\luma-migrate-..."
#
# Parametros:
#   -ExportDir   (obrigatorio) pasta gerada por 01-export.ps1
#   -LumaRepo    URL git do Luma-APP (default: https://github.com/mattz77/Luma-APP.git)
#   -CordenaRepo URL git do CordenaAi
#   -LumaRoot    onde clonar Luma-APP   (default: C:\Users\<user>\Documents\Luma-APP)
#   -N8nRoot     onde clonar CordenaAi  (default: C:\Users\<user>\Documents\CordenaAi)
#   -TS3Root     onde colocar TS3       (default: C:\Users\<user>\Documents\Claude\Projects\TS3 Server para CS2 (Self-hosted))

#Requires -RunAsAdministrator

param(
    [Parameter(Mandatory=$true)]
    [string]$ExportDir,

    [string]$LumaRepo    = "https://github.com/mattz77/Luma-APP.git",
    [string]$CordenaRepo = "",   # preencha se repositorio privado

    [string]$LumaRoot    = "C:\Users\$env:USERNAME\Documents\Luma-APP",
    [string]$N8nRoot     = "C:\Users\$env:USERNAME\Documents\CordenaAi\commitBriefing",
    [string]$TS3Root     = "C:\Users\$env:USERNAME\Documents\Claude\Projects\TS3 Server para CS2 (Self-hosted)"
)

$ErrorActionPreference = 'Stop'
$StateFile = "C:\luma-install-state.txt"

# ── Utilidades ────────────────────────────────────────────────────────────────

function Write-Step {
    param([string]$Msg)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " $Msg" -ForegroundColor Cyan
    Write-Host "============================================================"
}

function Write-OK   { param([string]$M) Write-Host "  [OK] $M" -ForegroundColor Green  }
function Write-Warn { param([string]$M) Write-Host "  [!]  $M" -ForegroundColor Yellow }
function Write-Err  { param([string]$M) Write-Host "  [X]  $M" -ForegroundColor Red    }

function Get-State  { if (Test-Path $StateFile) { [int](Get-Content $StateFile) } else { 0 } }
function Set-State  { param([int]$S) Set-Content $StateFile $S -Encoding ascii }

function Pause-Manual {
    param([string]$Instruction)
    Write-Host ""
    Write-Host ">>> ACAO MANUAL NECESSARIA <<<" -ForegroundColor Yellow
    Write-Host "    $Instruction" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pressione ENTER quando pronto..." -ForegroundColor Cyan
    Read-Host | Out-Null
}

function Test-Cmd { param([string]$C) return $null -ne (Get-Command $C -ErrorAction SilentlyContinue) }

function Wait-DockerEngine {
    Write-Warn "Aguardando Docker Engine iniciar..."
    $attempts = 0
    while ($attempts -lt 30) {
        try { docker version 2>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { break } } catch {}
        Start-Sleep -Seconds 10
        $attempts++
        Write-Host "   ... $($attempts * 10)s" -NoNewline
    }
    Write-Host ""
    if ($attempts -ge 30) {
        Write-Err "Docker nao iniciou em 5 minutos."
        Write-Err "Abra Docker Desktop manualmente, aguarde engine verde, e re-execute este script."
        exit 1
    }
    Write-OK "Docker Engine ativo"
}

# ── Verificacoes iniciais ─────────────────────────────────────────────────────

if (-not (Test-Path $ExportDir)) {
    Write-Err "ExportDir nao encontrado: $ExportDir"
    Write-Err "Copie a pasta de export para esta maquina e passe o caminho correto."
    exit 1
}

$state = Get-State

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host " LUMA SELF-HOSTED -- INSTALACAO COMPLETA" -ForegroundColor Magenta
Write-Host " Estado atual: fase $state" -ForegroundColor Magenta
Write-Host " Export: $ExportDir" -ForegroundColor Magenta
Write-Host "============================================================"

# =============================================================================
# FASE 0 -- Prerequisitos + WSL2 (pode exigir reboot)
# =============================================================================
if ($state -eq 0) {
    Write-Step "FASE 0/5 -- Instalando prerequisitos"

    $needReboot = $false

    # winget
    if (-not (Test-Cmd 'winget')) {
        Write-Err "winget nao encontrado. Instale App Installer pela Microsoft Store:"
        Write-Err "https://apps.microsoft.com/store/detail/app-installer/9NBLGGH4NNS1"
        exit 1
    }
    Write-OK "winget: $(winget --version)"

    # WSL2
    $wslFeat = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
    $vmFeat  = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
    if ($wslFeat.State -ne 'Enabled') {
        Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart | Out-Null
        $needReboot = $true; Write-OK "WSL habilitado (reboot necessario)"
    } else { Write-OK "WSL ja ativo" }
    if ($vmFeat.State -ne 'Enabled') {
        Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart | Out-Null
        $needReboot = $true; Write-OK "VirtualMachinePlatform habilitado"
    } else { Write-OK "VirtualMachinePlatform ja ativo" }

    # Docker Desktop
    if (Test-Cmd 'docker') {
        Write-OK "Docker ja instalado: $(docker --version)"
    } else {
        Write-Warn "Instalando Docker Desktop (pode demorar)..."
        winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements --silent
        $needReboot = $true; Write-OK "Docker Desktop instalado"
    }

    # Git
    if (Test-Cmd 'git') {
        Write-OK "Git ja instalado: $(git --version)"
    } else {
        winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements --silent
        $env:PATH += ";C:\Program Files\Git\cmd"
        Write-OK "Git instalado"
    }

    # Python
    if (Test-Cmd 'python') {
        Write-OK "Python ja instalado: $(python --version 2>&1)"
    } else {
        winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements --silent
        Write-OK "Python instalado"
    }

    # Node.js
    if (Test-Cmd 'node') {
        Write-OK "Node.js ja instalado: $(node --version)"
    } else {
        winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
        Write-OK "Node.js instalado"
    }

    if ($needReboot) {
        Set-State 1
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Yellow
        Write-Host " REBOOT NECESSARIO" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor Yellow
        Write-Host " Apos reiniciar:" -ForegroundColor Yellow
        Write-Host "   1. Abra o Docker Desktop" -ForegroundColor Yellow
        Write-Host "   2. Aguarde a engine ficar verde (whale no systray)" -ForegroundColor Yellow
        Write-Host "   3. Re-execute este script com os mesmos parametros:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`" -ExportDir `"$ExportDir`"" -ForegroundColor White
        Write-Host "============================================================" -ForegroundColor Yellow
        exit 0
    } else {
        Set-State 1
        $state = 1
    }
}

# =============================================================================
# FASE 1 -- Docker Engine + clonar repositorios
# =============================================================================
if ($state -eq 1) {
    Write-Step "FASE 1/5 -- Docker Engine + Repositorios"

    Wait-DockerEngine

    # Clone Luma-APP
    if (Test-Path "$LumaRoot\.git") {
        Write-OK "Luma-APP ja clonado: $LumaRoot"
    } else {
        Write-Warn "Clonando Luma-APP..."
        git clone $LumaRepo $LumaRoot
        Write-OK "Luma-APP clonado"
    }

    # Clone CordenaAi
    $cordenaRoot = Split-Path $N8nRoot -Parent
    if (Test-Path "$cordenaRoot\.git") {
        Write-OK "CordenaAi ja clonado: $cordenaRoot"
    } elseif ($CordenaRepo) {
        Write-Warn "Clonando CordenaAi..."
        git clone $CordenaRepo $cordenaRoot
        Write-OK "CordenaAi clonado"
    } else {
        Write-Warn "CordenaRepo nao informado -- clone manualmente:"
        Pause-Manual "Clone o repo CordenaAi em: $cordenaRoot`nDepois pressione ENTER para continuar."
    }

    # TS3 pasta
    if (-not (Test-Path $TS3Root)) {
        Pause-Manual "Copie a pasta 'TS3 Server para CS2 (Self-hosted)' para:`n$TS3Root`n(docker-compose.yml + scripts\ -- SEM volumes\)`nDepois pressione ENTER."
    } else {
        Write-OK "TS3 pasta encontrada"
    }

    Set-State 2
    $state = 2
}

# =============================================================================
# FASE 2 -- Copiar segredos (.env + certs)
# =============================================================================
if ($state -eq 2) {
    Write-Step "FASE 2/5 -- Segredos (.env + certificados)"

    Write-Host ""
    Write-Host "  Copie os seguintes arquivos por canal seguro (USB/SFTP)" -ForegroundColor Yellow
    Write-Host "  para os caminhos indicados NESTA maquina:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  ORIGEM (maquina velha)                                  DESTINO (esta maquina)" -ForegroundColor Gray
    Write-Host "  ─────────────────────────────────────────────────────   ────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  infra\proxy\.env                                     -> $LumaRoot\infra\proxy\.env"
    Write-Host "    (contem CF_DNS_TOKEN, CF_ZONE_ID, CROWDSEC_API_KEY)"
    Write-Host "  infra\proxy\cloudflared\2cae17fe-...json             -> $LumaRoot\infra\proxy\cloudflared\"
    Write-Host "  infra\proxy\cloudflared\cert.pem                     -> $LumaRoot\infra\proxy\cloudflared\"
    Write-Host "  infra\proxy\traefik\certs\origin.crt                 -> $LumaRoot\infra\proxy\traefik\certs\"
    Write-Host "  infra\proxy\traefik\certs\origin.key                 -> $LumaRoot\infra\proxy\traefik\certs\"
    Write-Host "  infra\proxy\traefik\certs\origin.pfx                 -> $LumaRoot\infra\proxy\traefik\certs\"
    Write-Host "  infra\supabase\.env                                  -> $LumaRoot\infra\supabase\.env"
    Write-Host "  CordenaAi\commitBriefing\.env                        -> $N8nRoot\.env"
    Write-Host "  TS3 Server\.env                                      -> $TS3Root\.env"
    Write-Host ""

    Pause-Manual "Copie TODOS os arquivos acima. Pressione ENTER quando todos estiverem no lugar."

    # Valida arquivos criticos
    $missing = @()
    @(
        "$LumaRoot\infra\proxy\.env",
        "$LumaRoot\infra\supabase\.env",
        "$N8nRoot\.env",
        "$TS3Root\.env"
    ) | ForEach-Object { if (-not (Test-Path $_)) { $missing += $_ } }

    if ($missing.Count -gt 0) {
        Write-Err "Arquivos .env ainda faltando:"
        $missing | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
        Write-Err "Copie os arquivos e re-execute o script (fase 2 sera repetida)."
        exit 1
    }

    Write-OK "Todos os .env encontrados"
    Set-State 3
    $state = 3
}

# =============================================================================
# FASE 3 -- Build imagens Docker customizadas
# =============================================================================
if ($state -eq 3) {
    Write-Step "FASE 3/5 -- Build imagens Docker customizadas"

    # luma/portfolio -- carrega do tar (sem Dockerfile publico)
    $portfolioTar = Join-Path $ExportDir "portfolio-image.tar"
    if (Test-Path $portfolioTar) {
        Write-Warn "Carregando luma/portfolio do tar..."
        docker load -i $portfolioTar
        Write-OK "luma/portfolio carregado"
    } else {
        Write-Warn "portfolio-image.tar nao encontrado no export -- pulando"
    }

    # luma/web -- Dockerfile em git
    Write-Warn "Building luma/web..."
    $lumaWebDir = "$LumaRoot\infra\proxy\luma-web"
    docker build -t luma/web -f "$lumaWebDir\Dockerfile" $lumaWebDir 2>&1 | Out-Null
    Write-OK "luma/web pronto"

    # cordenaain8n-n8n e runner -- Dockerfile em CordenaAi
    Write-Warn "Building cordenaain8n-n8n..."
    docker build -t cordenaain8n-n8n -f "$N8nRoot\Dockerfile" $N8nRoot 2>&1 | Out-Null
    Write-OK "cordenaain8n-n8n pronto"

    Write-Warn "Building cordenaain8n-n8n-runner..."
    docker build -t cordenaain8n-n8n-runner -f "$N8nRoot\Dockerfile.runner" $N8nRoot 2>&1 | Out-Null
    Write-OK "cordenaain8n-n8n-runner pronto"

    Set-State 4
    $state = 4
}

# =============================================================================
# FASE 4 -- Restaurar dados + subir stacks
# =============================================================================
if ($state -eq 4) {
    Write-Step "FASE 4/5 -- Restaurar dados e subir todos os stacks"

    $restoreScript = "$LumaRoot\infra\migrate\02-restore.ps1"
    if (-not (Test-Path $restoreScript)) {
        Write-Err "02-restore.ps1 nao encontrado em $LumaRoot\infra\migrate\"
        Write-Err "Verifique se o clone do Luma-APP foi feito corretamente."
        exit 1
    }

    & $restoreScript -ExportDir $ExportDir -LumaRoot $LumaRoot -N8nRoot $N8nRoot -TS3Root $TS3Root

    Set-State 5
    $state = 5
}

# =============================================================================
# FASE 5 -- Pos-instalacao: Task Scheduler, hooks, firewall
# =============================================================================
if ($state -eq 5) {
    Write-Step "FASE 5/5 -- Finalizacao"

    # Task Scheduler (auto-pull + DDNS diario 04h)
    Write-Warn "Registrando Task Scheduler..."
    & "$LumaRoot\infra\install-task-scheduler.ps1"
    Write-OK "Task Scheduler registrado"

    # Git hooks
    Write-Warn "Instalando git hooks..."
    & "$LumaRoot\infra\install-hooks.ps1"
    Write-OK "Hooks instalados"

    # Limpa arquivo de estado
    Remove-Item $StateFile -Force -ErrorAction SilentlyContinue

    # ── Resultado final ───────────────────────────────────────────────────────
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " INSTALACAO CONCLUIDA!" -ForegroundColor Green
    Write-Host "============================================================"
    Write-Host ""
    Write-Host " Containers em execucao:" -ForegroundColor Yellow
    docker ps --format "table {{.Names}}`t{{.Status}}" 2>&1
    Write-Host ""
    Write-Host " PASSOS MANUAIS RESTANTES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Cloudflare DNS -- A record ts.nicebyte.ia.br"
    Write-Host "      Mude para o IP publico DESTA maquina (nuvem CINZA)"
    Write-Host "      IP publico atual: $((Invoke-RestMethod 'https://api.ipify.org' -TimeoutSec 5).Trim())"
    Write-Host ""
    Write-Host "   2. Cloudflare Tunnel -- verifique se o tunnel esta ativo:"
    Write-Host "      dash.cloudflare.com -> Zero Trust -> Access -> Tunnels"
    Write-Host "      O tunnel UUID 2cae17fe-... deve aparecer como HEALTHY"
    Write-Host ""
    Write-Host "   3. TS3 primeiro acesso (apenas se banco foi resetado):"
    Write-Host "      docker logs ts3-server 2>&1 | grep token"
    Write-Host ""
    Write-Host "   4. Testar tudo:"
    Write-Host "      https://luma-status.nicebyte.ia.br"
    Write-Host "      ts.nicebyte.ia.br:9987 (TeamSpeak)"
    Write-Host "============================================================" -ForegroundColor Green
}

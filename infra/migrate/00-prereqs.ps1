# 00-prereqs.ps1 -- Instala prerequisitos na maquina NOVA (Windows 11)
# Execute como Administrador uma unica vez antes de qualquer outra coisa.
# Compativel com Windows PowerShell 5.1 (sem pwsh, sem Unicode especial).
#
# O que instala:
#   - winget  (ja vem no Windows 11, mas verifica)
#   - Docker Desktop (com WSL2 backend)
#   - Git for Windows
#   - Python 3.12
#   - Node.js LTS  (necessario para EAS/Expo builds)
#
# Apos execucao: reiniciar o PC, depois abrir Docker Desktop manualmente
# e aguardar o engine iniciar antes de rodar 02-restore.ps1.

#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Msg)
    Write-Host ""
    Write-Host "==> $Msg" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Cmd)
    return $null -ne (Get-Command $Cmd -ErrorAction SilentlyContinue)
}

$NeedReboot = $false

# ── 1. Verificar winget ──────────────────────────────────────────────────────
Write-Step "Verificando winget..."
if (-not (Test-Command 'winget')) {
    Write-Host "winget nao encontrado. Instale App Installer pela Microsoft Store." -ForegroundColor Red
    Write-Host "URL: https://apps.microsoft.com/store/detail/app-installer/9NBLGGH4NNS1"
    Write-Host "Apos instalar, reabra o terminal como Admin e rode novamente."
    exit 1
}
Write-Host "winget OK: $(winget --version)"

# ── 2. Habilitar WSL2 (necessario para Docker Desktop) ──────────────────────
Write-Step "Habilitando WSL2..."
$wslFeature   = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
$vmFeature    = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

if ($wslFeature.State -ne 'Enabled') {
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart
    $NeedReboot = $true
    Write-Host "WSL habilitado (reboot necessario)"
} else {
    Write-Host "WSL ja habilitado"
}

if ($vmFeature.State -ne 'Enabled') {
    Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart
    $NeedReboot = $true
    Write-Host "VirtualMachinePlatform habilitado (reboot necessario)"
} else {
    Write-Host "VirtualMachinePlatform ja habilitado"
}

# ── 3. Docker Desktop ────────────────────────────────────────────────────────
Write-Step "Instalando Docker Desktop..."
$dockerInstalled = Test-Command 'docker'
if ($dockerInstalled) {
    Write-Host "Docker ja instalado: $(docker --version)"
} else {
    winget install -e --id Docker.DockerDesktop `
        --accept-source-agreements --accept-package-agreements --silent
    $NeedReboot = $true
    Write-Host "Docker Desktop instalado (reboot necessario para completar)"
}

# ── 4. Git ───────────────────────────────────────────────────────────────────
Write-Step "Instalando Git..."
if (Test-Command 'git') {
    Write-Host "Git ja instalado: $(git --version)"
} else {
    winget install -e --id Git.Git `
        --accept-source-agreements --accept-package-agreements --silent
    Write-Host "Git instalado"
    $env:PATH += ";C:\Program Files\Git\cmd"
}

# ── 5. Python 3.12 ───────────────────────────────────────────────────────────
Write-Step "Instalando Python 3.12..."
if (Test-Command 'python') {
    $pyVer = python --version 2>&1
    Write-Host "Python ja instalado: $pyVer"
} else {
    winget install -e --id Python.Python.3.12 `
        --accept-source-agreements --accept-package-agreements --silent
    Write-Host "Python instalado"
}

# ── 6. Node.js LTS ───────────────────────────────────────────────────────────
Write-Step "Instalando Node.js LTS..."
if (Test-Command 'node') {
    Write-Host "Node ja instalado: $(node --version)"
} else {
    winget install -e --id OpenJS.NodeJS.LTS `
        --accept-source-agreements --accept-package-agreements --silent
    Write-Host "Node.js instalado"
}

# ── 7. Dependencias Python para scripts TS3 ──────────────────────────────────
Write-Step "Instalando dependencias Python (ts3py)..."
if (Test-Command 'pip') {
    pip install ts3 --quiet
    Write-Host "ts3py instalado"
} else {
    Write-Host "pip nao disponivel ainda - rode 'pip install ts3' apos reboot" -ForegroundColor Yellow
}

# ── Resultado ────────────────────────────────────────────────────────────────
Write-Host ""
if ($NeedReboot) {
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host " REBOOT NECESSARIO para completar a instalacao." -ForegroundColor Yellow
    Write-Host " Apos reiniciar:" -ForegroundColor Yellow
    Write-Host "   1. Abra o Docker Desktop e aguarde o engine iniciar" -ForegroundColor Yellow
    Write-Host "   2. Copie os arquivos de export para esta maquina" -ForegroundColor Yellow
    Write-Host "   3. Copie os arquivos .env (manualmente, sem commitar)" -ForegroundColor Yellow
    Write-Host "   4. Execute: infra\migrate\02-restore.ps1" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
} else {
    Write-Host "Todos os prerequisitos OK. Sem necessidade de reboot." -ForegroundColor Green
    Write-Host "Proximo passo: copiar export + .env, depois rodar 02-restore.ps1"
}

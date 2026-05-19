# infra/deploy-app.ps1
# Deploy luma-app via EAS Update (OTA).
# Runs bun install if needed, then eas update.
# Usage: powershell infra/deploy-app.ps1 [-Branch production] [-Quiet] [-SkipInstall]

[CmdletBinding()]
param(
    [string] $Branch = 'production',
    [switch] $Quiet,
    [switch] $SkipInstall,
    [string] $Message = 'auto-deploy via scheduler'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $repoRoot 'luma-app'

$logDir = Join-Path $repoRoot 'infra\logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("deploy-app-{0:yyyyMMdd}.log" -f (Get-Date))

function Write-Log {
    param([string]$Msg, [string]$Level = 'INFO')
    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    Add-Content -Path $logFile -Value $line -Encoding utf8
    if (-not $Quiet) { Write-Host $line }
}

if (-not (Test-Path $appDir)) {
    Write-Log "luma-app dir not found: $appDir" 'ERROR'
    exit 1
}

Set-Location $appDir
Write-Log "Deploy app started - branch: $Branch"

# Detect EAS CLI
$easCmd = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easCmd) {
    $npxCmd = Get-Command npx -ErrorAction SilentlyContinue
    if (-not $npxCmd) {
        Write-Log "EAS CLI not found and npx not available" 'ERROR'
        exit 1
    }
    $easBin = 'npx'
    $easBaseArgs = @('eas-cli@latest')
} else {
    $easBin = 'eas'
    $easBaseArgs = @()
}

# Install deps
if (-not $SkipInstall) {
    Write-Log "Installing deps..."
    try {
        $bunCmd = Get-Command bun -ErrorAction SilentlyContinue
        if ($bunCmd) {
            & bun install --frozen-lockfile 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
        } else {
            & npm ci 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
        }
        Write-Log "Deps installed"
    } catch {
        Write-Log "Install failed: $_" 'ERROR'
        exit 1
    }
}

# EAS update (OTA)
Write-Log "Running eas update..."
try {
    $cmdArgs = $easBaseArgs + @('update', '--branch', $Branch, '--message', $Message, '--non-interactive')
    & $easBin @cmdArgs 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "eas update exited $LASTEXITCODE" }
    Write-Log "EAS update OK - branch: $Branch"
} catch {
    Write-Log "EAS update failed: $_" 'ERROR'
    exit 1
}

Write-Log "Deploy app finished"

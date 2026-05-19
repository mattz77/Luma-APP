# infra/deploy.ps1
# Idempotent deploy - brings up / recreates containers per stack.
# Usage: powershell infra/deploy.ps1 [-Stacks proxy,supabase,n8n] [-Quiet]

[CmdletBinding()]
param(
    [string[]] $Stacks = @('proxy', 'supabase', 'n8n'),
    [switch] $Quiet
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'infra\logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("deploy-{0:yyyyMMdd}.log" -f (Get-Date))

function Write-Log {
    param([string] $Msg, [string] $Level = 'INFO')
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] [$Level] $Msg"
    Add-Content -Path $logFile -Value $line -Encoding utf8
    if (-not $Quiet) { Write-Host $line }
}

Write-Log "Deploy started - stacks: $($Stacks -join ', ')"

# Ensure shared network
$networkCompose = Join-Path $repoRoot 'infra\docker-compose.network.yml'
if (Test-Path $networkCompose) {
    try {
        docker compose -f $networkCompose up -d 2>&1 | Out-Null
        Write-Log "Network ensured"
    } catch {
        Write-Log "Network setup failed: $_" 'WARN'
    }
}

foreach ($stack in $Stacks) {
    $composeFile = Join-Path $repoRoot "infra\$stack\docker-compose.yml"
    $envFile = Join-Path $repoRoot "infra\$stack\.env"

    if (-not (Test-Path $composeFile)) {
        Write-Log "Skipping $stack - compose file not found" 'WARN'
        continue
    }

    $dockerArgs = @('compose', '-f', $composeFile)
    if (Test-Path $envFile) { $dockerArgs += @('--env-file', $envFile) }
    $dockerArgs += @('up', '-d', '--remove-orphans')

    Write-Log "Deploying $stack ..."
    try {
        $output = & docker @dockerArgs 2>&1
        Write-Log "$stack - OK"
        if ($output) { Add-Content -Path $logFile -Value $output -Encoding utf8 }
    } catch {
        Write-Log "$stack FAILED: $_" 'ERROR'
        exit 1
    }
}

# Prune dangling images
try {
    docker image prune -f 2>&1 | Out-Null
    Write-Log "Image prune done"
} catch {
    Write-Log "Prune failed: $_" 'WARN'
}

Write-Log "Deploy finished"

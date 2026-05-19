# infra/auto-pull-deploy.ps1
# Called by Task Scheduler. Fetch, and IF new commits exist on origin/main,
# pull and run appropriate deploys (infra and/or app).

[CmdletBinding()]
param(
    [string] $Branch = 'main',
    [string] $Remote = 'origin'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logDir = Join-Path $repoRoot 'infra\logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("auto-pull-{0:yyyyMMdd}.log" -f (Get-Date))

function Log { param([string]$m) Add-Content -Path $logFile -Value ("[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $m) -Encoding utf8 }

# Uptime Kuma push monitor - URL comes from env var UPTIME_KUMA_PUSH_URL
# Format: https://luma-status.nicebyte.ia.br/api/push/<token>
function Push-Kuma {
    param(
        [ValidateSet('up', 'down')] [string] $Status = 'up',
        [string] $Message = 'OK',
        [int] $PingMs = 0
    )
    $url = $env:UPTIME_KUMA_PUSH_URL
    if (-not $url) { return }
    try {
        $fullUrl = "${url}?status=${Status}&msg=$([uri]::EscapeDataString($Message))&ping=${PingMs}"
        Invoke-RestMethod -Uri $fullUrl -Method Get -TimeoutSec 10 | Out-Null
        Log "Kuma push: $Status ($Message)"
    } catch {
        Log "Kuma push failed: $_"
    }
}

$startedAt = Get-Date
Log "Tick"

# Silent fetch
try {
    git fetch $Remote $Branch --quiet 2>&1 | Out-Null
} catch {
    Log "git fetch failed: $_"
    Push-Kuma -Status 'down' -Message "git fetch failed: $_"
    exit 0
}

$localSha = git rev-parse HEAD 2>$null
$remoteSha = git rev-parse "$Remote/$Branch" 2>$null

if ($localSha -eq $remoteSha) {
    Log "Up to date ($localSha)"
    $elapsed = [int]((Get-Date) - $startedAt).TotalMilliseconds
    Push-Kuma -Status 'up' -Message 'up-to-date' -PingMs $elapsed
    exit 0
}

Log "Remote ahead: local=$localSha remote=$remoteSha"

# Detect changes by area
$changedFiles = git diff --name-only "$localSha..$remoteSha" 2>$null

$infraChanged = $changedFiles | Where-Object {
    $_ -like 'infra/*' -and $_ -notlike 'infra/logs/*'
}

$appChanged = $changedFiles | Where-Object {
    $_ -like 'luma-app/*' `
        -and $_ -notlike 'luma-app/docs/*' `
        -and $_ -notlike 'luma-app/e2e/*' `
        -and $_ -notlike '*.test.*' `
        -and $_ -notlike '*.spec.*' `
        -and $_ -notlike '*.md'
}

# Pull first (deploys need files on disk)
try {
    git pull --ff-only $Remote $Branch 2>&1 | Out-Null
    Log "Pull OK"
} catch {
    Log "Pull failed: $_"
    Push-Kuma -Status 'down' -Message "pull failed: $_"
    exit 1
}

if (-not $infraChanged -and -not $appChanged) {
    Log "Pulled but no deployable changes"
    $elapsed = [int]((Get-Date) - $startedAt).TotalMilliseconds
    Push-Kuma -Status 'up' -Message 'pulled (no-op)' -PingMs $elapsed
    exit 0
}

$deployActions = @()

if ($infraChanged) {
    Log "Infra changed ($($infraChanged.Count) files) -> deploy.ps1"
    try {
        & "$repoRoot\infra\deploy.ps1" -Quiet
        Log "Infra deploy OK"
        $deployActions += "infra:$($infraChanged.Count)"
    } catch {
        Log "Infra deploy failed: $_"
        Push-Kuma -Status 'down' -Message "infra deploy failed: $_"
        exit 1
    }
}

if ($appChanged) {
    Log "App changed ($($appChanged.Count) files) -> deploy-app.ps1"
    try {
        & "$repoRoot\infra\deploy-app.ps1" -Quiet
        Log "App deploy OK"
        $deployActions += "app:$($appChanged.Count)"
    } catch {
        Log "App deploy failed: $_"
        Push-Kuma -Status 'down' -Message "app deploy failed: $_"
        exit 1
    }
}

$elapsed = [int]((Get-Date) - $startedAt).TotalMilliseconds
Push-Kuma -Status 'up' -Message "deployed: $($deployActions -join ', ')" -PingMs $elapsed
Log "All deploys finished"

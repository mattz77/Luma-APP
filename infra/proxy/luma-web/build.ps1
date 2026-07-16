# Build luma-web Docker image with EXPO_PUBLIC_* vars from luma-app/.env.local
# Usage:  pwsh infra/proxy/luma-web/build.ps1
# Assumes invoked from repo root.
$ErrorActionPreference = 'Stop'

$envFile = 'luma-app/.env.local'
if (-not (Test-Path $envFile)) {
    Write-Error "Missing $envFile. Cannot build web without EXPO_PUBLIC_* vars."
    exit 1
}

# Parse .env.local into hashtable (skip blanks/comments)
$vars = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $idx = $line.IndexOf('=')
        $k = $line.Substring(0, $idx).Trim()
        $v = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
        $vars[$k] = $v
    }
}

$required = @(
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_N8N_WEBHOOK_URL',
    'EXPO_PUBLIC_N8N_HMAC_SECRET',
    'EXPO_PUBLIC_N8N_JWT_SECRET'
)

$buildArgs = @()
foreach ($key in $required) {
    if (-not $vars.ContainsKey($key)) {
        Write-Error "Missing $key in $envFile"
        exit 1
    }
    $buildArgs += '--build-arg'
    $buildArgs += "$key=$($vars[$key])"
}

Write-Host "Building luma/web:latest with $($required.Count) EXPO_PUBLIC_* vars..." -ForegroundColor Cyan

docker build `
    -t luma/web:latest `
    -f infra/proxy/luma-web/Dockerfile `
    @buildArgs `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK. Built luma/web:latest" -ForegroundColor Green
} else {
    Write-Error "Build failed (exit $LASTEXITCODE)"
    exit $LASTEXITCODE
}

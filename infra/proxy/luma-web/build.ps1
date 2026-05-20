# Build luma-web Docker image (2-step: local export + nginx image)
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

foreach ($key in $required) {
    if (-not $vars.ContainsKey($key)) {
        Write-Error "Missing $key in $envFile"
        exit 1
    }
    [System.Environment]::SetEnvironmentVariable($key, $vars[$key], 'Process')
}

# Step 1: Export web bundle locally with EXPO_PUBLIC_* env vars
Write-Host "Step 1/2: Exporting Expo web bundle..." -ForegroundColor Cyan
Push-Location luma-app
try {
    if (Test-Path dist) { Remove-Item -Recurse -Force dist }
    npx expo export --platform web
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Expo export failed (exit $LASTEXITCODE)"
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# Step 2: Build nginx image with pre-built dist
Write-Host "Step 2/2: Building luma/web:latest Docker image..." -ForegroundColor Cyan
docker build `
    -t luma/web:latest `
    -f infra/proxy/luma-web/Dockerfile.prebuilt `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK. Built luma/web:latest" -ForegroundColor Green
    Write-Host "Deploy: docker compose --profile luma-web up -d luma-web" -ForegroundColor Yellow
} else {
    Write-Error "Docker build failed (exit $LASTEXITCODE)"
    exit $LASTEXITCODE
}

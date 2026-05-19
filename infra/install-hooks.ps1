# infra/install-hooks.ps1
# Copies versioned hooks (infra/hooks/) to .git/hooks/
# Run once after clone: powershell infra/install-hooks.ps1

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$srcDir = Join-Path $repoRoot 'infra\hooks'
$dstDir = Join-Path $repoRoot '.git\hooks'

if (-not (Test-Path $srcDir)) {
    throw "Source hooks dir not found: $srcDir"
}
if (-not (Test-Path $dstDir)) {
    throw ".git/hooks not found - not a valid git repo?"
}

$hooks = Get-ChildItem $srcDir -File | Where-Object { $_.Name -notlike '*.md' -and $_.Name -notlike '*.sample' }

foreach ($hook in $hooks) {
    $dst = Join-Path $dstDir $hook.Name
    Copy-Item -Path $hook.FullName -Destination $dst -Force
    Write-Host "Installed: $($hook.Name) -> .git/hooks/"
}

Write-Host ""
Write-Host "Hooks installed. Next 'git pull' that changes infra/ or luma-app/ will deploy."

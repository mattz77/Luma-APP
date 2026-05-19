# infra/install-task-scheduler.ps1
# Registers a Windows Task Scheduler job to run auto-pull-deploy every N min.
# Run once as Administrator:
#   powershell -ExecutionPolicy Bypass -File infra\install-task-scheduler.ps1

[CmdletBinding()]
param(
    [int] $IntervalMinutes = 5,
    [string] $TaskName = 'LumaInfraAutoDeploy',
    [string] $KumaPushUrl  # optional - if passed, saved as user env var
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot 'infra\auto-pull-deploy.ps1'

if (-not (Test-Path $scriptPath)) {
    throw "Script not found: $scriptPath"
}

# Persist Kuma URL as user env var (Task Scheduler inherits)
if ($KumaPushUrl) {
    [Environment]::SetEnvironmentVariable('UPTIME_KUMA_PUSH_URL', $KumaPushUrl, 'User')
    Write-Host "Env var UPTIME_KUMA_PUSH_URL saved (User scope)"
}

# Detect PowerShell binary (prefer pwsh, fallback powershell)
$pwshCmd = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwshCmd) {
    $psBin = $pwshCmd.Source
} else {
    $psBin = (Get-Command powershell).Source
}

$action = New-ScheduledTaskAction `
    -Execute $psBin `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
    -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

# Remove if already exists
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Auto pull + deploy Luma infra ($IntervalMinutes min)"

Write-Host "Task '$TaskName' registered. Runs every $IntervalMinutes min."
Write-Host "Check: Get-ScheduledTaskInfo -TaskName $TaskName"
Write-Host "Trigger now: Start-ScheduledTask -TaskName $TaskName"
Write-Host "Logs: $repoRoot\infra\logs\"

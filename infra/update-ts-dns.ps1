# infra/update-ts-dns.ps1 -- DDNS para ts.nicebyte.ia.br
# Atualiza o A record no Cloudflare se o IP publico mudou.
# Chamado pelo auto-pull-deploy.ps1 a cada tick (a cada 5 min).
# Compativel com Windows PowerShell 5.1 -- sem pwsh, ASCII-safe.
#
# Variaveis lidas de infra/proxy/.env:
#   CF_TOKEN_ACCESS  -- Cloudflare API token (permissao: Zone.DNS Edit)
#   CF_ZONE_ID       -- Zone ID do nicebyte.ia.br

$ErrorActionPreference = 'Stop'

$RecordName = 'ts.nicebyte.ia.br'
$ProxyEnv   = Join-Path $PSScriptRoot 'proxy\.env'
$LogDir     = Join-Path $PSScriptRoot 'logs'
$LogFile    = Join-Path $LogDir ("ts-dns-{0:yyyyMM}.log" -f (Get-Date))

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
    param([string]$Msg, [string]$Level = 'INFO')
    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Msg
    Add-Content -Path $LogFile -Value $line -Encoding utf8
}

# ── Le credenciais do .env ──────────────────────────────────────────────────
if (-not (Test-Path $ProxyEnv)) {
    Write-Log "proxy/.env nao encontrado: $ProxyEnv" 'ERROR'
    exit 1
}

$cfToken  = ''
$cfZoneId = ''
foreach ($line in Get-Content $ProxyEnv -Encoding utf8) {
    # CF_DNS_TOKEN tem prioridade (token com Zone.DNS Edit especifico para DDNS)
    # Fallback: CF_TOKEN_WAF (pode ter permissao mais ampla)
    if ($line -match '^CF_DNS_TOKEN=(.+)$')    { $cfToken  = $Matches[1].Trim() }
    if ($line -match '^CF_TOKEN_WAF=(.+)$' -and -not $cfToken) { $cfToken = $Matches[1].Trim() }
    if ($line -match '^CF_ZONE_ID=(.+)$')      { $cfZoneId = $Matches[1].Trim() }
}

if (-not $cfToken -or -not $cfZoneId) {
    Write-Log "CF_TOKEN_ACCESS ou CF_ZONE_ID ausentes no proxy/.env" 'ERROR'
    exit 1
}

$headers = @{
    'Authorization' = "Bearer $cfToken"
    'Content-Type'  = 'application/json'
}

# ── Obtem IP publico atual ───────────────────────────────────────────────────
try {
    $currentIp = (Invoke-RestMethod -Uri 'https://api.ipify.org' -TimeoutSec 10).Trim()
} catch {
    Write-Log "Falha ao obter IP publico: $_" 'WARN'
    exit 0
}

# ── Busca registro A atual no Cloudflare ─────────────────────────────────────
try {
    $listUrl = "https://api.cloudflare.com/client/v4/zones/$cfZoneId/dns_records?type=A&name=$RecordName"
    $resp    = Invoke-RestMethod -Uri $listUrl -Headers $headers -Method Get -TimeoutSec 10
} catch {
    Write-Log "Falha ao listar DNS records: $_" 'ERROR'
    exit 1
}

if (-not $resp.success -or $resp.result.Count -eq 0) {
    Write-Log "Registro A '$RecordName' nao encontrado na zona. Crie manualmente no Cloudflare." 'ERROR'
    exit 1
}

$record   = $resp.result[0]
$recordId = $record.id
$dnsIp    = $record.content

# ── Compara e atualiza se necessario ─────────────────────────────────────────
if ($dnsIp -eq $currentIp) {
    Write-Log "IP sem mudanca ($currentIp) -- nenhuma acao necessaria"
    exit 0
}

Write-Log "IP mudou: $dnsIp -> $currentIp. Atualizando Cloudflare..." 'WARN'

$body = @{
    type    = 'A'
    name    = $RecordName
    content = $currentIp
    ttl     = 60
    proxied = $false
} | ConvertTo-Json

try {
    $patchUrl = "https://api.cloudflare.com/client/v4/zones/$cfZoneId/dns_records/$recordId"
    $update   = Invoke-RestMethod -Uri $patchUrl -Headers $headers -Method Patch -Body $body -TimeoutSec 10
} catch {
    Write-Log "Falha ao atualizar DNS: $_" 'ERROR'
    exit 1
}

if ($update.success) {
    Write-Log "DNS atualizado: $RecordName -> $currentIp (era $dnsIp)" 'INFO'
} else {
    Write-Log "Cloudflare retornou erro: $($update.errors | ConvertTo-Json -Compress)" 'ERROR'
    exit 1
}

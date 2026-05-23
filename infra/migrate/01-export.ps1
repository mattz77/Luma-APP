# 01-export.ps1 -- Empacota TUDO para migracao entre maquinas
# Execute na maquina ATUAL (origem), como Administrador.
# Compativel com Windows PowerShell 5.1 (sem pwsh, sem Unicode especial).
#
# O que exporta:
#   - TS3 dados (bind mount)
#   - n8n volumes nomeados (cordenaain8n_db_storage + n8n_storage) + pg_dump
#   - Supabase DB (bind mount + pg_dump para seguranca)
#   - Configs proxy (traefik, cloudflared - sem segredos)
#   - Imagens Docker customizadas (nao publicas no Docker Hub)
#   - Manifest de arquivos .env que devem ser copiados manualmente
#
# SEGURANCA: arquivos .env NAO sao incluidos no export automaticamente.
# O script lista quais copiar -- voce os transfere por canal seguro.

#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'

$Timestamp   = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ExportDir   = "C:\Users\olive\Desktop\luma-migrate-$Timestamp"
$LumaRoot    = "C:\Users\olive\Documents\Luma-APP"
$TS3Root     = "C:\Users\olive\Documents\Claude\Projects\TS3 Server para CS2 (Self-hosted)"
$N8nRoot     = "C:\Users\olive\Documents\CordenaAi\commitBriefing"

New-Item -ItemType Directory -Force -Path $ExportDir | Out-Null

function Write-Step {
    param([string]$Msg)
    Write-Host ""
    Write-Host "==> $Msg" -ForegroundColor Cyan
}

function Export-DockerVolume {
    param([string]$VolumeName, [string]$DestFile)
    Write-Host "   Exportando volume $VolumeName..."
    docker run --rm `
        -v "${VolumeName}:/data:ro" `
        -v "${ExportDir}:/backup" `
        alpine `
        sh -c "tar czf /backup/$DestFile -C /data ."
    Write-Host "   OK: $DestFile"
}

function Export-DirAsArchive {
    param([string]$SrcPath, [string]$DestFile)
    Write-Host "   Arquivando $SrcPath..."
    $dest = Join-Path $ExportDir $DestFile
    Compress-Archive -Path "$SrcPath\*" -DestinationPath $dest -Force
    $sizeMB = [math]::Round((Get-Item $dest).Length / 1MB, 1)
    Write-Host "   OK: $DestFile ($sizeMB MB)"
}

# ── 1. TS3 dados (bind mount) ─────────────────────────────────────────────────
Write-Step "[1/7] Exportando TS3 dados..."
$ts3DataDest = Join-Path $ExportDir "ts3-data"
New-Item -ItemType Directory -Force -Path $ts3DataDest | Out-Null

# Pausa container para consistencia
docker pause ts3-server 2>$null
try {
    Copy-Item -Recurse -Force "$TS3Root\volumes\ts3-data" "$ts3DataDest\ts3-data"
    Copy-Item -Force "$TS3Root\docker-compose.yml" $ts3DataDest
    Copy-Item -Recurse -Force "$TS3Root\scripts" "$ts3DataDest\scripts"
} finally {
    docker unpause ts3-server 2>$null
}
Write-Host "   OK: ts3-data copiado"

# ── 2. n8n: pg_dump do banco ──────────────────────────────────────────────────
Write-Step "[2/7] Exportando n8n banco (pg_dump)..."
$n8nDbEnv = Join-Path $N8nRoot ".env"
# Le credenciais do .env sem expor no script
$pgUser = 'n8n'
$pgDb   = 'n8n'
if (Test-Path $n8nDbEnv) {
    foreach ($line in Get-Content $n8nDbEnv) {
        if ($line -match '^POSTGRES_NON_ROOT_USER=(.+)$') { $pgUser = $Matches[1].Trim() }
        if ($line -match '^POSTGRES_DB=(.+)$')           { $pgDb   = $Matches[1].Trim() }
    }
}
docker exec cordenaain8n-postgres-1 `
    pg_dump -U $pgUser -d $pgDb --no-owner --no-acl -Fc `
    -f /tmp/n8n-db.dump
docker cp "cordenaain8n-postgres-1:/tmp/n8n-db.dump" "$ExportDir\n8n-db.dump"
Write-Host "   OK: n8n-db.dump"

# ── 3. n8n: volumes nomeados ──────────────────────────────────────────────────
Write-Step "[3/7] Exportando volumes n8n..."
Export-DockerVolume "cordenaain8n_n8n_storage" "n8n-storage.tar.gz"
# db_storage eh reconstruido pelo pg_dump + restore, mas exporta como fallback
Export-DockerVolume "cordenaain8n_db_storage"  "n8n-db-storage-fallback.tar.gz"

# ── 4. Supabase: pg_dump ──────────────────────────────────────────────────────
Write-Step "[4/7] Exportando Supabase banco (pg_dump)..."
$supaRunning = (docker inspect supabase-supabase-db-1 --format "{{.State.Running}}" 2>$null) -eq 'true'
if (-not $supaRunning) {
    Write-Host "   Supabase DB parado - iniciando temporariamente..."
    $supaCompose = "$LumaRoot\infra\supabase\docker-compose.yml"
    $supaEnv     = "$LumaRoot\infra\supabase\.env"
    docker compose -f $supaCompose --env-file $supaEnv up -d supabase-db 2>&1 | Out-Null
    Start-Sleep -Seconds 10
}
docker exec supabase-supabase-db-1 `
    pg_dumpall -U supabase_admin --no-role-passwords `
    -f /tmp/supabase-full.sql
docker cp "supabase-supabase-db-1:/tmp/supabase-full.sql" "$ExportDir\supabase-full.sql"
Write-Host "   OK: supabase-full.sql"

# Tambem copia o bind mount raw (fallback/referencia)
Write-Host "   Copiando bind mount supabase (pode demorar)..."
$supaBind = "$LumaRoot\infra\supabase\volumes\db\data"
if (Test-Path $supaBind) {
    Compress-Archive -Path "$supaBind\*" `
        -DestinationPath "$ExportDir\supabase-db-data.zip" -Force
    $sizeMB = [math]::Round((Get-Item "$ExportDir\supabase-db-data.zip").Length / 1MB, 0)
    Write-Host "   OK: supabase-db-data.zip ($sizeMB MB)"
}

# ── 5. Configs proxy (sem segredos) ───────────────────────────────────────────
Write-Step "[5/7] Copiando configs proxy (traefik, cloudflared)..."
$proxyConfigDest = Join-Path $ExportDir "proxy-configs"
New-Item -ItemType Directory -Force -Path $proxyConfigDest | Out-Null
Copy-Item -Recurse -Force "$LumaRoot\infra\proxy\traefik" "$proxyConfigDest\traefik"
Copy-Item -Recurse -Force "$LumaRoot\infra\proxy\cloudflared" "$proxyConfigDest\cloudflared"
Copy-Item -Force "$LumaRoot\infra\proxy\docker-compose.yml" $proxyConfigDest
# Exporta volume crowdsec (modelo de ameacas, nao critico)
Export-DockerVolume "proxy_crowdsec-db" "proxy-crowdsec-db.tar.gz"
Write-Host "   OK: configs proxy copiadas"

# ── 6. Imagem luma/portfolio (sem Dockerfile no repo — salvar obrigatoriamente) ──
Write-Step "[6/7] Salvando imagem luma/portfolio..."
Write-Host "   Outras imagens customizadas (luma/web, cordenaain8n-*) tem Dockerfile"
Write-Host "   no repo e serao REBUILTADAS na nova maquina — nao precisam ser salvas."
$portfolioExists = (docker image inspect "luma/portfolio:latest" 2>$null; $LASTEXITCODE -eq 0)
if ($portfolioExists) {
    docker save "luma/portfolio:latest" -o "$ExportDir\portfolio-image.tar"
    $sizeMB = [math]::Round((Get-Item "$ExportDir\portfolio-image.tar").Length / 1MB, 0)
    Write-Host "   OK: portfolio-image.tar ($sizeMB MB)"
} else {
    Write-Host "   AVISO: luma/portfolio nao encontrada - reconstrua na nova maquina" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "   Para rebuildar na nova maquina apos o clone:" -ForegroundColor DarkGray
Write-Host "   luma/web:              docker build -t luma/web -f infra/proxy/luma-web/Dockerfile infra/proxy/luma-web/" -ForegroundColor DarkGray
Write-Host "   cordenaain8n-n8n:      docker build -t cordenaain8n-n8n -f Dockerfile . (em CordenaAi/commitBriefing)" -ForegroundColor DarkGray
Write-Host "   cordenaain8n-n8n-runner: docker build -t cordenaain8n-n8n-runner -f Dockerfile.runner . (idem)" -ForegroundColor DarkGray

# ── 7. Manifest de arquivos .env ─────────────────────────────────────────────
Write-Step "[7/7] Gerando manifest de segredos..."
$manifest = @"
# MANIFEST DE MIGRACAO -- $Timestamp
# Gerado por: 01-export.ps1
# =====================================================================
# ARQUIVOS .ENV -- copie MANUALMENTE por canal seguro (nao incluidos aqui)
# =====================================================================

COPIE ESTES ARQUIVOS .ENV MANUALMENTE PARA A NOVA MAQUINA:

  ORIGEM                                                    DESTINO (nova maquina)
  ─────────────────────────────────────────────────────     ──────────────────────────────────────────────
  C:\Users\olive\Documents\Luma-APP\infra\proxy\.env      → <repo>\infra\proxy\.env
    (contem: CF_DNS_TOKEN, CF_ZONE_ID, CF_TOKEN_ACCESS,
     CF_TOKEN_WAF, CROWDSEC_API_KEY)
  C:\Users\olive\Documents\Luma-APP\infra\supabase\.env   → <repo>\infra\supabase\.env
  C:\Users\olive\Documents\Luma-APP\infra\n8n\.env        → <repo>\infra\n8n\.env (se usado)
  C:\Users\olive\Documents\CordenaAi\commitBriefing\.env  → CordenaAi\commitBriefing\.env
  C:\Users\olive\Documents\Claude\Projects\TS3 Server para CS2 (Self-hosted)\.env
                                                           → <mesmo caminho na nova maquina>

# =====================================================================
# CONTEUDO DO EXPORT
# =====================================================================

  ts3-data/               -- dados TS3 (bind mount: ts3server.sqlitedb, files/)
  n8n-db.dump             -- banco n8n (pg_dump formato custom)
  n8n-storage.tar.gz      -- volume n8n /home/node/.n8n (workflows, credentials)
  n8n-db-storage-fallback.tar.gz -- volume postgres n8n (fallback)
  supabase-full.sql       -- pg_dumpall supabase
  supabase-db-data.zip    -- bind mount postgres supabase (fallback)
  proxy-configs/          -- traefik + cloudflared configs
  proxy-crowdsec-db.tar.gz-- volume crowdsec
  custom-images.tar       -- imagens Docker nao publicas

# =====================================================================
# PROXIMOS PASSOS NA NOVA MAQUINA
# =====================================================================

  1. Clone os repositorios:
       git clone https://github.com/mattz77/Luma-APP.git   C:\Users\<user>\Documents\Luma-APP
       git clone <CordenaAi-repo>                           C:\Users\<user>\Documents\CordenaAi
       Copie manualmente: Claude\Projects\TS3 Server para CS2 (Self-hosted)\

  2. Copie os arquivos .env listados acima (canal seguro: USB, SFTP, etc.)

  3. Copie esta pasta de export para a nova maquina

  4. Execute (como Admin): infra\migrate\02-restore.ps1

  5. Configure DNS Cloudflare:
       A  ts.nicebyte.ia.br → IP publico da nova maquina (nuvem CINZA)
       Tunnel: atualize o ID do tunnel no Cloudflare dashboard se necessario

"@
Set-Content -Path "$ExportDir\MANIFEST.txt" -Value $manifest -Encoding utf8

# ── Copia INSTALAR-TUDO.ps1 para raiz do export (ponto de entrada na nova maquina) ──
$installerSrc = Join-Path $PSScriptRoot "INSTALAR-TUDO.ps1"
if (Test-Path $installerSrc) {
    Copy-Item $installerSrc $ExportDir
    Write-Host "   OK: INSTALAR-TUDO.ps1 incluido no export"
} else {
    Write-Host "   AVISO: INSTALAR-TUDO.ps1 nao encontrado" -ForegroundColor Yellow
}

# ── Resultado ────────────────────────────────────────────────────────────────
$totalMB = [math]::Round((Get-ChildItem $ExportDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Export concluido!" -ForegroundColor Green
Write-Host " Pasta: $ExportDir"
Write-Host " Tamanho total: ~$totalMB MB"
Write-Host ""
Write-Host " LEIA: $ExportDir\MANIFEST.txt" -ForegroundColor Yellow
Write-Host " para lista de .env a copiar manualmente."
Write-Host "============================================================" -ForegroundColor Green

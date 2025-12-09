# Script para gerar secrets HMAC e JWT para n8n
# Execute: .\generate-secrets.ps1

Write-Host "Gerando secrets para n8n..." -ForegroundColor Cyan

# Funcao para gerar string aleatoria segura usando Base64
function Generate-RandomSecret {
    param([int]$Length = 64)
    
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    
    # Remover caracteres que podem causar problemas e garantir tamanho
    $secret = $secret -replace '[+/=]', ''
    if ($secret.Length -gt $Length) {
        $secret = $secret.Substring(0, $Length)
    }
    while ($secret.Length -lt $Length) {
        $secret += [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([Guid]::NewGuid().ToString()))
        $secret = $secret -replace '[+/=]', ''
    }
    $secret = $secret.Substring(0, $Length)
    
    return $secret
}

# Gerar secrets
$hmacSecret = Generate-RandomSecret -Length 64
$jwtSecret = Generate-RandomSecret -Length 64

Write-Host "Secrets gerados com sucesso!" -ForegroundColor Green
Write-Host ""

# Verificar se .env.local ja existe
$envFile = ".\.env.local"
$envExample = ".\env.example"

if (Test-Path $envFile) {
    Write-Host "Arquivo .env.local ja existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja sobrescrever? Digite 's' para sim"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Operacao cancelada." -ForegroundColor Yellow
        exit
    }
}

# Ler env.example para manter outras variaveis
$envContent = @()
if (Test-Path $envExample) {
    $envContent = Get-Content $envExample -Encoding UTF8
}

# Criar conteudo do .env.local
$newEnvContent = @()
$hmacFound = $false
$jwtFound = $false

foreach ($line in $envContent) {
    if ($line -match "^EXPO_PUBLIC_N8N_HMAC_SECRET=") {
        $newEnvContent += "EXPO_PUBLIC_N8N_HMAC_SECRET=$hmacSecret"
        $hmacFound = $true
    }
    elseif ($line -match "^EXPO_PUBLIC_N8N_JWT_SECRET=") {
        $newEnvContent += "EXPO_PUBLIC_N8N_JWT_SECRET=$jwtSecret"
        $jwtFound = $true
    }
    else {
        $newEnvContent += $line
    }
}

# Se nao encontrou as linhas, adicionar no final
if (-not $hmacFound) {
    $newEnvContent += "EXPO_PUBLIC_N8N_HMAC_SECRET=$hmacSecret"
}
if (-not $jwtFound) {
    $newEnvContent += "EXPO_PUBLIC_N8N_JWT_SECRET=$jwtSecret"
}

# Salvar arquivo
$newEnvContent | Out-File -FilePath $envFile -Encoding UTF8

Write-Host ""
Write-Host "Arquivo .env.local criado/atualizado em: $envFile" -ForegroundColor Green
Write-Host ""
Write-Host "Secrets gerados:" -ForegroundColor Cyan
Write-Host "   HMAC Secret: $($hmacSecret.Substring(0, [Math]::Min(20, $hmacSecret.Length)))..." -ForegroundColor Gray
Write-Host "   JWT Secret:  $($jwtSecret.Substring(0, [Math]::Min(20, $jwtSecret.Length)))..." -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   1. Configure o mesmo HMAC_SECRET no seu workflow n8n" -ForegroundColor Yellow
Write-Host "   2. Configure o mesmo JWT_SECRET no seu workflow n8n" -ForegroundColor Yellow
Write-Host "   3. Como voce esta no plano free, use um no 'Set' ou 'Code' para armazenar esses valores" -ForegroundColor Yellow
Write-Host "   4. NUNCA commite o arquivo .env.local (ja esta no .gitignore)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Reinicie o servidor Expo para aplicar as mudancas:" -ForegroundColor Cyan
Write-Host "   npx expo start --clear" -ForegroundColor White

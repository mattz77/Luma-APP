# 🧪 Como Testar o Webhook com curl no Windows

## 📋 Opções para Executar curl no Windows

### Opção 1: PowerShell (Recomendado - Já vem instalado)

#### Método A: Usando Invoke-WebRequest (nativo do PowerShell)

Abra o **PowerShell** e execute:

```powershell
Invoke-WebRequest -Uri "http://localhost:5678/webhook/luma-chat-enhanced" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"house_id":"test-house-id","user_id":"test-user-id","message":"Olá Luma!"}'
```

**Para ver a resposta formatada:**

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/luma-chat-enhanced" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"house_id":"test-house-id","user_id":"test-user-id","message":"Olá Luma!"}'

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

#### Método B: Usando curl.exe (se disponível)

No PowerShell, o `curl` pode ser um alias para `Invoke-WebRequest`. Para usar o curl real:

```powershell
curl.exe -X POST http://localhost:5678/webhook/luma-chat-enhanced `
  -H "Content-Type: application/json" `
  -d '{\"house_id\":\"test-house-id\",\"user_id\":\"test-user-id\",\"message\":\"Olá Luma!\"}'
```

**Nota:** No PowerShell, você precisa escapar as aspas duplas dentro da string JSON.

---

### Opção 2: CMD (Prompt de Comando)

Abra o **CMD** e execute:

```cmd
curl -X POST http://localhost:5678/webhook/luma-chat-enhanced -H "Content-Type: application/json" -d "{\"house_id\":\"test-house-id\",\"user_id\":\"test-user-id\",\"message\":\"Olá Luma!\"}"
```

**Nota:** No CMD, você precisa escapar as aspas duplas.

---

### Opção 3: Git Bash (Se tiver Git instalado)

Abra o **Git Bash** e execute exatamente como no Linux/Mac:

```bash
curl -X POST http://localhost:5678/webhook/luma-chat-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "house_id": "test-house-id",
    "user_id": "test-user-id",
    "message": "Olá Luma!"
  }'
```

---

### Opção 4: WSL (Windows Subsystem for Linux)

Se você tiver WSL instalado:

```bash
wsl
curl -X POST http://localhost:5678/webhook/luma-chat-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "house_id": "test-house-id",
    "user_id": "test-user-id",
    "message": "Olá Luma!"
  }'
```

---

## 🎯 Método Mais Fácil (PowerShell)

### Passo a Passo Completo:

1. **Abra o PowerShell:**
   - Pressione `Win + X`
   - Selecione "Windows PowerShell" ou "Terminal"
   - Ou pesquise "PowerShell" no menu Iniciar

2. **Execute o comando:**

```powershell
$body = @{
    house_id = "test-house-id"
    user_id = "test-user-id"
    message = "Olá Luma!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/luma-chat-enhanced" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

3. **Para ver a resposta formatada:**

```powershell
$body = @{
    house_id = "test-house-id"
    user_id = "test-user-id"
    message = "Olá Luma!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/luma-chat-enhanced" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Ver resposta formatada
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 📝 Script PowerShell Completo

Crie um arquivo `test-luma.ps1` com o seguinte conteúdo:

```powershell
# Teste do Webhook Luma
$uri = "http://localhost:5678/webhook/luma-chat-enhanced"

$body = @{
    house_id = "test-house-id"
    user_id = "test-user-id"
    message = "Olá Luma!"
} | ConvertTo-Json

Write-Host "Enviando mensagem para Luma..." -ForegroundColor Yellow
Write-Host "URL: $uri" -ForegroundColor Cyan
Write-Host "Mensagem: $($body)" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $uri `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Sucesso!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta do servidor:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
}
```

**Para executar:**
```powershell
.\test-luma.ps1
```

---

## 🔍 Verificar se o n8n está rodando

Antes de testar, verifique se o n8n está acessível:

```powershell
# Teste simples
Invoke-WebRequest -Uri "http://localhost:5678" -Method GET
```

Ou abra no navegador: `http://localhost:5678`

---

## ✅ Resultado Esperado

Se tudo estiver funcionando, você deve receber uma resposta como:

```json
{
  "success": true,
  "response": "Olá! Como posso ajudar você hoje?",
  "metadata": {
    "session_id": "test-house-id_test-user-id",
    "processing_time_ms": 1500,
    "tools_used": [],
    "model": "gpt-4o"
  }
}
```

---

## ⚠️ Troubleshooting

### Erro: "Não é possível conectar ao servidor remoto"
**Causa:** n8n não está rodando

**Solução:**
1. Verifique se o n8n está rodando: `http://localhost:5678`
2. Inicie o n8n se necessário

### Erro: "404 Not Found"
**Causa:** Path do webhook incorreto ou workflow não está ativo

**Solução:**
1. Verifique se o workflow está ativo no n8n
2. Verifique o path do webhook no workflow
3. Confirme que é `luma-chat-enhanced`

### Erro: "500 Internal Server Error"
**Causa:** Erro no workflow (credencial incorreta, etc.)

**Solução:**
1. Verifique os logs do n8n (Executions)
2. Verifique as credenciais (OpenAI, Supabase)
3. Verifique se todos os nós estão configurados corretamente

### Erro: "Timeout"
**Causa:** Workflow demorando muito para responder

**Solução:**
1. Verifique se a API da OpenAI está respondendo
2. Verifique os logs do n8n
3. Aumente o timeout se necessário

---

## 🎯 Teste Rápido (Copie e Cole)

**PowerShell (mais fácil):**

```powershell
$body = '{"house_id":"test-house-id","user_id":"test-user-id","message":"Olá Luma!"}'; Invoke-WebRequest -Uri "http://localhost:5678/webhook/luma-chat-enhanced" -Method POST -ContentType "application/json" -Body $body | Select-Object -ExpandProperty Content
```

---

## 📚 Alternativas ao curl

### 1. Postman
- Baixe: https://www.postman.com/downloads/
- Crie uma requisição POST
- URL: `http://localhost:5678/webhook/luma-chat-enhanced`
- Body (raw JSON):
```json
{
  "house_id": "test-house-id",
  "user_id": "test-user-id",
  "message": "Olá Luma!"
}
```

### 2. Insomnia
- Baixe: https://insomnia.rest/download
- Similar ao Postman

### 3. Navegador (apenas GET)
- Não funciona para POST, mas você pode testar se o n8n está rodando:
- Acesse: `http://localhost:5678`

---

**Última atualização:** 15 de novembro de 2025


# Diagnostico do Servidor Tauze ERP
Write-Host "=== DIAGNOSTICO DO SERVIDOR ===" -ForegroundColor Cyan

# 1. Testar servidor
Write-Host "`n[1] Testando servidor HTTP..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    Write-Host "OK - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Tamanho: $($response.Content.Length) bytes" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Verificar .env
Write-Host "`n[2] Verificando .env..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "OK - Arquivo .env existe" -ForegroundColor Green
} else {
    Write-Host "ERRO - Arquivo .env nao encontrado" -ForegroundColor Red
}

# 3. Verificar porta
Write-Host "`n[3] Verificando porta 5173..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "OK - Porta em uso (Estado: $($port.State))" -ForegroundColor Green
} else {
    Write-Host "ERRO - Porta nao esta em uso" -ForegroundColor Red
}

Write-Host "`n=== URLS DISPONIVEIS ===" -ForegroundColor Cyan
Write-Host "Local:   http://localhost:5173/" -ForegroundColor Green
Write-Host "Network: http://192.168.0.7:5173/" -ForegroundColor Green

Write-Host "`n=== SOLUCOES ===" -ForegroundColor Yellow
Write-Host "1. Limpar cache do navegador (Ctrl+Shift+Del)"
Write-Host "2. Abrir em modo anonimo/privado"
Write-Host "3. Verificar console do navegador (F12)"
Write-Host "4. Testar URL da rede: http://192.168.0.7:5173/"
Write-Host "5. Reiniciar servidor: Ctrl+C e npm run dev"

#!/usr/bin/env pwsh
# Script de diagnóstico do servidor de desenvolvimento

Write-Host "🔍 DIAGNÓSTICO DO SERVIDOR TAUZE ERP v5.0" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

# 1. Verificar se o servidor está rodando
Write-Host "1️⃣  Verificando processo do servidor..." -ForegroundColor Yellow
$viteProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" }
if ($viteProcess) {
    Write-Host "   ✅ Servidor está em execução (PID: $($viteProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ❌ Servidor NÃO está em execução" -ForegroundColor Red
    Write-Host "   💡 Execute: npm run dev" -ForegroundColor Yellow
    exit 1
}

# 2. Testar conectividade HTTP
Write-Host "`n2️⃣  Testando conectividade HTTP..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Servidor responde com status: $($response.StatusCode)" -ForegroundColor Green
    
    # Verificar tamanho da resposta
    $contentLength = $response.Content.Length
    Write-Host "   📦 Tamanho da resposta: $contentLength bytes" -ForegroundColor Cyan
    
    if ($contentLength -lt 500) {
        Write-Host "   ⚠️  Resposta muito pequena - pode haver erro de compilação" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao conectar: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Verificar variáveis de ambiente
Write-Host "`n3️⃣  Verificando variáveis de ambiente..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "   ✅ Arquivo .env encontrado" -ForegroundColor Green
    
    $envContent = Get-Content .env -Raw
    $requiredVars = @("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var está configurado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var NÃO encontrado" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ Arquivo .env NÃO encontrado" -ForegroundColor Red
    Write-Host "   💡 Copie .env.example para .env" -ForegroundColor Yellow
}

# 4. Verificar portas em uso
Write-Host "`n4️⃣  Verificando porta 5173..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "   ✅ Porta 5173 está em uso (normal)" -ForegroundColor Green
    Write-Host "   📍 Estado: $($portInUse.State)" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Porta 5173 NÃO está em uso" -ForegroundColor Red
}

# 5. Verificar firewall (apenas Windows)
Write-Host "`n5️⃣  Verificando firewall..." -ForegroundColor Yellow
if ($IsWindows -or ($PSVersionTable.PSVersion.Major -le 5)) {
    $firewallRules = Get-NetFirewallRule -DisplayName "*Node*" -ErrorAction SilentlyContinue
    if ($firewallRules) {
        Write-Host "   ℹ️  Regras de firewall para Node.js encontradas" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Nenhuma regra de firewall encontrada" -ForegroundColor Yellow
        Write-Host "   💡 Pode ser necessário permitir Node.js no firewall" -ForegroundColor Yellow
    }
}

# 6. Verificar browser
Write-Host "`n6️⃣  URLs disponíveis:" -ForegroundColor Yellow
Write-Host "   🌐 Local:   http://localhost:5173/" -ForegroundColor Green
Write-Host "   🌐 Network: http://$(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Ethernet*','Wi-Fi*' | Select-Object -First 1 -ExpandProperty IPAddress):5173/" -ForegroundColor Green

# 7. Dicas de troubleshooting
Write-Host "`n7️⃣  Dicas de resolução:" -ForegroundColor Yellow
Write-Host "   1. Limpar cache do navegador (Ctrl+Shift+Delete)" -ForegroundColor Cyan
Write-Host "   2. Testar no modo anônimo/privado" -ForegroundColor Cyan
Write-Host "   3. Verificar console do navegador (F12)" -ForegroundColor Cyan
Write-Host "   4. Reiniciar o servidor (Ctrl+C e npm run dev)" -ForegroundColor Cyan
Write-Host "   5. Limpar cache do Vite: npm run clean" -ForegroundColor Cyan

Write-Host "`n✅ Diagnóstico concluído!" -ForegroundColor Green
Write-Host ""

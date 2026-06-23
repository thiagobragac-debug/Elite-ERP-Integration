# Script de Validacao de Configuracao
# Verifica se todas as configuracoes necessarias estao corretas

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validacao de Configuracao - Tauze ERP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# 1. Verificar se .env existe
Write-Host "1. Verificando arquivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   OK: Arquivo .env encontrado" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "VITE_SUPABASE_URL=https://") {
        Write-Host "   OK: VITE_SUPABASE_URL configurado" -ForegroundColor Green
    } else {
        Write-Host "   ERRO: VITE_SUPABASE_URL nao configurado" -ForegroundColor Red
        $allOk = $false
    }
    
    if ($envContent -match "VITE_SUPABASE_ANON_KEY=eyJ") {
        Write-Host "   OK: VITE_SUPABASE_ANON_KEY configurado" -ForegroundColor Green
    } else {
        Write-Host "   ERRO: VITE_SUPABASE_ANON_KEY nao configurado" -ForegroundColor Red
        $allOk = $false
    }
    
} else {
    Write-Host "   ERRO: Arquivo .env NAO ENCONTRADO!" -ForegroundColor Red
    $allOk = $false
}

Write-Host ""

# 2. Verificar node_modules
Write-Host "2. Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   OK: node_modules instalado" -ForegroundColor Green
} else {
    Write-Host "   ERRO: node_modules NAO ENCONTRADO!" -ForegroundColor Red
    Write-Host "      Execute: npm install" -ForegroundColor Gray
    $allOk = $false
}

Write-Host ""

# 3. Verificar Git
Write-Host "3. Verificando Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "   OK: Repositorio Git inicializado" -ForegroundColor Green
    
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        if ($gitignoreContent -match "\.env") {
            Write-Host "   OK: .env esta no .gitignore" -ForegroundColor Green
        } else {
            Write-Host "   ERRO: .env NAO esta no .gitignore!" -ForegroundColor Red
            $allOk = $false
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "TUDO OK! Configuracao completa!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Voce pode:" -ForegroundColor Cyan
    Write-Host "  1. npm run dev" -ForegroundColor White
    Write-Host "  2. npm run healthcheck" -ForegroundColor White
} else {
    Write-Host "Ha problemas a corrigir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Execute: npm install" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Script de Análise de Código - Tauze ERP
# Uso: .\scripts\analyze.ps1

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Análise de Código - Tauze ERP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Tamanho do projeto
Write-Host "📦 Tamanho do Projeto:" -ForegroundColor Yellow
$tsxFiles = Get-ChildItem -Path .\src -Filter *.tsx -Recurse -File | Measure-Object -Property Length -Sum
$tsFiles = Get-ChildItem -Path .\src -Filter *.ts -Recurse -File | Measure-Object -Property Length -Sum
$totalFiles = $tsxFiles.Count + $tsFiles.Count
$totalLines = (Get-Content (Get-ChildItem -Path .\src -Include *.tsx,*.ts -Recurse -File) | Measure-Object -Line).Lines

Write-Host "   Arquivos TypeScript: $totalFiles" -ForegroundColor White
Write-Host "   Linhas de código: $totalLines" -ForegroundColor White
Write-Host ""

# Componentes vs Testes
Write-Host "🧪 Cobertura de Testes:" -ForegroundColor Yellow
$components = (Get-ChildItem -Path .\src\pages -Filter *.tsx -Recurse -File | Where-Object { $_.Name -notlike "*.test.tsx" }).Count
$tests = (Get-ChildItem -Path .\src -Filter *.test.tsx -Recurse -File).Count
$coverage = [math]::Round(($tests / $components) * 100, 1)

Write-Host "   Componentes totais: $components" -ForegroundColor White
Write-Host "   Arquivos de teste: $tests" -ForegroundColor White
Write-Host "   Cobertura estimada: $coverage%" -ForegroundColor $(if ($coverage -lt 30) { "Red" } elseif ($coverage -lt 60) { "Yellow" } else { "Green" })
Write-Host "   Meta: 60%" -ForegroundColor Gray
Write-Host ""

# Componentes grandes
Write-Host "📏 Componentes Grandes (>500 linhas):" -ForegroundColor Yellow
$largeFiles = Get-ChildItem -Path .\src -Include *.tsx,*.ts -Recurse -File | ForEach-Object {
    $lineCount = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($lineCount -gt 500) {
        [PSCustomObject]@{
            Name = $_.Name
            Lines = $lineCount
            Path = $_.FullName.Replace((Get-Location).Path, ".")
        }
    }
} | Sort-Object -Property Lines -Descending

if ($largeFiles) {
    $largeFiles | Select-Object -First 10 | ForEach-Object {
        $color = if ($_.Lines -gt 1000) { "Red" } elseif ($_.Lines -gt 750) { "Yellow" } else { "White" }
        Write-Host "   $($_.Lines) linhas - $($_.Name)" -ForegroundColor $color
    }
} else {
    Write-Host "   Nenhum arquivo grande encontrado!" -ForegroundColor Green
}
Write-Host ""

# TODOs e FIXMEs
Write-Host "⚠️  TODOs e FIXMEs:" -ForegroundColor Yellow
$todos = Select-String -Path .\src\*.tsx,.\src\*.ts -Pattern "TODO|FIXME|XXX|HACK" -Recurse | Measure-Object
Write-Host "   Total encontrado: $($todos.Count)" -ForegroundColor $(if ($todos.Count -gt 50) { "Red" } elseif ($todos.Count -gt 20) { "Yellow" } else { "White" })
Write-Host ""

# Dependências desatualizadas
Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow
$outdated = npm outdated 2>&1 | Select-String -Pattern "Package"
if ($outdated) {
    Write-Host "   Existem dependências desatualizadas!" -ForegroundColor Red
    Write-Host "   Execute: npm update" -ForegroundColor Gray
} else {
    Write-Host "   Todas as dependências estão atualizadas! ✅" -ForegroundColor Green
}
Write-Host ""

# Sumário
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$score = 0
if ($coverage -ge 60) { $score += 25 } elseif ($coverage -ge 40) { $score += 15 } elseif ($coverage -ge 20) { $score += 5 }
if ($largeFiles.Count -le 5) { $score += 25 } elseif ($largeFiles.Count -le 10) { $score += 15 }
if ($todos.Count -le 20) { $score += 25 } elseif ($todos.Count -le 50) { $score += 15 }
if (-not $outdated) { $score += 25 } else { $score += 10 }

Write-Host ""
Write-Host "   Score de Qualidade: $score/100" -ForegroundColor $(
    if ($score -ge 80) { "Green" } 
    elseif ($score -ge 60) { "Yellow" } 
    else { "Red" }
)

if ($score -lt 60) {
    Write-Host ""
    Write-Host "   Recomendações:" -ForegroundColor Yellow
    if ($coverage -lt 60) { Write-Host "   • Aumentar cobertura de testes" -ForegroundColor Gray }
    if ($largeFiles.Count -gt 10) { Write-Host "   • Refatorar componentes grandes" -ForegroundColor Gray }
    if ($todos.Count -gt 20) { Write-Host "   • Resolver TODOs pendentes" -ForegroundColor Gray }
    if ($outdated) { Write-Host "   • Atualizar dependências" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

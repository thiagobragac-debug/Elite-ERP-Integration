@echo off
:: Elite ERP - Sincronizacao GitHub
:: Use standard Windows-1252 code page and safe ASCII characters to avoid cmd.exe parsing bugs with UTF-8/emojis
setlocal enabledelayedexpansion
chcp 1252 > nul

echo ========================================
echo   Elite ERP - Sincronizacao GitHub
echo ========================================
echo.

:: Verifica se ha alteracoes
git status --short | findstr /R "^" >nul
if %errorlevel% neq 0 (
    echo [INFO] Nenhuma alteracao para sincronizar.
    timeout /t 3 >nul
    exit /b
)

echo [1/3] Adicionando alteracoes...
git add .

set /p commit_msg="Digite a mensagem do commit (ou pressione Enter para 'Sync automatico'): "
if "!commit_msg!"=="" set commit_msg=Sync automatico: %date% %time%

echo [2/3] Criando commit...
git commit -m "!commit_msg!"

echo [3/3] Enviando para o GitHub (main)...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   [SUCESSO] Projeto sincronizado!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   [ERRO] Falha ao sincronizar.
    echo ========================================
)

pause

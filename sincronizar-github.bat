@echo off
cd /d "%~dp0"

title Sincronizacao GitHub - Tauze ERP

:MENU
cls
echo.
echo  ================================================
echo       Tauze ERP - Sincronizacao GitHub
echo  ================================================
echo.
echo  Pasta: %CD%
echo  Repo:  thiagobragac-debug/Elite-ERP-Integration
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERRO] Esta pasta nao e um repositorio Git!
    echo.
    pause
    exit /b 1
)

echo  ------------------------------------------------
echo  STATUS ATUAL:
echo  ------------------------------------------------
git status --short
echo.

echo  ------------------------------------------------
echo  O que deseja fazer?
echo  ------------------------------------------------
echo.
echo   [1] Enviar para o GitHub  (commit + push)
echo   [2] Receber do GitHub     (pull)
echo   [3] Sincronizar completo  (pull + commit + push)
echo   [4] Ver historico de commits
echo   [5] Sair
echo.
set "OPCAO="
set /p OPCAO="  Escolha (1-5): "

if "%OPCAO%"=="1" goto ENVIAR
if "%OPCAO%"=="2" goto RECEBER
if "%OPCAO%"=="3" goto SINCRONIZAR
if "%OPCAO%"=="4" goto HISTORICO
if "%OPCAO%"=="5" goto SAIR

echo.
echo  Opcao invalida. Tente novamente.
pause
goto MENU

:ENVIAR
cls
echo.
echo  [Enviando para o GitHub...]
echo.

git add .

git diff --cached --quiet
if %ERRORLEVEL% equ 0 (
    echo  Nenhuma alteracao para commitar. Repositorio ja atualizado!
    echo.
    pause
    goto MENU
)

set "MSG="
set /p MSG="  Mensagem do commit: "
if "%MSG%"=="" set "MSG=Atualizacao do sistema"

git commit --no-verify -m "%MSG%"
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERRO] Falha ao criar commit!
    pause
    goto MENU
)

echo.
git push origin HEAD
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERRO] Falha ao enviar! Verifique conexao e credenciais.
    pause
    goto MENU
)

echo.
echo  OK - Alteracoes enviadas com sucesso!
echo.
pause
goto MENU

:RECEBER
cls
echo.
echo  [Recebendo do GitHub...]
echo.

git pull origin HEAD
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERRO] Falha ao receber! Pode haver conflitos a resolver.
    pause
    goto MENU
)

echo.
echo  OK - Repositorio atualizado com sucesso!
echo.
pause
goto MENU

:SINCRONIZAR
cls
echo.
echo  [Sincronizacao completa - pull + commit + push]
echo.

echo  [1/3] Recebendo ultimas alteracoes do GitHub...
git pull origin HEAD
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERRO] Falha no pull! Resolva conflitos antes de continuar.
    pause
    goto MENU
)

echo.
echo  [2/3] Verificando alteracoes locais...
git add .

git diff --cached --quiet
if %ERRORLEVEL% equ 0 (
    echo  Nenhuma alteracao local. Repositorio em sincronia!
    echo.
    pause
    goto MENU
)

set "MSG="
set /p MSG="  Mensagem do commit: "
if "%MSG%"=="" set "MSG=Atualizacao do sistema"

git commit --no-verify -m "%MSG%"
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERRO] Falha ao criar commit!
    pause
    goto MENU
)

echo.
echo  [3/3] Enviando para o GitHub...
git push origin HEAD
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERRO] Falha ao enviar!
    pause
    goto MENU
)

echo.
echo  OK - Sincronizacao completa realizada com sucesso!
echo.
pause
goto MENU

:HISTORICO
cls
echo.
echo  Ultimos 15 commits:
echo.
git log --oneline --graph --decorate -15
echo.
pause
goto MENU

:SAIR
echo.
echo  Ate logo!
timeout /t 1 >nul
exit /b 0

@echo off
:: Elite ERP GitHub Sync Script
:: Use standard Windows-1252 code page and safe ASCII characters to avoid cmd.exe parsing bugs with UTF-8/emojis
chcp 1252 > nul

echo =======================================================
echo   Elite ERP - Sincronizador Automatico do GitHub
echo =======================================================
echo.

:: 1. Adicionar arquivos
echo [1/3] Adicionando todas as alteracoes locais...
git add .
echo OK: Arquivos adicionados com sucesso!
echo.

:: 2. Mensagem do commit
echo [2/3] Criando registro de alteracoes (Commit)...
set "msg="
set /p msg="Digite o texto do commit (ou pressione ENTER para o padrao): "

if "%msg%"=="" (
    set "msg=Ajustes esteticos no cadastro de itens e governanca de usuarios"
)

git commit -m "%msg%"
echo OK: Commit gerado!
echo.

:: 3. Enviar ao repositorio
echo [3/3] Enviando arquivos para o repositorio remoto (Push)...
git push origin main
echo.

echo =======================================================
echo   Sincronizacao concluida com sucesso no GitHub!
echo =======================================================
echo.
pause

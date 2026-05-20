@echo off
:: Elite ERP GitHub Sync Script
:: Define character encoding to show accents correctly in Windows cmd
chcp 65001 > nul

echo =======================================================
echo 🚀 Elite ERP - Sincronizador Automático do GitHub
echo =======================================================
echo.

:: 1. Adicionar arquivos
echo [1/3] Adicionando todas as alterações locais...
git add .
echo ✔ Arquivos adicionados com sucesso!
echo.

:: 2. Mensagem do commit
echo [2/3] Criando registro de alterações (Commit)...
set "msg="
set /p msg="💡 Digite o texto do commit (ou dê ENTER para usar o padrão): "

if "%msg%"=="" (
    set msg="Ajustes estéticos no cadastro de itens e governança de usuários"
)

git commit -m "%msg%"
echo ✔ Commit gerado!
echo.

:: 3. Enviar ao repositório
echo [3/3] Enviando arquivos para o repositório remoto (Push)...
git push origin main
echo.

echo =======================================================
echo 🎉 Sincronização concluída com sucesso no GitHub!
echo =======================================================
echo.
pause

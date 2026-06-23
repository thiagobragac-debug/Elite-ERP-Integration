@echo off
cd /d "%~dp0"
echo Pasta atual: %CD%
echo.
git --version
echo Codigo de retorno git: %ERRORLEVEL%
echo.
pause

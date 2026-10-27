@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   NEXUS ERP - Instalador de dependencias
echo ============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  echo Instale a versao LTS em https://nodejs.org/ e execute este arquivo novamente.
  pause
  exit /b 1
)
echo Node instalado:
node --version
echo.
echo Instalando dependencias do projeto...
npm install
if errorlevel 1 (
  echo.
  echo A instalacao falhou. Confira sua conexao com a internet e tente novamente.
  pause
  exit /b 1
)
echo.
echo Dependencias instaladas com sucesso!
echo Agora execute INICIAR_NEXUS_CAIXA.bat
pause

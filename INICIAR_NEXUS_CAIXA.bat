@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo Dependencias nao encontradas. Execute INSTALAR_DEPENDENCIAS.bat primeiro.
  pause
  exit /b 1
)
echo Iniciando NEXUS ERP - Caixa...
echo No computador: http://localhost:5173
echo Para abrir no celular, veja LEIA-ME.txt (camera exige contexto seguro/HTTPS).
npm run dev
pause

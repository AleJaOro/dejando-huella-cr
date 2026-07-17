@echo off
cd /d "%~dp0"
echo.
echo  ========================================
echo   Dejando Huella CR - Servidor local
echo  ========================================
echo.
echo  Abri en el navegador: http://localhost:5500
echo  Panel admin: http://localhost:5500/admin/login.html
echo.
echo  Panel admin: /admin/login.html
echo.
echo  (Ctrl+C para detener)
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 5500
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 5500
  goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
  npx --yes serve -p 5500
  goto :eof
)

echo No se encontro Python ni Node. Instala uno de ellos o usa Live Server en VS Code.
pause

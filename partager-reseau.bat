@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title EventQR - Partage reseau local
echo ========================================
echo   EventQR - Acces reseau local
echo ========================================
echo.

rem Script independant de lancer.bat
rem Usage: partager-reseau.bat

where node >nul 2>&1
if errorlevel 1 goto ERR_NODE

for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo [OK] Node.js %NODE_VERSION%

where npm >nul 2>&1
if errorlevel 1 goto ERR_NPM

for /f "tokens=*" %%v in ('npm -v') do set "NPM_VERSION=%%v"
echo [OK] npm %NPM_VERSION%
echo.

if exist node_modules goto DEPS_OK
echo [INFO] Installation des dependances (premiere fois)...
call npm install
if errorlevel 1 goto ERR_INSTALL
echo [OK] Dependances installees.
echo.
goto DETECT_IP

:DEPS_OK
echo [OK] Dependances deja presentes.
echo.

:DETECT_IP
set "PORT=5173"
set "IP_LOCALE="

echo [INFO] Detection de l'adresse IP locale...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4"') do (
  if not defined IP_LOCALE (
    for /f "tokens=* delims= " %%b in ("%%a") do set "IP_LOCALE=%%b"
  )
)

echo.
echo ----------------------------------------
echo  Sur CET ordinateur :
echo    http://localhost:%PORT%
if defined IP_LOCALE (
  echo  Sur les autres appareils du meme reseau :
  echo    http://%IP_LOCALE%:%PORT%
) else (
  echo  [ATTENTION] IP locale non detectee.
  echo  Verifiez avec: ipconfig
)
echo ----------------------------------------
echo.
echo [NOTE] Si un autre appareil ne peut pas se connecter :
echo        - autorisez Node.js dans le pare-feu Windows
echo        - verifiez que le reseau Wi-Fi est en mode Prive
echo        - utilisez bien le meme Wi-Fi / LAN
echo.
echo [INFO] Demarrage de Vite (ecoute reseau 0.0.0.0)...
echo        Ctrl+C pour arreter le serveur.
echo.

call npx vite --host 0.0.0.0 --port %PORT%
set "VITE_EXIT=%ERRORLEVEL%"
echo.
if not "%VITE_EXIT%"=="0" goto ERR_VITE
echo Serveur arrete.
pause
exit /b 0

:ERR_NODE
echo [ERREUR] Node.js n'est pas installe ou pas dans le PATH.
echo Telechargez-le sur https://nodejs.org/
pause
exit /b 1

:ERR_NPM
echo [ERREUR] npm est introuvable.
pause
exit /b 1

:ERR_INSTALL
echo [ERREUR] Echec de npm install.
pause
exit /b 1

:ERR_VITE
echo [ERREUR] Le serveur Vite s'est arrete avec le code %VITE_EXIT%.
pause
exit /b %VITE_EXIT%

@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title EventQR - Demarrage
echo ========================================
echo   EventQR - Lancement du projet
echo ========================================
echo.

rem Usage:
rem   lancer.bat           -> serveur de developpement
rem   lancer.bat test      -> tests
rem   lancer.bat build     -> build production
rem   lancer.bat menu      -> menu interactif

set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=dev"

where node >nul 2>&1
if errorlevel 1 goto ERR_NODE

for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo [OK] Node.js %NODE_VERSION%

where npm >nul 2>&1
if errorlevel 1 goto ERR_NPM

for /f "tokens=*" %%v in ('npm -v') do set "NPM_VERSION=%%v"
echo [OK] npm %NPM_VERSION%
echo.

if /I "%ACTION%"=="menu" goto DO_MENU
goto PREPARE

:DO_MENU
echo Que souhaitez-vous faire ?
echo   1. Lancer le serveur de developpement
echo   2. Lancer les tests
echo   3. Build de production
echo.
set "CHOIX=1"
set /p "CHOIX=Votre choix [1]: "
if "%CHOIX%"=="1" set "ACTION=dev"
if "%CHOIX%"=="2" set "ACTION=test"
if "%CHOIX%"=="3" set "ACTION=build"
if /I not "%ACTION%"=="dev" if /I not "%ACTION%"=="test" if /I not "%ACTION%"=="build" goto ERR_CHOICE
echo.

:PREPARE
if exist ".env" goto DEPS_CHECK
if exist ".env.example" goto COPY_ENV
echo.>.env
echo [OK] Fichier .env vide cree.
echo.
goto DEPS_CHECK

:COPY_ENV
echo [INFO] Creation de .env a partir de .env.example...
copy /Y ".env.example" ".env" >nul
echo [OK] Fichier .env cree.
echo [NOTE] Ajoutez VITE_CLERK_PUBLISHABLE_KEY si vous utilisez Clerk.
echo.

:DEPS_CHECK
if exist node_modules goto DEPS_OK
echo [INFO] Installation des dependances (premiere fois)...
call npm install
if errorlevel 1 goto ERR_INSTALL
echo [OK] Dependances installees.
echo.
goto ROUTE

:DEPS_OK
echo [OK] Dependances deja presentes.
echo.

:ROUTE
if /I "%ACTION%"=="dev" goto DEV
if /I "%ACTION%"=="test" goto TEST
if /I "%ACTION%"=="build" goto BUILD
goto ERR_ACTION

:TEST
dir /b "%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-*" >nul 2>&1
if not errorlevel 1 goto RUN_TEST
echo [INFO] Installation de Chromium pour les tests (Playwright)...
echo        Cela peut prendre plusieurs minutes.
call npx playwright install chromium
if errorlevel 1 goto ERR_PLAYWRIGHT
echo [OK] Playwright Chromium pret.
echo.

:RUN_TEST
echo [INFO] Execution des tests...
call npm test
set "TEST_EXIT=%ERRORLEVEL%"
echo.
if not "%TEST_EXIT%"=="0" goto TEST_FAIL
echo [OK] Tous les tests sont passes.
pause
exit /b 0

:TEST_FAIL
echo [ERREUR] Des tests ont echoue.
pause
exit /b %TEST_EXIT%

:BUILD
echo [INFO] Build de production...
call npm run build
if errorlevel 1 goto ERR_BUILD
echo [OK] Build termine. Fichiers dans le dossier dist\
pause
exit /b 0

:DEV
echo [INFO] Demarrage du serveur de developpement...
echo        Ouvrez http://localhost:5173 dans votre navigateur.
echo        Ctrl+C pour arreter le serveur.
echo.
call npm run dev
echo.
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

:ERR_CHOICE
echo [ERREUR] Choix invalide.
pause
exit /b 1

:ERR_INSTALL
echo [ERREUR] Echec de npm install.
pause
exit /b 1

:ERR_PLAYWRIGHT
echo [ERREUR] Impossible d'installer Playwright Chromium.
echo Essayez manuellement: npx playwright install chromium
pause
exit /b 1

:ERR_BUILD
echo [ERREUR] Echec du build.
pause
exit /b 1

:ERR_ACTION
echo [ERREUR] Action inconnue: %ACTION%
echo Utilisez: lancer.bat [dev / test / build / menu]
pause
exit /b 1

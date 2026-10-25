@echo off
chcp 65001 >nul
title FF Rivals - All-in-One Launcher (RUN.bat)
color 0B
cls

set "PROJECT_DIR=%~dp0"
set "NODE_PATH=C:\Users\shaho\AppData\Local\Programs\nodejs"
set "GIT_PATH=%PROJECT_DIR%\.toolchain\git\cmd"
set "PATH=%NODE_PATH%;%GIT_PATH%;%PATH%"

echo ================================================================
echo          🔥 FF RIVALS TOURNAMENT - ALL-IN-ONE CONTROL 🔥
echo ================================================================
echo.
echo   [1] 🚀 Start Local Server (Web Admin + Mobile App View)
echo   [2] 🌐 Deploy / Push to Railway (Auto-Deploy Live)
echo   [3] 📱 Open Live Railway Website / App in Browser
echo   [4] 💰 Open Balance Manager Tool
echo   [5] 📦 Build Android Release APK
echo   [6] ❌ Exit
echo.
echo ================================================================
set "choice=1"
set /p "choice=Enter your choice (1-6) [Default: 1]: "

if "%choice%"=="1" goto run_local
if "%choice%"=="2" goto deploy_railway
if "%choice%"=="3" goto open_live
if "%choice%"=="4" goto balance_tool
if "%choice%"=="5" goto build_apk
if "%choice%"=="6" goto exit_app

:run_local
cls
echo ================================================================
echo   🚀 Starting FF Rivals Local Development Server...
echo ================================================================
echo.
echo   Local Website: http://localhost:3000
echo   Mobile App View: http://localhost:3000/mobile-app-view
echo   Admin Panel: http://localhost:3000/admin
echo.
echo   Opening browser in 3 seconds...
echo ================================================================
cd /d "%PROJECT_DIR%\apps\web-admin"
start "" "http://localhost:3000/mobile-app-view"
npm run dev
pause
goto end

:deploy_railway
cls
echo ================================================================
echo   🌐 Deploying / Pushing to Railway via GitHub...
echo ================================================================
echo.
cd /d "%PROJECT_DIR%"
"%GIT_PATH%\git.exe" push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ================================================================
    echo   [SUCCESS] Code pushed to GitHub successfully!
    echo   Railway is now automatically deploying the update.
    echo ================================================================
) else (
    echo ================================================================
    echo   [FAILED] Push failed with error code %ERRORLEVEL%.
    echo ================================================================
)
echo.
pause
goto end

:open_live
cls
echo ================================================================
echo   📱 Opening Live Railway Website and App in Browser...
echo ================================================================
start "" "https://ffrivalstourbd.com/"
start "" "https://ffrivalstourbd.com/mobile-app-view"
echo.
echo Done! Opened live URLs in your default browser.
echo.
pause
goto end

:balance_tool
cls
if exist "C:\Users\shaho\Desktop\FF_Rivals_Balance_Manager.html" (
    start "" "C:\Users\shaho\Desktop\FF_Rivals_Balance_Manager.html"
    echo Opened FF Rivals Balance Manager!
) else (
    echo FF_Rivals_Balance_Manager.html not found on Desktop.
)
echo.
pause
goto end

:build_apk
cls
echo ================================================================
echo   📦 Building Android Release APK...
echo ================================================================
echo.
cd /d "%PROJECT_DIR%\mobile-app"
node build-apk.js
echo.
pause
goto end

:exit_app
exit

:end

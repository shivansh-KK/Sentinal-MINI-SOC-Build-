@echo off
setlocal

rem ============================================================
rem  SENTINEL SOC - Frontend Startup Script
rem ============================================================

cd /d "%~dp0.."

echo.
echo ============================================================
echo  SENTINEL SOC - Starting Vite React Frontend on Port 5173
echo ============================================================
echo.

set "PATH=%CD%\.tools\nodejs;%PATH%"

echo [INFO] Verifying Node.js environment...
call node --version
if errorlevel 1 (
    echo [ERROR] Portable Node.js not detected at .tools\nodejs\node.exe
    pause
    exit /b 1
)

cd /d "%~dp0..\frontend"

echo.
echo [INFO] Starting Vite dev server...
echo [INFO] Access UI at: http://localhost:5173
echo.

call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend server stopped or failed to start.
    pause
)

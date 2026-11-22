@echo off
setlocal

rem ===============================================================================
rem  SENTINEL SOC - Master System Launcher
rem  Security Operations and Automated Incident Response Platform
rem ===============================================================================

cd /d "%~dp0"

echo.
echo ===============================================================================
echo   SENTINEL SOC - Security Operations ^& Automated Incident Response
echo   "Detect. Investigate. Respond. Protect."
echo ===============================================================================
echo.

rem 1. Check Python
echo [1/4] Verifying Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in system PATH.
    echo Please ensure Python 3.11+ is installed.
    pause
    exit /b 1
)
python --version

rem 2. Check Portable Node.js
echo.
echo [2/4] Verifying Node.js environment...
set "PATH=%CD%\.tools\nodejs;%PATH%"
if not exist ".tools\nodejs\node.exe" (
    echo [ERROR] Portable Node.js not detected at .tools\nodejs\node.exe
    pause
    exit /b 1
)
call node --version

rem 3. Check / Seed Database
echo.
echo [3/4] Verifying SQLite database status...
if not exist "sentinel_soc.db" (
    echo [*] Database not found. Seeding initial records...
    python scripts\seed_db.py
    if errorlevel 1 (
        echo [ERROR] Database initialization failed.
        pause
        exit /b 1
    )
) else (
    echo [+] Database verified: sentinel_soc.db
)

rem 4. Launch Backend and Frontend
echo.
echo [4/4] Launching microservices...
echo [*] Starting FastAPI Backend in new window (Port 8000)...
start "SENTINEL SOC - Backend (Port 8000)" cmd /k "%~dp0scripts\start_backend.bat"

rem Wait 3 seconds using ping for reliable cross-version delay
ping -n 4 127.0.0.1 >nul

echo [*] Starting Vite Frontend in new window (Port 5173)...
start "SENTINEL SOC - Frontend (Port 5173)" cmd /k "%~dp0scripts\start_frontend.bat"

echo.
echo ===============================================================================
echo   SENTINEL SOC IS STARTING UP!
echo ===============================================================================
echo.
echo   [+] Frontend UI      : http://localhost:5173
echo   [+] Backend API Docs : http://localhost:8000/docs
echo   [+] WebSocket Channel: ws://localhost:8000/ws
echo.
echo   DEFAULT DEMO CREDENTIALS:
echo   -----------------------------------------------------------------------------
echo   Role       Username    Password             Access
echo   -----------------------------------------------------------------------------
echo   Admin      admin       SentinelAdmin2026!   Full SOAR, Rules, Demo Lab
echo   Analyst    analyst     SentinelAnalyst2026! Triage, Incidents, Approvals
echo   Viewer     viewer      SentinelViewer2026!  Read-Only Monitoring
echo   -----------------------------------------------------------------------------
echo.
echo   Opening dashboard in your default browser...
start http://localhost:5173
echo.
echo   Keep this launcher and service windows open while using the platform.
echo ===============================================================================
echo.
pause

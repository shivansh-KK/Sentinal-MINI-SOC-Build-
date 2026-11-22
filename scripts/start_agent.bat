@echo off
setlocal

rem ============================================================
rem  SENTINEL SOC - Endpoint Telemetry Agent Launcher
rem ============================================================

cd /d "%~dp0.."

echo.
echo ============================================================
echo  SENTINEL SOC - Starting Endpoint Telemetry Agent
echo ============================================================
echo.

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo [INFO] Starting telemetry collection loop...
echo [INFO] Target ingest URL: http://localhost:8000/api/events/
echo.

python agent\main.py

if errorlevel 1 (
    echo.
    echo [ERROR] Agent stopped or failed.
    pause
)

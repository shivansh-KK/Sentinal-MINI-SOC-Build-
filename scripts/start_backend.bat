@echo off
setlocal

rem ============================================================
rem  SENTINEL SOC - Backend Startup Script
rem ============================================================

cd /d "%~dp0.."

echo.
echo ============================================================
echo  SENTINEL SOC - Starting FastAPI Backend on Port 8000
echo ============================================================
echo.

if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo [INFO] Starting Uvicorn server on http://localhost:8000 ...
echo [INFO] Swagger API Docs will be at http://localhost:8000/docs
echo.

python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

if errorlevel 1 (
    echo.
    echo [ERROR] Backend stopped or failed to start.
    pause
)

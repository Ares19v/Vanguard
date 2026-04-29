@echo off
setlocal EnableDelayedExpansion
title Vanguard ASOC — Launch

echo.
echo   ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗
echo   ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
echo   ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
echo   ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
echo    ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
echo     ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
echo.
echo   Automated Security Operations Center  //  v1.0
echo   ─────────────────────────────────────────────────────────────────────
echo.

REM ── Ensure .env exists ────────────────────────────────────────────────────
if not exist backend\.env (
    if exist backend\.env.example (
        copy backend\.env.example backend\.env >nul
        echo   [*] Created backend\.env from .env.example
        echo   [!] Open backend\.env and set your GEMINI_API_KEY before continuing.
        echo.
    )
)

REM ── Try Docker first ──────────────────────────────────────────────────────
docker info >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo   [Docker] Detected Docker — launching via docker compose...
    echo.
    docker compose up --build
    goto :end
)

REM ── Manual launch (no Docker) ─────────────────────────────────────────────
echo   [Manual] Docker not found — launching services manually...
echo.

REM Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Python not found. Install Python 3.11+ and try again.
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Node.js not found. Install Node 20+ and try again.
    pause
    exit /b 1
)

REM Create virtual environment if needed
if not exist backend\.venv (
    echo   [*] Creating Python virtual environment...
    python -m venv backend\.venv
)

REM Install / update backend dependencies
echo   [*] Installing backend dependencies...
call backend\.venv\Scripts\activate.bat
pip install -q -r backend\requirements.txt
deactivate

REM Install frontend dependencies if needed
if not exist frontend\node_modules (
    echo   [*] Installing frontend dependencies...
    cd frontend && npm install --silent && cd ..
)

REM ── Start services ────────────────────────────────────────────────────────
echo.
echo   [*] Starting FastAPI backend on http://localhost:8000
start "Vanguard Backend" cmd /k "cd backend && .venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo   [*] Waiting for backend to initialise...
timeout /t 4 /nobreak >nul

echo   [*] Starting Vite frontend on http://localhost:5173
start "Vanguard Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

REM ── Open browser ──────────────────────────────────────────────────────────
echo.
echo   ─────────────────────────────────────────────────────────────────────
echo   ✓  Frontend  : http://localhost:5173
echo   ✓  API Docs  : http://localhost:8000/api/docs
echo   ✓  Health    : http://localhost:8000/health
echo   ─────────────────────────────────────────────────────────────────────
echo.
echo   Opening browser...
start "" http://localhost:5173

echo   Both services are running in separate windows.
echo   Close those windows or press Ctrl+C in them to stop Vanguard.
echo.

:end
endlocal

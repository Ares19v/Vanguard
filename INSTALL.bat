@echo off
setlocal EnableDelayedExpansion
title Vanguard ASOC — Install

echo.
echo   ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗
echo   ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
echo   ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
echo   ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
echo    ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
echo     ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
echo.
echo   INSTALL — Setting up dependencies
echo   ─────────────────────────────────────────────────────────────────────
echo.

REM ── Check prerequisites ───────────────────────────────────────────────────
echo   [1/4] Checking prerequisites...

python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Python 3.11+ is required but not found.
    echo          Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo         Python   OK

node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Node.js 20+ is required but not found.
    echo          Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo         Node.js  OK

REM ── Create / update Python virtual environment ────────────────────────────
echo.
echo   [2/4] Setting up Python environment...
if not exist backend\.venv (
    python -m venv backend\.venv
    echo         Created virtual environment at backend\.venv
) else (
    echo         Virtual environment already exists
)

call backend\.venv\Scripts\activate.bat
pip install -q --upgrade pip
pip install -q -r backend\requirements.txt
deactivate
echo         Backend dependencies installed

REM ── Install Node.js dependencies ──────────────────────────────────────────
echo.
echo   [3/4] Installing frontend dependencies...
cd frontend
npm install --silent
cd ..
echo         Frontend dependencies installed

REM ── Configure environment ─────────────────────────────────────────────────
echo.
echo   [4/4] Configuring environment...
if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo         Created backend\.env from .env.example
    echo.
    echo   ─────────────────────────────────────────────────────────────────────
    echo   IMPORTANT: Edit backend\.env and add your GEMINI_API_KEY before
    echo              running the project for the first time.
    echo   ─────────────────────────────────────────────────────────────────────
) else (
    echo         backend\.env already configured
)

echo.
echo   ═════════════════════════════════════════════════════════════════════
echo   ✓  Installation complete!
echo   ═════════════════════════════════════════════════════════════════════
echo.
echo   Next steps:
echo     1. Edit backend\.env (set GEMINI_API_KEY and other values)
echo     2. Double-click Run_Project.bat to launch Vanguard
echo.
pause
endlocal

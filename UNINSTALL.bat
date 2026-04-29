@echo off
setlocal EnableDelayedExpansion
title Vanguard ASOC — Uninstall

echo.
echo   ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗
echo   ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
echo   ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
echo   ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
echo    ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
echo     ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
echo.
echo   UNINSTALL — Remove installed dependencies
echo   ─────────────────────────────────────────────────────────────────────
echo.

echo   This will remove:
echo     - backend\.venv          (Python virtual environment)
echo     - frontend\node_modules  (Node.js packages)
echo     - frontend\dist          (production build artefacts)
echo.
set /p CONFIRM=   Type YES to continue, anything else to cancel: 
if /i NOT "!CONFIRM!" == "YES" (
    echo.
    echo   Cancelled. Nothing was removed.
    pause
    exit /b 0
)
echo.

REM ── Remove Python virtual environment ─────────────────────────────────────
if exist backend\.venv (
    echo   [*] Removing backend\.venv...
    rmdir /s /q backend\.venv
    echo       Done.
) else (
    echo   [*] backend\.venv not found — skipping.
)

REM ── Remove Node modules ───────────────────────────────────────────────────
if exist frontend\node_modules (
    echo   [*] Removing frontend\node_modules...
    rmdir /s /q frontend\node_modules
    echo       Done.
) else (
    echo   [*] frontend\node_modules not found — skipping.
)

REM ── Remove production build ───────────────────────────────────────────────
if exist frontend\dist (
    echo   [*] Removing frontend\dist...
    rmdir /s /q frontend\dist
    echo       Done.
) else (
    echo   [*] frontend\dist not found — skipping.
)

REM ── Optional: remove .env ─────────────────────────────────────────────────
echo.
if exist backend\.env (
    set /p REMOVE_ENV=   Also remove backend\.env (your credentials)? [y/N]: 
    if /i "!REMOVE_ENV!" == "y" (
        del backend\.env
        echo   [*] Removed backend\.env
    ) else (
        echo   [*] Kept backend\.env
    )
)

echo.
echo   ═════════════════════════════════════════════════════════════════════
echo   ✓  Uninstall complete. Run INSTALL.bat to set up again.
echo   ═════════════════════════════════════════════════════════════════════
echo.
pause
endlocal

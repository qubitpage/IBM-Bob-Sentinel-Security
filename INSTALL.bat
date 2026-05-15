@echo off
REM Bob Sentinel - Windows Double-Click Installer
REM This script installs Bob Sentinel into IBM Bob with a single double-click

title Bob Sentinel Installer for Windows

echo.
echo ========================================================================
echo          Bob Sentinel - IBM Bob Integration Installer
echo ========================================================================
echo.
echo This installer will:
echo   1. Locate your IBM Bob installation
echo   2. Install Bob Sentinel mode
echo   3. Copy CLI scanner
echo   4. Set up git hooks (optional)
echo   5. Verify installation
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo [1/5] Checking prerequisites...
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell not found!
    echo Please install PowerShell to continue.
    pause
    exit /b 1
)
echo   [OK] PowerShell found

REM Check if Node.js is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Node.js not found!
    echo You'll need Node.js to run the dashboard.
    echo Download from: https://nodejs.org/
    echo.
    echo Continue anyway? (y/n)
    set /p continue=
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo   [OK] Node.js found
)

echo.
echo [2/5] Running PowerShell installer...
echo.

REM Run the PowerShell installer in non-interactive mode
powershell -ExecutionPolicy Bypass -File "%~dp0install-bob-integration.ps1" -NonInteractive

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo [3/5] Installation complete!
echo.

REM Ask if user wants to start the dashboard
echo.
echo ========================================================================
echo                    Installation Successful!
echo ========================================================================
echo.
echo Bob Sentinel has been installed into IBM Bob.
echo.
echo Would you like to start the dashboard now? (y/n)
set /p startdash=

if /i "%startdash%"=="y" (
    echo.
    echo [4/5] Starting Bob Sentinel Dashboard...
    echo.
    
    REM Check if dependencies are installed
    if not exist "%~dp0dashboard\backend\node_modules" (
        echo Installing backend dependencies...
        cd /d "%~dp0dashboard\backend"
        call npm install
        if %errorlevel% neq 0 (
            echo ERROR: Failed to install backend dependencies
            pause
            exit /b 1
        )
    )
    
    if not exist "%~dp0dashboard\frontend\node_modules" (
        echo Installing frontend dependencies...
        cd /d "%~dp0dashboard\frontend"
        call npm install
        if %errorlevel% neq 0 (
            echo ERROR: Failed to install frontend dependencies
            pause
            exit /b 1
        )
    )
    
    echo.
    echo Starting backend server...
    start "Bob Sentinel Backend" cmd /k "cd /d %~dp0dashboard\backend && npm start"
    
    timeout /t 3 /nobreak >nul
    
    echo Starting frontend server...
    start "Bob Sentinel Frontend" cmd /k "cd /d %~dp0dashboard\frontend && npm run dev"
    
    timeout /t 5 /nobreak >nul
    
    echo.
    echo Opening dashboard in browser...
    start http://localhost:5173
    
    echo.
    echo [5/5] Dashboard started!
    echo.
    echo   Backend:  http://localhost:3000
    echo   Frontend: http://localhost:5173
    echo.
    echo Two terminal windows have been opened for the servers.
    echo Keep them running to use the dashboard.
    echo.
) else (
    echo.
    echo [4/5] Skipped dashboard startup
    echo.
    echo To start the dashboard later, run:
    echo   - Backend:  cd dashboard\backend ^&^& npm start
    echo   - Frontend: cd dashboard\frontend ^&^& npm run dev
    echo.
)

echo.
echo ========================================================================
echo                         Next Steps
echo ========================================================================
echo.
echo 1. Restart IBM Bob to load the new mode
echo 2. In IBM Bob chat, type: /mode sentinel
echo 3. Scan your code: /scan
echo 4. View results in dashboard: http://localhost:5173
echo.
echo Documentation:
echo   - User Guide:    USER_GUIDE.md
echo   - Quick Start:   QUICKSTART.md
echo   - Integration:   IBM_BOB_INTEGRATION.md
echo.
echo ========================================================================
echo.
echo Installation complete! Press any key to exit...
pause >nul

@REM Made with Bob

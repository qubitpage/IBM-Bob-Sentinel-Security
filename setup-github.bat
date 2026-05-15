@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Bob Sentinel - GitHub Repository Setup Script (Windows)
:: ============================================================================
:: This script automates the process of creating a GitHub repository and
:: pushing Bob Sentinel to it.
:: ============================================================================

echo.
echo ========================================
echo   Bob Sentinel - GitHub Setup
echo ========================================
echo.

:: Check if we're in the bob-sentinel directory
if not exist "README.md" (
    echo [ERROR] This script must be run from the bob-sentinel directory!
    echo.
    echo Please navigate to the bob-sentinel folder and try again:
    echo   cd bob-sentinel
    echo   setup-github.bat
    echo.
    pause
    exit /b 1
)

:: Check if git is installed
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed!
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking prerequisites...
echo   [OK] Git is installed
echo.

:: Check if GitHub CLI is installed
where gh >nul 2>&1
if errorlevel 1 (
    echo [INFO] GitHub CLI is not installed.
    echo.
    echo You have two options:
    echo   1. Install GitHub CLI (recommended): https://cli.github.com/
    echo   2. Continue with manual setup
    echo.
    set /p "choice=Install GitHub CLI? (y/n): "
    if /i "!choice!"=="y" (
        echo.
        echo Opening GitHub CLI download page...
        start https://cli.github.com/
        echo.
        echo Please install GitHub CLI and run this script again.
        pause
        exit /b 0
    )
    set "USE_GH=0"
) else (
    echo   [OK] GitHub CLI is installed
    set "USE_GH=1"
)

echo.
echo [2/6] Initializing Git repository...

:: Check if already a git repo
if exist ".git" (
    echo   [INFO] Git repository already initialized
) else (
    git init
    if errorlevel 1 (
        echo   [ERROR] Failed to initialize Git repository
        pause
        exit /b 1
    )
    echo   [OK] Git repository initialized
)

echo.
echo [3/6] Adding files to Git...

git add .
if errorlevel 1 (
    echo   [ERROR] Failed to add files
    pause
    exit /b 1
)
echo   [OK] Files added

echo.
echo [4/6] Creating initial commit...

git commit -m "Initial commit: Bob Sentinel - Security Scanner for IBM Bob"
if errorlevel 1 (
    echo   [INFO] No changes to commit or commit already exists
) else (
    echo   [OK] Initial commit created
)

echo.
echo [5/6] Setting up GitHub repository...

if "!USE_GH!"=="1" (
    :: Using GitHub CLI
    echo.
    echo Checking GitHub authentication...
    gh auth status >nul 2>&1
    if errorlevel 1 (
        echo   [INFO] Not logged in to GitHub
        echo.
        echo Please login to GitHub:
        gh auth login
        if errorlevel 1 (
            echo   [ERROR] GitHub login failed
            pause
            exit /b 1
        )
    )
    
    echo.
    echo Creating GitHub repository...
    gh repo create bob-sentinel --public --source=. --remote=origin --push
    if errorlevel 1 (
        echo   [ERROR] Failed to create repository
        echo.
        echo The repository might already exist. Try:
        echo   gh repo view bob-sentinel
        pause
        exit /b 1
    )
    
    echo   [OK] Repository created and pushed!
    
) else (
    :: Manual setup
    echo.
    echo ========================================
    echo   Manual Setup Required
    echo ========================================
    echo.
    echo Please follow these steps:
    echo.
    echo 1. Go to: https://github.com/new
    echo 2. Repository name: bob-sentinel
    echo 3. Description: Bob Sentinel - Security Scanner for IBM Bob
    echo 4. Select: Public
    echo 5. DO NOT initialize with README
    echo 6. Click "Create repository"
    echo.
    echo 7. Copy the repository URL (e.g., https://github.com/USERNAME/bob-sentinel.git)
    echo.
    set /p "repo_url=Enter your repository URL: "
    
    if "!repo_url!"=="" (
        echo   [ERROR] Repository URL is required
        pause
        exit /b 1
    )
    
    echo.
    echo Adding remote origin...
    git remote add origin "!repo_url!"
    if errorlevel 1 (
        echo   [INFO] Remote origin might already exist, removing and re-adding...
        git remote remove origin
        git remote add origin "!repo_url!"
    )
    
    echo.
    echo Pushing to GitHub...
    git branch -M main
    git push -u origin main
    if errorlevel 1 (
        echo   [ERROR] Failed to push to GitHub
        echo.
        echo Please check:
        echo   - Repository URL is correct
        echo   - You have write access to the repository
        echo   - Your Git credentials are configured
        pause
        exit /b 1
    )
    
    echo   [OK] Code pushed to GitHub!
)

echo.
echo [6/6] Final setup...

:: Get repository URL
if "!USE_GH!"=="1" (
    for /f "tokens=*" %%i in ('gh repo view --json url -q .url') do set "REPO_URL=%%i"
) else (
    set "REPO_URL=!repo_url!"
)

echo.
echo ========================================
echo   SUCCESS! 🎉
echo ========================================
echo.
echo Your Bob Sentinel repository is now live on GitHub!
echo.
echo Repository URL: !REPO_URL!
echo.
echo Next steps:
echo   1. Visit your repository: !REPO_URL!
echo   2. Add repository topics (security, vulnerability-scanner, ibm-bob)
echo   3. Star your repository ⭐
echo   4. Share with the IBM Bob community
echo   5. Submit to the hackathon
echo.
echo Opening repository in browser...
start "!REPO_URL!"

echo.
echo Repository Statistics:
echo   - Total Files: 50+
echo   - Lines of Code: ~8,000+
echo   - Documentation: 7 comprehensive guides
echo   - Languages: JavaScript, CSS, YAML, Shell
echo.
echo Made with ❤️ for the IBM Bob Hackathon
echo.
pause

@REM Made with Bob

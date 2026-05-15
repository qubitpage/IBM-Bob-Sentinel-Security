# Bob Sentinel - Auto-Install Script for IBM Bob Integration
# This script automatically installs Bob Sentinel as a custom mode in IBM Bob

param(
    [string]$BobDirectory = "",
    [switch]$Help,
    [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"

# Display help
if ($Help) {
    Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║         Bob Sentinel - IBM Bob Integration Installer          ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
    .\install-bob-integration.ps1 [-BobDirectory <path>] [-Help]

PARAMETERS:
    -BobDirectory   Path to IBM Bob installation directory
                    (Optional: Will auto-detect if not provided)
    -Help          Display this help message

EXAMPLES:
    # Auto-detect Bob installation
    .\install-bob-integration.ps1

    # Specify Bob directory
    .\install-bob-integration.ps1 -BobDirectory "C:\Users\YourName\.bob"

WHAT THIS SCRIPT DOES:
    1. Locates your IBM Bob installation
    2. Copies Bob Sentinel mode configuration
    3. Installs CLI scanner
    4. Sets up git hooks (optional)
    5. Verifies installation

"@
    exit 0
}

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║         🛡️  Bob Sentinel - IBM Bob Integration Installer      ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Step 1: Locate IBM Bob installation
Write-Host "[1/6] Locating IBM Bob installation..." -ForegroundColor Yellow

if ($BobDirectory -eq "") {
    # Try common locations
    $possiblePaths = @(
        "$env:USERPROFILE\.bob",
        "$env:APPDATA\bob",
        "$env:LOCALAPPDATA\bob",
        "C:\Program Files\IBM Bob",
        "C:\Program Files (x86)\IBM Bob"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $BobDirectory = $path
            Write-Host "   ✓ Found IBM Bob at: $BobDirectory" -ForegroundColor Green
            break
        }
    }

    if ($BobDirectory -eq "") {
        Write-Host "   ✗ Could not auto-detect IBM Bob installation" -ForegroundColor Red
        Write-Host "   Please specify the path using -BobDirectory parameter" -ForegroundColor Yellow
        exit 1
    }
} else {
    if (-not (Test-Path $BobDirectory)) {
        Write-Host "   ✗ Directory not found: $BobDirectory" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Using specified directory: $BobDirectory" -ForegroundColor Green
}

# Step 2: Create modes directory if it doesn't exist
Write-Host "`n[2/6] Setting up modes directory..." -ForegroundColor Yellow

$modesDir = Join-Path $BobDirectory "modes"
if (-not (Test-Path $modesDir)) {
    New-Item -ItemType Directory -Path $modesDir -Force | Out-Null
    Write-Host "   ✓ Created modes directory" -ForegroundColor Green
} else {
    Write-Host "   ✓ Modes directory exists" -ForegroundColor Green
}

# Step 3: Copy Bob Sentinel mode configuration
Write-Host "`n[3/6] Installing Bob Sentinel mode..." -ForegroundColor Yellow

$sourceMode = Join-Path $PSScriptRoot ".bob\modes\sentinel.yaml"
$targetMode = Join-Path $modesDir "sentinel.yaml"

if (Test-Path $sourceMode) {
    Copy-Item $sourceMode $targetMode -Force
    Write-Host "   ✓ Installed sentinel.yaml mode configuration" -ForegroundColor Green
} else {
    Write-Host "   ✗ Source mode file not found: $sourceMode" -ForegroundColor Red
    exit 1
}

# Step 4: Install CLI scanner
Write-Host "`n[4/6] Installing CLI scanner..." -ForegroundColor Yellow

$cliDir = Join-Path $BobDirectory "tools\bob-sentinel"
if (-not (Test-Path $cliDir)) {
    New-Item -ItemType Directory -Path $cliDir -Force | Out-Null
}

$sourceScanner = Join-Path $PSScriptRoot "cli\scanner.js"
$targetScanner = Join-Path $cliDir "scanner.js"

if (Test-Path $sourceScanner) {
    Copy-Item $sourceScanner $targetScanner -Force
    Write-Host "   ✓ Installed scanner.js" -ForegroundColor Green
} else {
    Write-Host "   ✗ Source scanner not found: $sourceScanner" -ForegroundColor Red
    exit 1
}

# Step 5: Optional git hooks installation
Write-Host "`n[5/6] Git hooks installation (optional)..." -ForegroundColor Yellow

if ($NonInteractive) {
    Write-Host "   ⊘ Skipped git hooks installation (non-interactive mode)" -ForegroundColor Gray
    $installHooks = "n"
} else {
    $installHooks = Read-Host "   Do you want to install git pre-push hooks? (y/n)"
}

if ($installHooks -eq "y" -or $installHooks -eq "Y") {
    $gitDir = Join-Path (Get-Location) ".git"
    if (Test-Path $gitDir) {
        $hooksDir = Join-Path $gitDir "hooks"
        $sourceHook = Join-Path $PSScriptRoot "git-hooks\pre-push"
        $targetHook = Join-Path $hooksDir "pre-push"

        if (Test-Path $sourceHook) {
            # Backup existing hook if present
            if (Test-Path $targetHook) {
                Copy-Item $targetHook "$targetHook.backup" -Force
                Write-Host "   ✓ Backed up existing pre-push hook" -ForegroundColor Green
            }

            Copy-Item $sourceHook $targetHook -Force
            Write-Host "   ✓ Installed pre-push hook" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ Git hook source not found, skipping" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠ Not a git repository, skipping hooks" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⊘ Skipped git hooks installation" -ForegroundColor Gray
}

# Step 6: Verify installation
Write-Host "`n[6/6] Verifying installation..." -ForegroundColor Yellow

$verified = $true

if (-not (Test-Path $targetMode)) {
    Write-Host "   ✗ Mode configuration not found" -ForegroundColor Red
    $verified = $false
} else {
    Write-Host "   ✓ Mode configuration verified" -ForegroundColor Green
}

if (-not (Test-Path $targetScanner)) {
    Write-Host "   ✗ CLI scanner not found" -ForegroundColor Red
    $verified = $false
} else {
    Write-Host "   ✓ CLI scanner verified" -ForegroundColor Green
}

# Final summary
Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                    Installation Complete!                      ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

if ($verified) {
    Write-Host "✓ Bob Sentinel has been successfully integrated with IBM Bob!" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "  1. Restart IBM Bob to load the new mode"
    Write-Host "  2. Type '/mode sentinel' to activate Bob Sentinel"
    Write-Host "  3. Use '/scan' to scan your codebase for vulnerabilities"
    Write-Host ""
    Write-Host "DOCUMENTATION:" -ForegroundColor Yellow
    Write-Host "  • User Guide: $PSScriptRoot\USER_GUIDE.md"
    Write-Host "  • Features: $PSScriptRoot\FEATURES.md"
    Write-Host "  • Quick Start: $PSScriptRoot\QUICKSTART.md"
    Write-Host ""
    Write-Host "DASHBOARD:" -ForegroundColor Yellow
    Write-Host "  • Start backend: cd dashboard/backend && npm start"
    Write-Host "  • Start frontend: cd dashboard/frontend && npm run dev"
    Write-Host "  • Access at: http://localhost:5173"
    Write-Host ""
} else {
    Write-Host "⚠ Installation completed with warnings" -ForegroundColor Yellow
    Write-Host "  Please check the errors above and try again" -ForegroundColor Yellow
    Write-Host ""
}

if (-not $NonInteractive) {
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Made with Bob

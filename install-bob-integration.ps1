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
    Write-Host "Bob Sentinel - IBM Bob Integration Installer"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "    .\install-bob-integration.ps1 [-BobDirectory <path>] [-Help]"
    Write-Host ""
    Write-Host "PARAMETERS:"
    Write-Host "    -BobDirectory   Path to IBM Bob installation directory"
    Write-Host "    -Help           Display this help message"
    Write-Host "    -NonInteractive Skip interactive prompts"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "    Bob Sentinel - IBM Bob Integration Installer" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Locate IBM Bob installation
Write-Host "[1/6] Locating IBM Bob installation..." -ForegroundColor Yellow

if ($BobDirectory -eq "") {
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
            Write-Host "   [OK] Found IBM Bob at: $BobDirectory" -ForegroundColor Green
            break
        }
    }

    if ($BobDirectory -eq "") {
        Write-Host "   [FAIL] Could not auto-detect IBM Bob installation" -ForegroundColor Red
        Write-Host "   Please specify the path using -BobDirectory parameter" -ForegroundColor Yellow
        exit 1
    }
} else {
    if (-not (Test-Path $BobDirectory)) {
        Write-Host "   [FAIL] Directory not found: $BobDirectory" -ForegroundColor Red
        exit 1
    }
    Write-Host "   [OK] Using specified directory: $BobDirectory" -ForegroundColor Green
}

# Step 2: Create modes directory
Write-Host ""
Write-Host "[2/6] Setting up modes directory..." -ForegroundColor Yellow

$modesDir = Join-Path $BobDirectory "modes"
if (-not (Test-Path $modesDir)) {
    New-Item -ItemType Directory -Path $modesDir -Force | Out-Null
    Write-Host "   [OK] Created modes directory" -ForegroundColor Green
} else {
    Write-Host "   [OK] Modes directory exists" -ForegroundColor Green
}

# Step 3: Copy Bob Sentinel mode configuration
Write-Host ""
Write-Host "[3/6] Installing Bob Sentinel mode..." -ForegroundColor Yellow

$sourceMode = Join-Path $PSScriptRoot ".bob\modes\sentinel.yaml"
$targetMode = Join-Path $modesDir "sentinel.yaml"

if (Test-Path $sourceMode) {
    Copy-Item $sourceMode $targetMode -Force
    Write-Host "   [OK] Installed sentinel.yaml mode configuration" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Source mode file not found: $sourceMode" -ForegroundColor Red
    exit 1
}

# Step 4: Install CLI scanner
Write-Host ""
Write-Host "[4/6] Installing CLI scanner..." -ForegroundColor Yellow

$cliDir = Join-Path $BobDirectory "tools\bob-sentinel"
if (-not (Test-Path $cliDir)) {
    New-Item -ItemType Directory -Path $cliDir -Force | Out-Null
}

$sourceScanner = Join-Path $PSScriptRoot "cli\scanner.js"
$targetScanner = Join-Path $cliDir "scanner.js"

if (Test-Path $sourceScanner) {
    Copy-Item $sourceScanner $targetScanner -Force
    Write-Host "   [OK] Installed scanner.js" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Source scanner not found: $sourceScanner" -ForegroundColor Red
    exit 1
}

# Step 4b: Register mode in Bob config.yaml
Write-Host "   Registering mode in config.yaml..." -ForegroundColor Yellow

$configPath = Join-Path $BobDirectory "config.yaml"
$configLines = @(
    "# IBM Bob Configuration - Updated by Bob Sentinel Installer",
    "modes:",
    "  - sentinel",
    "",
    "hooks:",
    "  after_code_generation:",
    "    - mode: sentinel",
    "      command: scan",
    "      auto_fix: false",
    "",
    "  before_git_push:",
    "    - mode: sentinel",
    "      command: scan",
    "      block_on_critical: true",
    "",
    "chat:",
    "  sentinel:",
    "    show_inline_warnings: true",
    "    highlight_vulnerable_code: true",
    "    suggest_fixes: true",
    "    show_health_score: true"
)
$configContent = $configLines -join "`n"

if (Test-Path $configPath) {
    $existingConfig = Get-Content $configPath -Raw
    if ($existingConfig -notmatch "sentinel") {
        Add-Content -Path $configPath -Value "`n$configContent"
        Write-Host "   [OK] Added sentinel to existing config.yaml" -ForegroundColor Green
    } else {
        Write-Host "   [OK] Sentinel already registered in config.yaml" -ForegroundColor Green
    }
} else {
    Set-Content -Path $configPath -Value $configContent
    Write-Host "   [OK] Created config.yaml with sentinel registration" -ForegroundColor Green
}

# Step 5: Optional git hooks installation
Write-Host ""
Write-Host "[5/6] Git hooks installation (optional)..." -ForegroundColor Yellow

if ($NonInteractive) {
    Write-Host "   [-] Skipped git hooks (non-interactive mode)" -ForegroundColor Gray
    $installHooks = "n"
} else {
    $installHooks = Read-Host "   Install git pre-push hooks? (y/n)"
}

if ($installHooks -eq "y" -or $installHooks -eq "Y") {
    $gitDir = Join-Path (Get-Location) ".git"
    if (Test-Path $gitDir) {
        $hooksDir = Join-Path $gitDir "hooks"
        $sourceHook = Join-Path $PSScriptRoot "cli\pre-push-hook.sh"
        $targetHook = Join-Path $hooksDir "pre-push"

        if (Test-Path $sourceHook) {
            if (Test-Path $targetHook) {
                Copy-Item $targetHook "$targetHook.backup" -Force
                Write-Host "   [OK] Backed up existing pre-push hook" -ForegroundColor Green
            }
            Copy-Item $sourceHook $targetHook -Force
            Write-Host "   [OK] Installed pre-push hook" -ForegroundColor Green
        } else {
            Write-Host "   [!] Git hook source not found, skipping" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [!] Not a git repository, skipping hooks" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [-] Skipped git hooks installation" -ForegroundColor Gray
}

# Step 6: Verify installation
Write-Host ""
Write-Host "[6/6] Verifying installation..." -ForegroundColor Yellow

$verified = $true

if (-not (Test-Path $targetMode)) {
    Write-Host "   [FAIL] Mode configuration not found" -ForegroundColor Red
    $verified = $false
} else {
    Write-Host "   [OK] Mode configuration verified" -ForegroundColor Green
}

if (-not (Test-Path $targetScanner)) {
    Write-Host "   [FAIL] CLI scanner not found" -ForegroundColor Red
    $verified = $false
} else {
    Write-Host "   [OK] CLI scanner verified" -ForegroundColor Green
}

# Final summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "              Installation Complete!" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($verified) {
    Write-Host "Bob Sentinel integrated with IBM Bob successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "  1. Restart IBM Bob to load the new mode"
    Write-Host "  2. Type '/mode sentinel' to activate Bob Sentinel"
    Write-Host "  3. Use '/scan' to scan your codebase for vulnerabilities"
    Write-Host ""
    Write-Host "DASHBOARD:" -ForegroundColor Yellow
    Write-Host "  - Start backend: cd dashboard\backend; npm start"
    Write-Host "  - Start frontend: cd dashboard\frontend; npm run dev"
    Write-Host "  - Access at: http://localhost:5173"
    Write-Host ""
} else {
    Write-Host "Installation completed with warnings" -ForegroundColor Yellow
    Write-Host "  Please check the errors above and try again" -ForegroundColor Yellow
    Write-Host ""
}

if (-not $NonInteractive) {
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

# Made with Bob

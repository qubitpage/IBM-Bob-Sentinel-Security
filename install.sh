#!/bin/bash
# Bob Sentinel - Linux/Ubuntu Installer
# This script installs Bob Sentinel into IBM Bob

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║         🛡️  Bob Sentinel - IBM Bob Integration Installer      ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "This installer will:"
echo "  1. Locate your IBM Bob installation"
echo "  2. Install Bob Sentinel mode"
echo "  3. Copy CLI scanner"
echo "  4. Set up git hooks (optional)"
echo "  5. Verify installation"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Step 1: Check prerequisites
echo ""
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"
echo ""

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}WARNING: Running as root is not recommended${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found!${NC}"
    echo "Please install Node.js first:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  Fedora: sudo dnf install nodejs npm"
    echo "  Arch: sudo pacman -S nodejs npm"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm not found!${NC}"
    echo "Please install npm first"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
fi

# Step 2: Locate IBM Bob installation
echo ""
echo -e "${YELLOW}[2/6] Locating IBM Bob installation...${NC}"
echo ""

BOB_DIR=""
POSSIBLE_PATHS=(
    "$HOME/.bob"
    "$HOME/.config/bob"
    "$HOME/.local/share/bob"
    "/opt/ibm-bob"
    "/usr/local/ibm-bob"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        BOB_DIR="$path"
        echo -e "${GREEN}✓ Found IBM Bob at: $BOB_DIR${NC}"
        break
    fi
done

if [ -z "$BOB_DIR" ]; then
    echo -e "${YELLOW}Could not auto-detect IBM Bob installation${NC}"
    read -p "Enter IBM Bob directory path: " BOB_DIR
    
    if [ ! -d "$BOB_DIR" ]; then
        echo -e "${RED}ERROR: Directory not found: $BOB_DIR${NC}"
        exit 1
    fi
fi

# Step 3: Create modes directory
echo ""
echo -e "${YELLOW}[3/6] Setting up modes directory...${NC}"
echo ""

MODES_DIR="$BOB_DIR/modes"
if [ ! -d "$MODES_DIR" ]; then
    mkdir -p "$MODES_DIR"
    echo -e "${GREEN}✓ Created modes directory${NC}"
else
    echo -e "${GREEN}✓ Modes directory exists${NC}"
fi

# Step 4: Install Bob Sentinel mode
echo ""
echo -e "${YELLOW}[4/6] Installing Bob Sentinel mode...${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_MODE="$SCRIPT_DIR/.bob/modes/sentinel.yaml"
TARGET_MODE="$MODES_DIR/sentinel.yaml"

if [ -f "$SOURCE_MODE" ]; then
    cp "$SOURCE_MODE" "$TARGET_MODE"
    echo -e "${GREEN}✓ Installed sentinel.yaml mode configuration${NC}"
else
    echo -e "${RED}ERROR: Source mode file not found: $SOURCE_MODE${NC}"
    exit 1
fi

# Step 5: Install CLI scanner
echo ""
echo -e "${YELLOW}[5/6] Installing CLI scanner...${NC}"
echo ""

CLI_DIR="$BOB_DIR/tools/bob-sentinel"
mkdir -p "$CLI_DIR"

SOURCE_SCANNER="$SCRIPT_DIR/cli/scanner.js"
TARGET_SCANNER="$CLI_DIR/scanner.js"

if [ -f "$SOURCE_SCANNER" ]; then
    cp "$SOURCE_SCANNER" "$TARGET_SCANNER"
    chmod +x "$TARGET_SCANNER"
    echo -e "${GREEN}✓ Installed scanner.js${NC}"
else
    echo -e "${RED}ERROR: Source scanner not found: $SOURCE_SCANNER${NC}"
    exit 1
fi

# Step 6: Optional git hooks installation
echo ""
echo -e "${YELLOW}[6/6] Git hooks installation (optional)...${NC}"
echo ""

read -p "Do you want to install git pre-push hooks? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d ".git" ]; then
        HOOKS_DIR=".git/hooks"
        SOURCE_HOOK="$SCRIPT_DIR/git-hooks/pre-push"
        TARGET_HOOK="$HOOKS_DIR/pre-push"
        
        if [ -f "$SOURCE_HOOK" ]; then
            # Backup existing hook if present
            if [ -f "$TARGET_HOOK" ]; then
                cp "$TARGET_HOOK" "$TARGET_HOOK.backup"
                echo -e "${GREEN}✓ Backed up existing pre-push hook${NC}"
            fi
            
            cp "$SOURCE_HOOK" "$TARGET_HOOK"
            chmod +x "$TARGET_HOOK"
            echo -e "${GREEN}✓ Installed pre-push hook${NC}"
        else
            echo -e "${YELLOW}⚠ Git hook source not found, skipping${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Not a git repository, skipping hooks${NC}"
    fi
else
    echo -e "${BLUE}⊘ Skipped git hooks installation${NC}"
fi

# Verify installation
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"
echo ""

VERIFIED=true

if [ ! -f "$TARGET_MODE" ]; then
    echo -e "${RED}✗ Mode configuration not found${NC}"
    VERIFIED=false
else
    echo -e "${GREEN}✓ Mode configuration verified${NC}"
fi

if [ ! -f "$TARGET_SCANNER" ]; then
    echo -e "${RED}✗ CLI scanner not found${NC}"
    VERIFIED=false
else
    echo -e "${GREEN}✓ CLI scanner verified${NC}"
fi

# Final summary
echo ""
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                    Installation Complete!                      ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

if [ "$VERIFIED" = true ]; then
    echo -e "${GREEN}✓ Bob Sentinel has been successfully integrated with IBM Bob!${NC}"
    echo ""
    echo -e "${YELLOW}NEXT STEPS:${NC}"
    echo "  1. Restart IBM Bob to load the new mode"
    echo "  2. Type '/mode sentinel' to activate Bob Sentinel"
    echo "  3. Use '/scan' to scan your codebase for vulnerabilities"
    echo ""
    echo -e "${YELLOW}DASHBOARD:${NC}"
    echo "  • Start backend:  cd dashboard/backend && npm install && npm start"
    echo "  • Start frontend: cd dashboard/frontend && npm install && npm run dev"
    echo "  • Access at: http://localhost:5173"
    echo ""
    echo -e "${YELLOW}DOCUMENTATION:${NC}"
    echo "  • User Guide:    $SCRIPT_DIR/USER_GUIDE.md"
    echo "  • Features:      $SCRIPT_DIR/FEATURES.md"
    echo "  • Quick Start:   $SCRIPT_DIR/QUICKSTART.md"
    echo ""
    
    # Ask if user wants to start dashboard
    read -p "Would you like to start the dashboard now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${YELLOW}Starting Bob Sentinel Dashboard...${NC}"
        echo ""
        
        # Install backend dependencies
        if [ ! -d "$SCRIPT_DIR/dashboard/backend/node_modules" ]; then
            echo "Installing backend dependencies..."
            cd "$SCRIPT_DIR/dashboard/backend"
            npm install
        fi
        
        # Install frontend dependencies
        if [ ! -d "$SCRIPT_DIR/dashboard/frontend/node_modules" ]; then
            echo "Installing frontend dependencies..."
            cd "$SCRIPT_DIR/dashboard/frontend"
            npm install
        fi
        
        # Start backend in background
        echo "Starting backend server..."
        cd "$SCRIPT_DIR/dashboard/backend"
        gnome-terminal -- bash -c "npm start; exec bash" 2>/dev/null || \
        xterm -e "npm start" 2>/dev/null || \
        konsole -e "npm start" 2>/dev/null || \
        (npm start &)
        
        sleep 3
        
        # Start frontend in background
        echo "Starting frontend server..."
        cd "$SCRIPT_DIR/dashboard/frontend"
        gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || \
        xterm -e "npm run dev" 2>/dev/null || \
        konsole -e "npm run dev" 2>/dev/null || \
        (npm run dev &)
        
        sleep 5
        
        # Open browser
        echo "Opening dashboard in browser..."
        xdg-open http://localhost:5173 2>/dev/null || \
        sensible-browser http://localhost:5173 2>/dev/null || \
        echo "Please open http://localhost:5173 in your browser"
        
        echo ""
        echo -e "${GREEN}Dashboard started!${NC}"
        echo "  Backend:  http://localhost:3000"
        echo "  Frontend: http://localhost:5173"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠ Installation completed with warnings${NC}"
    echo "  Please check the errors above and try again"
    echo ""
fi

echo -e "${CYAN}Thank you for using Bob Sentinel! 🛡️${NC}"

# Made with Bob

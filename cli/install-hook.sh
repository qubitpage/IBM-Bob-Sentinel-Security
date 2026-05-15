#!/bin/bash

###############################################################################
# Bob Sentinel Git Hook Installer
# Installs the pre-push hook to automatically scan code before pushing
###############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║      🛡️  Bob Sentinel - Git Hook Installer           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    echo "   Please run this script from the root of your git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-push hook
HOOK_SOURCE="./bob-sentinel/cli/pre-push-hook.sh"
HOOK_DEST=".git/hooks/pre-push"

if [ ! -f "$HOOK_SOURCE" ]; then
    echo "❌ Error: Hook source not found at $HOOK_SOURCE"
    exit 1
fi

# Backup existing hook if present
if [ -f "$HOOK_DEST" ]; then
    echo "⚠️  Existing pre-push hook found"
    BACKUP_FILE="$HOOK_DEST.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$HOOK_DEST" "$BACKUP_FILE"
    echo "   Backed up to: $BACKUP_FILE"
fi

# Install the hook
cp "$HOOK_SOURCE" "$HOOK_DEST"
chmod +x "$HOOK_DEST"

echo ""
echo "✓ Bob Sentinel pre-push hook installed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "What happens now:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Every time you run 'git push', Bob Sentinel will:"
echo "   • Check for cached security scan results"
echo "   • Display repository health score"
echo "   • Block push if CRITICAL issues are found"
echo "   • Warn about HIGH severity issues"
echo ""
echo "2. To scan your code:"
echo "   node bob-sentinel/cli/scanner.js ."
echo ""
echo "3. To view results in dashboard:"
echo "   cd bob-sentinel/dashboard/backend && npm start"
echo "   cd bob-sentinel/dashboard/frontend && npm run dev"
echo "   Open http://localhost:5173"
echo ""
echo "4. To bypass the hook (NOT RECOMMENDED):"
echo "   git push --no-verify"
echo ""
echo "5. To uninstall:"
echo "   rm .git/hooks/pre-push"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🛡️  Your repository is now protected by Bob Sentinel!"
echo ""

# Made with Bob

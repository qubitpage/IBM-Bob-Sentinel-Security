#!/bin/bash

###############################################################################
# Bob Sentinel Pre-Push Hook
# Automatically scans code for security vulnerabilities before git push
###############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║         🛡️  Bob Sentinel - Pre-Push Security Check    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Configuration
CACHE_FILE="./bob-sentinel/cache/vulnerabilities.json"
SCANNER_SCRIPT="./bob-sentinel/cli/scanner.js"
TARGET_DIR="."

# Check if scanner exists
if [ ! -f "$SCANNER_SCRIPT" ]; then
    echo "⚠️  Warning: Bob Sentinel scanner not found at $SCANNER_SCRIPT"
    echo "Skipping security scan..."
    exit 0
fi

# Check if cache file exists
if [ ! -f "$CACHE_FILE" ]; then
    echo "📊 No previous scan found. Running security scan..."
    node "$SCANNER_SCRIPT" "$TARGET_DIR"
    SCAN_EXIT_CODE=$?
else
    echo "✓ Using cached scan results"
    echo "  (Run 'node bob-sentinel/cli/scanner.js .' to rescan)"
    echo ""
    SCAN_EXIT_CODE=0
fi

# Parse scan results
if [ -f "$CACHE_FILE" ]; then
    # Extract health score and issue counts using grep and sed
    HEALTH_SCORE=$(grep -o '"health_score":[0-9]*' "$CACHE_FILE" | grep -o '[0-9]*' | head -1)
    CRITICAL=$(grep -o '"critical":[0-9]*' "$CACHE_FILE" | grep -o '[0-9]*' | head -1)
    HIGH=$(grep -o '"high":[0-9]*' "$CACHE_FILE" | grep -o '[0-9]*' | head -1)
    TOTAL=$(grep -o '"total":[0-9]*' "$CACHE_FILE" | grep -o '[0-9]*' | head -1)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Repository Health Score: $HEALTH_SCORE/100"
    echo "Total Issues: $TOTAL"
    echo "  Critical: $CRITICAL"
    echo "  High: $HIGH"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Block push if critical issues found
    if [ "$CRITICAL" -gt 0 ]; then
        echo "❌ PUSH BLOCKED: $CRITICAL critical security issues detected!"
        echo ""
        echo "Critical issues must be fixed before pushing to remote."
        echo ""
        echo "📊 View details in dashboard:"
        echo "   1. cd bob-sentinel/dashboard/backend && npm start"
        echo "   2. cd bob-sentinel/dashboard/frontend && npm run dev"
        echo "   3. Open http://localhost:5173"
        echo ""
        echo "Or review: $CACHE_FILE"
        echo ""
        echo "To bypass this check (NOT RECOMMENDED):"
        echo "   git push --no-verify"
        echo ""
        exit 1
    elif [ "$HIGH" -gt 0 ]; then
        echo "⚠️  WARNING: $HIGH high-severity issues detected"
        echo ""
        echo "Consider fixing these issues before pushing."
        echo "View details: $CACHE_FILE"
        echo ""
        echo "Allowing push to continue..."
        sleep 2
    else
        echo "✓ No critical issues found. Push allowed."
        echo ""
    fi
else
    echo "⚠️  No scan results found. Allowing push to continue..."
    echo ""
fi

exit 0

# Made with Bob

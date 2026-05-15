# 🤖 IBM Bob Chat Integration Guide

## Overview

This guide explains how to integrate Bob Sentinel natively into IBM Bob's chat interface, enabling automatic security scanning after code generation and before pushing to GitHub.

---

## 📋 Table of Contents

1. [Quick Install](#quick-install)
2. [Manual Integration](#manual-integration)
3. [Chat Commands](#chat-commands)
4. [Automatic Scanning](#automatic-scanning)
5. [Workflow Integration](#workflow-integration)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Install

### Option 1: Auto-Install Script (Recommended)

```powershell
# Run from bob-sentinel directory
.\install-bob-integration.ps1
```

The script will:
- ✅ Auto-detect IBM Bob installation
- ✅ Install Bob Sentinel mode
- ✅ Copy CLI scanner
- ✅ Set up git hooks (optional)
- ✅ Verify installation

### Option 2: One-Line Install

```powershell
# Specify Bob directory
.\install-bob-integration.ps1 -BobDirectory "C:\Users\YourName\.bob"
```

---

## 🔧 Manual Integration

### Step 1: Copy Mode Configuration

```powershell
# Copy sentinel mode to Bob's modes directory
Copy-Item .\.bob\modes\sentinel.yaml $env:USERPROFILE\.bob\modes\
```

### Step 2: Install CLI Scanner

```powershell
# Create tools directory
New-Item -ItemType Directory -Path "$env:USERPROFILE\.bob\tools\bob-sentinel" -Force

# Copy scanner
Copy-Item .\cli\scanner.js "$env:USERPROFILE\.bob\tools\bob-sentinel\"
```

### Step 3: Restart IBM Bob

Close and reopen IBM Bob to load the new mode.

---

## 💬 Chat Commands

### Activate Bob Sentinel Mode

```
/mode sentinel
```

### Scan Current Project

```
/scan
```

or

```
/scan path/to/directory
```

### View Scan Results

```
/results
```

### Filter by Severity

```
/results critical
/results high
/results medium
/results low
```

### Export Results

```
/export json
/export csv
```

### Get Help

```
/help sentinel
```

---

## 🔄 Automatic Scanning

### Pre-Push Hook Integration

Bob Sentinel can automatically scan your code before pushing to GitHub:

#### 1. Install Git Hook

```powershell
# From bob-sentinel directory
Copy-Item .\git-hooks\pre-push .\.git\hooks\
```

#### 2. Configure Scan Behavior

Edit `.git/hooks/pre-push`:

```bash
# Block push if critical issues found
BLOCK_ON_CRITICAL=true

# Block push if high severity issues found
BLOCK_ON_HIGH=false

# Show detailed report
SHOW_DETAILS=true
```

#### 3. Test the Hook

```bash
git add .
git commit -m "Test commit"
git push  # Will trigger scan
```

---

## 🔗 Workflow Integration

### Integration with IBM Bob Chat

#### Scenario 1: After Code Generation

```
User: Create a REST API with authentication

Bob: [Generates code]

Bob Sentinel: 🛡️ Scanning generated code...
              Found 3 vulnerabilities:
              - CRITICAL: Hardcoded API key in config.js:12
              - HIGH: SQL injection in users.js:45
              - MEDIUM: Missing input validation in auth.js:23

              Run /fix to apply suggested fixes
```

#### Scenario 2: Before GitHub Push

```
User: /push

Bob: Preparing to push to GitHub...

Bob Sentinel: 🛡️ Running security scan...
              ✓ No critical issues found
              ⚠ 2 medium severity issues detected
              
              Continue with push? (y/n)
```

#### Scenario 3: Continuous Monitoring

```
Bob Sentinel: 🛡️ Background scan complete
              Health Score: 85/100
              
              New issues since last scan:
              - HIGH: Exposed credentials in .env
              
              View details: /results
```

---

## ⚙️ Configuration

### Bob Sentinel Mode Configuration

Edit `~/.bob/modes/sentinel.yaml`:

```yaml
name: "Bob Sentinel"
slug: "sentinel"
description: "Security scanner for code vulnerabilities"

# Scan settings
scan:
  auto_scan: true              # Auto-scan after code generation
  scan_on_save: true           # Scan when files are saved
  scan_before_push: true       # Scan before git push
  
# Severity thresholds
thresholds:
  block_critical: true         # Block on critical issues
  block_high: false            # Allow high severity
  warn_medium: true            # Warn on medium severity
  
# Exclusions
exclude:
  - "node_modules/**"
  - "dist/**"
  - "build/**"
  - "*.min.js"
  
# Notifications
notifications:
  desktop: true                # Show desktop notifications
  chat: true                   # Show in chat
  email: false                 # Email notifications
```

### Custom Scan Patterns

Add custom vulnerability patterns:

```yaml
custom_patterns:
  - name: "Company API Key"
    pattern: "COMPANY_API_[A-Z0-9]{32}"
    severity: "CRITICAL"
    message: "Hardcoded company API key detected"
    
  - name: "Internal IP"
    pattern: "10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}"
    severity: "MEDIUM"
    message: "Internal IP address exposed"
```

---

## 🔌 Native Chat Integration

### Enable Auto-Scan After Code Generation

Add to Bob's configuration (`~/.bob/config.yaml`):

```yaml
hooks:
  after_code_generation:
    - mode: sentinel
      command: scan
      auto_fix: false
      
  before_git_push:
    - mode: sentinel
      command: scan
      block_on_critical: true
```

### Chat Interface Customization

```yaml
chat:
  sentinel:
    show_inline_warnings: true
    highlight_vulnerable_code: true
    suggest_fixes: true
    show_health_score: true
```

---

## 🎯 Usage Examples

### Example 1: Scan After Code Generation

```
User: Create a login API with JWT authentication

Bob: [Generates authentication code]

Bob Sentinel: 🛡️ Security Scan Results
              
              ✓ Scanned 5 files in 23ms
              ⚠ Found 2 issues:
              
              1. CRITICAL: JWT secret hardcoded
                 File: auth.js:15
                 Fix: Use environment variable
                 
              2. HIGH: No rate limiting on login endpoint
                 File: routes.js:34
                 Fix: Add express-rate-limit middleware
              
              Apply fixes? (y/n)
```

### Example 2: Interactive Fix

```
User: y

Bob Sentinel: Applying fixes...
              ✓ Moved JWT secret to .env
              ✓ Added rate limiting middleware
              ✓ Updated dependencies
              
              Re-scanning...
              ✓ All issues resolved!
              Health Score: 95/100
```

### Example 3: Pre-Push Scan

```
User: git push origin main

Bob Sentinel: 🛡️ Pre-push security scan...
              
              Scanning 12 files...
              ✓ No critical issues
              ✓ No high severity issues
              ⚠ 1 medium severity issue
              
              - MEDIUM: Console.log in production code
                File: utils.js:89
                
              Push anyway? (y/n)
```

---

## 🐛 Troubleshooting

### Issue: Mode Not Found

**Problem:** `/mode sentinel` returns "Mode not found"

**Solution:**
```powershell
# Verify mode file exists
Test-Path "$env:USERPROFILE\.bob\modes\sentinel.yaml"

# If false, reinstall
.\install-bob-integration.ps1
```

### Issue: Scanner Not Working

**Problem:** Scan command doesn't execute

**Solution:**
```powershell
# Check scanner installation
Test-Path "$env:USERPROFILE\.bob\tools\bob-sentinel\scanner.js"

# Test scanner manually
node "$env:USERPROFILE\.bob\tools\bob-sentinel\scanner.js" .
```

### Issue: Git Hook Not Triggering

**Problem:** Pre-push hook doesn't run

**Solution:**
```bash
# Make hook executable (Linux/Mac)
chmod +x .git/hooks/pre-push

# Verify hook exists
ls -la .git/hooks/pre-push

# Test hook manually
.git/hooks/pre-push
```

### Issue: False Positives

**Problem:** Scanner reports false vulnerabilities

**Solution:**

Add exclusions to `sentinel.yaml`:

```yaml
exclude_patterns:
  - "test/**"
  - "*.test.js"
  - "mock/**"
  
false_positive_patterns:
  - pattern: "API_KEY_TEST"
    reason: "Test API key, not real credentials"
```

---

## 📊 Dashboard Integration

### Launch Dashboard from Chat

```
/dashboard
```

This will:
1. Start backend API (port 3000)
2. Start frontend (port 5173)
3. Open browser to http://localhost:5173

### View Results in Dashboard

```
/dashboard results
```

### Export to Dashboard

```
/export dashboard
```

---

## 🔐 Security Best Practices

### 1. Regular Scans

```yaml
# Schedule automatic scans
schedule:
  daily: "09:00"
  before_push: true
  after_pull: true
```

### 2. Team Integration

```yaml
# Share configuration with team
team:
  shared_config: true
  config_repo: "github.com/yourteam/bob-sentinel-config"
```

### 3. CI/CD Integration

```yaml
# GitHub Actions
name: Bob Sentinel Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Bob Sentinel
        run: node scanner.js .
```

---

## 📚 Additional Resources

- **User Guide:** [USER_GUIDE.md](USER_GUIDE.md)
- **Features:** [FEATURES.md](FEATURES.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **API Documentation:** [API.md](API.md)

---

## 🆘 Support

### Get Help

```
/help sentinel
```

### Report Issues

```
/report issue "Description of problem"
```

### Community

- GitHub: [github.com/yourorg/bob-sentinel](https://github.com/yourorg/bob-sentinel)
- Discord: [discord.gg/bob-sentinel](https://discord.gg/bob-sentinel)
- Email: support@bob-sentinel.com

---

## ✨ What's Next?

After integration, Bob Sentinel will:

1. ✅ **Auto-scan** code after generation
2. ✅ **Block pushes** with critical vulnerabilities
3. ✅ **Suggest fixes** for detected issues
4. ✅ **Track health score** over time
5. ✅ **Generate reports** for your team

**Happy Secure Coding! 🛡️**
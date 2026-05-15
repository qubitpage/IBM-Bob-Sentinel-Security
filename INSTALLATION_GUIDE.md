# 📦 Bob Sentinel - Installation Guide

## Overview

This guide covers installation on **Windows**, **Linux (Ubuntu/Debian)**, and **macOS**.

---

## 🪟 Windows Installation

### Method 1: Double-Click Installer (Easiest)

1. **Navigate to bob-sentinel folder**
2. **Double-click** `INSTALL.bat`
3. **Follow the prompts**
4. **Done!** Bob Sentinel is installed

**What it does:**
- ✅ Auto-detects IBM Bob installation
- ✅ Installs Bob Sentinel mode
- ✅ Copies CLI scanner
- ✅ Optionally installs git hooks
- ✅ Optionally starts dashboard

### Method 2: PowerShell Script

```powershell
# Open PowerShell in bob-sentinel folder
.\install-bob-integration.ps1
```

### Method 3: Manual Installation

```powershell
# 1. Copy mode configuration
Copy-Item .\.bob\modes\sentinel.yaml $env:USERPROFILE\.bob\modes\

# 2. Copy CLI scanner
New-Item -ItemType Directory -Path "$env:USERPROFILE\.bob\tools\bob-sentinel" -Force
Copy-Item .\cli\scanner.js "$env:USERPROFILE\.bob\tools\bob-sentinel\"

# 3. Restart IBM Bob
```

---

## 🐧 Linux Installation (Ubuntu/Debian)

### Method 1: Bash Script (Recommended)

```bash
# Navigate to bob-sentinel folder
cd bob-sentinel

# Make script executable
chmod +x install.sh

# Run installer
./install.sh
```

### Method 2: Desktop Launcher (Ubuntu Desktop)

1. **Right-click** `bob-sentinel-installer.desktop`
2. **Select** "Allow Launching"
3. **Double-click** to run
4. **Follow prompts** in terminal

### Method 3: One-Line Install

```bash
cd bob-sentinel && chmod +x install.sh && ./install.sh
```

### Method 4: Manual Installation

```bash
# 1. Create modes directory
mkdir -p ~/.bob/modes

# 2. Copy mode configuration
cp .bob/modes/sentinel.yaml ~/.bob/modes/

# 3. Copy CLI scanner
mkdir -p ~/.bob/tools/bob-sentinel
cp cli/scanner.js ~/.bob/tools/bob-sentinel/
chmod +x ~/.bob/tools/bob-sentinel/scanner.js

# 4. Restart IBM Bob
```

---

## 🍎 macOS Installation

### Method 1: Bash Script

```bash
# Navigate to bob-sentinel folder
cd bob-sentinel

# Make script executable
chmod +x install.sh

# Run installer
./install.sh
```

### Method 2: Manual Installation

```bash
# 1. Create modes directory
mkdir -p ~/Library/Application\ Support/bob/modes

# 2. Copy mode configuration
cp .bob/modes/sentinel.yaml ~/Library/Application\ Support/bob/modes/

# 3. Copy CLI scanner
mkdir -p ~/Library/Application\ Support/bob/tools/bob-sentinel
cp cli/scanner.js ~/Library/Application\ Support/bob/tools/bob-sentinel/
chmod +x ~/Library/Application\ Support/bob/tools/bob-sentinel/scanner.js

# 4. Restart IBM Bob
```

---

## 📋 Prerequisites

### All Platforms

**Required:**
- IBM Bob installed
- Node.js 16+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

**Optional:**
- Git (for git hooks)

### Check Prerequisites

**Windows:**
```powershell
node --version
npm --version
```

**Linux/macOS:**
```bash
node --version
npm --version
```

---

## 🚀 Post-Installation

### 1. Verify Installation

**Check mode file:**

**Windows:**
```powershell
Test-Path "$env:USERPROFILE\.bob\modes\sentinel.yaml"
```

**Linux/macOS:**
```bash
ls -la ~/.bob/modes/sentinel.yaml
```

**Check scanner:**

**Windows:**
```powershell
Test-Path "$env:USERPROFILE\.bob\tools\bob-sentinel\scanner.js"
```

**Linux/macOS:**
```bash
ls -la ~/.bob/tools/bob-sentinel/scanner.js
```

### 2. Restart IBM Bob

Close and reopen IBM Bob to load the new mode.

### 3. Activate Bob Sentinel

In IBM Bob chat:
```
/mode sentinel
```

### 4. Test Scanner

```
/scan
```

---

## 🎨 Start Dashboard

### Windows

**Option 1: Via Installer**
- The `INSTALL.bat` will ask if you want to start the dashboard

**Option 2: Manual**
```powershell
# Terminal 1 - Backend
cd dashboard\backend
npm install
npm start

# Terminal 2 - Frontend
cd dashboard\frontend
npm install
npm run dev
```

### Linux/macOS

**Option 1: Via Installer**
- The `install.sh` will ask if you want to start the dashboard

**Option 2: Manual**
```bash
# Terminal 1 - Backend
cd dashboard/backend
npm install
npm start

# Terminal 2 - Frontend
cd dashboard/frontend
npm install
npm run dev
```

### Access Dashboard

Open browser to: **http://localhost:5173**

---

## 🔧 Troubleshooting

### Issue: "IBM Bob not found"

**Solution:**
Specify the Bob directory manually:

**Windows:**
```powershell
.\install-bob-integration.ps1 -BobDirectory "C:\Path\To\Bob"
```

**Linux/macOS:**
```bash
# Edit install.sh and set BOB_DIR manually
BOB_DIR="/path/to/bob"
```

### Issue: "Permission denied" (Linux/macOS)

**Solution:**
```bash
chmod +x install.sh
chmod +x cli/scanner.js
```

### Issue: "Node.js not found"

**Solution:**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nodejs npm
```

**Fedora:**
```bash
sudo dnf install nodejs npm
```

**macOS:**
```bash
brew install node
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Issue: "Port already in use"

**Solution:**
```bash
# Find process using port 3000
# Windows:
netstat -ano | findstr :3000

# Linux/macOS:
lsof -i :3000

# Kill the process or use different port
```

---

## 🔄 Updating Bob Sentinel

### Windows

```powershell
# Re-run installer
.\INSTALL.bat
```

### Linux/macOS

```bash
# Re-run installer
./install.sh
```

---

## 🗑️ Uninstallation

### Windows

```powershell
# Remove mode
Remove-Item "$env:USERPROFILE\.bob\modes\sentinel.yaml"

# Remove scanner
Remove-Item -Recurse "$env:USERPROFILE\.bob\tools\bob-sentinel"

# Remove git hook (if installed)
Remove-Item ".git\hooks\pre-push"
```

### Linux/macOS

```bash
# Remove mode
rm ~/.bob/modes/sentinel.yaml

# Remove scanner
rm -rf ~/.bob/tools/bob-sentinel

# Remove git hook (if installed)
rm .git/hooks/pre-push
```

---

## 📚 Next Steps

After installation:

1. **Read User Guide:** [USER_GUIDE.md](USER_GUIDE.md)
2. **Explore Features:** [FEATURES.md](FEATURES.md)
3. **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
4. **IBM Bob Integration:** [IBM_BOB_INTEGRATION.md](IBM_BOB_INTEGRATION.md)

---

## 🆘 Getting Help

### Documentation

- **User Guide:** Simple, friendly guide
- **Quick Start:** Step-by-step setup
- **Features:** Detailed feature list
- **Integration:** IBM Bob setup

### Support

- **GitHub Issues:** Report bugs
- **Email:** support@bob-sentinel.com
- **Chat:** `/help sentinel` in IBM Bob

---

## ✅ Installation Checklist

- [ ] Prerequisites installed (Node.js, npm)
- [ ] IBM Bob installed
- [ ] Ran installer (INSTALL.bat or install.sh)
- [ ] Verified mode file exists
- [ ] Verified scanner exists
- [ ] Restarted IBM Bob
- [ ] Activated sentinel mode (`/mode sentinel`)
- [ ] Tested scanner (`/scan`)
- [ ] Started dashboard (optional)
- [ ] Opened dashboard in browser (optional)

---

## 🎉 Success!

If all steps completed successfully, you're ready to use Bob Sentinel!

**Test it:**
```
/mode sentinel
/scan
```

**View results:**
Open http://localhost:5173 in your browser

**Happy Secure Coding! 🛡️**
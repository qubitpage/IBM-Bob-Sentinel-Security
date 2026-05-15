# 🚀 Bob Sentinel - Quick Install

## Choose Your Platform

### 🪟 Windows Users

**Double-click:** `INSTALL.bat`

That's it! The installer will:
- Find IBM Bob automatically
- Install Bob Sentinel
- Optionally start the dashboard
- Guide you through everything

### 🐧 Linux Users (Ubuntu/Debian)

**Option 1: Terminal**
```bash
chmod +x install.sh
./install.sh
```

**Option 2: Desktop**
- Right-click `bob-sentinel-installer.desktop`
- Select "Allow Launching"
- Double-click to run

### 🍎 macOS Users

```bash
chmod +x install.sh
./install.sh
```

---

## What Gets Installed?

1. **Bob Sentinel Mode** → `~/.bob/modes/sentinel.yaml`
2. **CLI Scanner** → `~/.bob/tools/bob-sentinel/scanner.js`
3. **Git Hooks** (optional) → `.git/hooks/pre-push`

---

## After Installation

### 1. Restart IBM Bob

Close and reopen IBM Bob

### 2. Activate Bob Sentinel

In IBM Bob chat:
```
/mode sentinel
```

### 3. Scan Your Code

```
/scan
```

### 4. View Dashboard (Optional)

**Start servers:**

**Windows:**
```powershell
# Terminal 1
cd dashboard\backend && npm install && npm start

# Terminal 2
cd dashboard\frontend && npm install && npm run dev
```

**Linux/macOS:**
```bash
# Terminal 1
cd dashboard/backend && npm install && npm start

# Terminal 2
cd dashboard/frontend && npm install && npm run dev
```

**Open browser:** http://localhost:5173

---

## Need Help?

- **Full Guide:** [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- **User Guide:** [USER_GUIDE.md](USER_GUIDE.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)

---

## Requirements

- IBM Bob installed
- Node.js 16+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

---

## Troubleshooting

### "IBM Bob not found"

**Windows:**
```powershell
.\install-bob-integration.ps1 -BobDirectory "C:\Path\To\Bob"
```

**Linux/macOS:**
Edit `install.sh` and set `BOB_DIR="/path/to/bob"`

### "Permission denied" (Linux/macOS)

```bash
chmod +x install.sh
```

### "Node.js not found"

Install Node.js from [nodejs.org](https://nodejs.org/)

---

## Quick Test

After installation:

```
/mode sentinel
/scan
```

You should see vulnerability scan results!

---

**That's it! You're ready to use Bob Sentinel! 🛡️**
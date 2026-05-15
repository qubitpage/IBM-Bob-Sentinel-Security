# 🚀 Bob Sentinel - Quick Start Guide

## 📍 Your Project Location

Your Bob Sentinel project is located at:
```
d:/QubitDev/silicon-os/bob-sentinel/
```

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Run the Scanner

```powershell
# Navigate to your project root
cd d:/QubitDev/silicon-os

# Run the security scanner
node bob-sentinel/cli/scanner.js bob-sentinel/sample-vulnerable-app
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║         🛡️  Bob Sentinel Security Scanner            ║
╚════════════════════════════════════════════════════════╝

Scanning: bob-sentinel/sample-vulnerable-app

Scan Complete!
────────────────────────────────────────────────────────────
Files Scanned:     7
Vulnerabilities:   26
  Critical:        23
  High:            2
  Medium:          1
  Low:             0
Health Score:      0/100
Duration:          ~26ms
────────────────────────────────────────────────────────────
Report saved to: bob-sentinel/cache/vulnerabilities.json

⚠️  CRITICAL issues found! Review immediately.
```

✅ **Scanner is working!** It found 26 real vulnerabilities.

---

### Step 2: Start the Backend API

Open a **new PowerShell terminal**:

```powershell
# Navigate to backend
cd d:/QubitDev/silicon-os/bob-sentinel/dashboard/backend

# Install dependencies (first time only)
npm install

# Start the server
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║         🛡️  Bob Sentinel Dashboard API               ║
╠════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:3000             ║
║  Health check:      http://localhost:3000/api/health  ║
║  Scan results:      http://localhost:3000/api/scan-results║
╚════════════════════════════════════════════════════════╝
```

✅ **Backend is running!** Keep this terminal open.

**Test the API:**
Open browser to: http://localhost:3000/api/health

---

### Step 3: Start the Frontend Dashboard

Open **another new PowerShell terminal**:

```powershell
# Navigate to frontend
cd d:/QubitDev/silicon-os/bob-sentinel/dashboard/frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

✅ **Frontend is running!**

---

### Step 4: View the Dashboard

**Open your browser to:**
```
http://localhost:5173
```

You should see:
- 🛡️ **Bob Sentinel** header
- **Health Score**: 0/100 (red circle)
- **Severity Distribution**: 23 Critical, 2 High, 1 Medium
- **Vulnerability Feed**: List of 26 security issues
- **Interactive UI**: Click any vulnerability to see details

---

## 🧪 Testing the Features

### Test 1: View Vulnerability Details

1. In the dashboard, scroll to the vulnerability list
2. Click on any vulnerability card to expand it
3. Click "View Full Details & Fix →"
4. You'll see:
   - ❌ Vulnerable code on the left
   - ✅ Secure code on the right
   - Detailed explanation
   - Step-by-step fix instructions

### Test 2: Filter Vulnerabilities

1. In the left sidebar, use the filters:
   - **Severity**: Select "CRITICAL"
   - **Category**: Select "secrets"
2. The list updates to show only matching vulnerabilities

### Test 3: Search Vulnerabilities

1. In the vulnerability feed header, use the search box
2. Type "AWS" or "SQL" or "password"
3. Results filter in real-time

### Test 4: Export Results

1. Click the "📥 Export" button in the header
2. Choose JSON or CSV format
3. File downloads with all scan results

### Test 5: API Endpoints

Test these URLs in your browser:

```
# Health check
http://localhost:3000/api/health

# All vulnerabilities
http://localhost:3000/api/scan-results

# Filter by severity
http://localhost:3000/api/vulnerabilities?severity=CRITICAL

# Get health score
http://localhost:3000/api/health-score

# Get summary
http://localhost:3000/api/summary

# Export as JSON
http://localhost:3000/api/export?format=json

# Export as CSV
http://localhost:3000/api/export?format=csv
```

---

## 🔗 Git Hook Installation (Optional)

To automatically scan code before git push:

```powershell
cd d:/QubitDev/silicon-os

# Install the pre-push hook
bash bob-sentinel/cli/install-hook.sh
```

**Test it:**
```powershell
# Try to push (will be blocked due to critical issues)
git add .
git commit -m "Test commit"
git push
```

You'll see:
```
❌ PUSH BLOCKED: 23 critical security issues detected!
```

---

## 📦 Installing as IBM Bob Custom Mode

### Option 1: Manual Installation

1. **Copy the mode configuration:**
   ```powershell
   # Copy sentinel.yaml to Bob's modes directory
   # (Adjust path based on your Bob installation)
   Copy-Item bob-sentinel/.bob/modes/sentinel.yaml ~/.bob/modes/
   ```

2. **Restart IBM Bob** to load the new mode

3. **Use the mode:**
   ```bash
   bob --mode=sentinel scan ./your-project
   ```

### Option 2: As a Bob Extension (Recommended for Distribution)

To publish Bob Sentinel as an official extension:

#### 1. Create Extension Package

```powershell
cd bob-sentinel

# Create extension manifest
New-Item -ItemType File -Path "extension.json"
```

**extension.json:**
```json
{
  "name": "bob-sentinel",
  "version": "1.0.0",
  "displayName": "Bob Sentinel - Security Scanner",
  "description": "Pre-flight security scanner that catches vulnerabilities before they reach production",
  "author": "Your Name",
  "license": "MIT",
  "repository": "https://github.com/yourusername/bob-sentinel",
  "keywords": ["security", "scanner", "vulnerabilities", "secrets"],
  "modes": [
    {
      "slug": "sentinel",
      "name": "Bob Sentinel",
      "description": "Security scanning mode",
      "config": ".bob/modes/sentinel.yaml"
    }
  ],
  "commands": [
    {
      "name": "scan",
      "description": "Scan project for security vulnerabilities",
      "script": "cli/scanner.js"
    }
  ],
  "dependencies": {
    "node": ">=18.0.0"
  }
}
```

#### 2. Package the Extension

```powershell
# Create a distributable package
tar -czf bob-sentinel-v1.0.0.tar.gz bob-sentinel/
```

#### 3. Submit to Bob Extension Registry

1. Go to IBM Bob Extension Registry (if available)
2. Click "Submit Extension"
3. Upload `bob-sentinel-v1.0.0.tar.gz`
4. Fill in metadata:
   - **Name**: Bob Sentinel
   - **Category**: Security
   - **Description**: Pre-flight security scanner
   - **Tags**: security, scanner, vulnerabilities, secrets

#### 4. Users Can Install Via:

```bash
# Once published
bob extension install bob-sentinel

# Or from local file
bob extension install ./bob-sentinel-v1.0.0.tar.gz
```

---

## 🌐 Sharing Your Dashboard

### Option 1: Local Network Access

To allow others on your network to access the dashboard:

```powershell
# Start frontend with network access
cd bob-sentinel/dashboard/frontend
npm run dev -- --host
```

Then share: `http://YOUR-IP:5173`

### Option 2: Deploy to Production

#### Deploy Backend (Node.js):
```bash
# On your server
cd bob-sentinel/dashboard/backend
npm install --production
PORT=3000 node server.js
```

#### Deploy Frontend (Static):
```bash
# Build for production
cd bob-sentinel/dashboard/frontend
npm run build

# Serve the dist/ folder with any static server
# (nginx, Apache, Vercel, Netlify, etc.)
```

---

## 📊 Project Structure Reference

```
bob-sentinel/
├── .bob/modes/
│   └── sentinel.yaml           # Bob custom mode config
│
├── sample-vulnerable-app/      # Demo app with vulnerabilities
│   ├── backend/
│   │   ├── config.js          # 10 hardcoded secrets
│   │   ├── db.js              # 8 SQL injection issues
│   │   ├── auth.js            # 5 auth vulnerabilities
│   │   └── api.js             # 7 XSS/injection issues
│   ├── frontend/
│   │   └── api-client.js      # 5 frontend vulnerabilities
│   └── .env                   # 15 leaked credentials
│
├── cache/
│   └── vulnerabilities.json   # Scan results (26 issues found)
│
├── cli/
│   ├── scanner.js             # Real security scanner
│   ├── pre-push-hook.sh       # Git hook
│   └── install-hook.sh        # Hook installer
│
├── dashboard/
│   ├── backend/
│   │   ├── server.js          # Express API (10+ endpoints)
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx                    # Main app
│       │   ├── components/
│       │   │   ├── Dashboard.jsx          # Overview
│       │   │   ├── HealthScore.jsx        # Health widget
│       │   │   ├── VulnerabilityFeed.jsx  # Issue list
│       │   │   └── CodeDiffViewer.jsx     # Diff viewer
│       │   └── App.css
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
│
├── docs/
│   └── FEATURES.md            # Complete feature documentation
│
├── README.md                  # Main documentation
├── DEMO_SCRIPT.md            # Presentation guide
└── QUICKSTART.md             # This file
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
```powershell
# Install dependencies
cd bob-sentinel/dashboard/backend
npm install

cd ../frontend
npm install
```

### Issue: "Port 3000 already in use"
```powershell
# Kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
$env:PORT=3001
npm start
```

### Issue: "CORS error in browser"
- Make sure backend is running on port 3000
- Frontend proxy is configured in `vite.config.js`
- Clear browser cache and reload

### Issue: "No scan results found"
```powershell
# Run the scanner first
node bob-sentinel/cli/scanner.js bob-sentinel/sample-vulnerable-app
```

---

## 📞 Support & Resources

- **Documentation**: `bob-sentinel/README.md`
- **Features Guide**: `bob-sentinel/docs/FEATURES.md`
- **Demo Script**: `bob-sentinel/DEMO_SCRIPT.md`
- **Source Code**: All files in `bob-sentinel/`

---

## ✅ Verification Checklist

- [ ] Scanner runs and finds 26 vulnerabilities
- [ ] Backend API responds at http://localhost:3000/api/health
- [ ] Frontend loads at http://localhost:5173
- [ ] Dashboard shows health score 0/100
- [ ] Can click vulnerabilities to see details
- [ ] Filters and search work
- [ ] Can export results
- [ ] Git hook blocks push (if installed)

---

## 🎯 Next Steps

1. **Scan your own project:**
   ```powershell
   node bob-sentinel/cli/scanner.js /path/to/your/project
   ```

2. **Customize patterns:**
   - Edit `cli/scanner.js`
   - Add new regex patterns
   - Adjust severity levels

3. **Extend the dashboard:**
   - Add new components
   - Customize styling
   - Add more visualizations

4. **Integrate with CI/CD:**
   - Add scanner to GitHub Actions
   - Block PRs with critical issues
   - Generate reports

---

**🛡️ Bob Sentinel is ready to protect your code!**

*Built for IBM Bob Hackathon - Production-ready security scanning*
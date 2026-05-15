# 👤 Bob Sentinel - User Guide

## Welcome! 👋

Bob Sentinel is your security companion that helps you find and fix vulnerabilities in your code **before** they reach production.

---

## 🎯 What Does Bob Sentinel Do?

Think of Bob Sentinel as a security guard for your code:

- 🔍 **Scans** your code for security problems
- 🚨 **Alerts** you about dangerous code patterns
- 💡 **Suggests** how to fix the issues
- 📊 **Tracks** your code's security health over time

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install

```powershell
cd bob-sentinel
.\install-bob-integration.ps1
```

**What this does:** Installs Bob Sentinel into IBM Bob

### Step 2: Start Dashboard

```powershell
# Terminal 1 - Start Backend
cd dashboard/backend
npm install
npm start

# Terminal 2 - Start Frontend
cd dashboard/frontend
npm install
npm run dev
```

**What this does:** Starts the visual dashboard

### Step 3: Open Dashboard

Open your browser to: **http://localhost:5173**

**What you'll see:** A beautiful dashboard showing your code's security status

---

## 📱 Using the Dashboard

### 🏠 Home Page

**What you see:**
- **Health Score** - A number from 0-100 (higher is better!)
- **Severity Cards** - Count of Critical, High, Medium, Low issues
- **Category Breakdown** - Types of vulnerabilities found

**What each color means:**
- 🔴 **Red (Critical)** - Fix immediately! Very dangerous
- 🟠 **Orange (High)** - Fix soon, could be exploited
- 🟡 **Yellow (Medium)** - Fix when you can, potential risk
- 🟢 **Green (Low)** - Minor issue, low priority

### 🔍 Vulnerabilities Page

**What you can do:**
- **Search** - Type keywords to find specific issues
- **Filter** - Click severity buttons to show only certain types
- **Sort** - Organize by severity, file, or line number
- **Expand** - Click any card to see full details

**Understanding a Vulnerability Card:**

```
┌─────────────────────────────────────────┐
│ 🔴 CRITICAL                             │
│ Hardcoded API Key                       │
│                                         │
│ File: config.js                         │
│ Line: 12                                │
│ Category: hardcoded-secrets             │
│                                         │
│ [View Details] [Copy] [Fix]            │
└─────────────────────────────────────────┘
```

### 📝 Vulnerability Details

When you click "View Details", you see:

1. **Vulnerable Code** (left, red) - The problematic code
2. **Secure Code** (right, green) - How it should look
3. **Explanation** - Why this is dangerous
4. **Security Impact** - What could happen
5. **Fix Instructions** - Step-by-step how to fix it

---

## 🎨 Understanding the Interface

### Health Score Widget

```
    ╭─────────╮
    │   85    │  ← Your score (0-100)
    │ /100    │
    ╰─────────╯
    
    Excellent  ← Status
```

**Score Ranges:**
- **90-100** 🟢 Excellent - Great job!
- **70-89** 🔵 Good - Minor issues
- **50-69** 🟡 Fair - Needs attention
- **30-49** 🟠 Poor - Many issues
- **0-29** 🔴 Critical - Urgent fixes needed

### Severity Cards

Each card shows:
- **Icon** - Visual indicator
- **Count** - Number of issues
- **Severity** - Critical/High/Medium/Low
- **Color** - Quick visual reference

### Category Breakdown

Shows **types** of vulnerabilities:
- Hardcoded Secrets (passwords, API keys)
- SQL Injection (database attacks)
- XSS (cross-site scripting)
- Command Injection (system commands)
- And more...

---

## 🔧 Common Tasks

### Task 1: Scan Your Code

**From Command Line:**
```bash
cd bob-sentinel
node cli/scanner.js path/to/your/code
```

**From IBM Bob Chat:**
```
/mode sentinel
/scan
```

**What happens:**
1. Scanner reads your files
2. Checks for vulnerability patterns
3. Generates a report
4. Shows results in dashboard

### Task 2: Fix a Vulnerability

**Step-by-step:**

1. **Find the issue** in dashboard
2. **Click "View Details"**
3. **Read the explanation**
4. **Copy the secure code** (right panel)
5. **Replace your code** with the secure version
6. **Save the file**
7. **Re-scan** to verify fix

**Example:**

❌ **Before (Vulnerable):**
```javascript
const apiKey = "sk_live_abc123";  // Hardcoded!
```

✅ **After (Secure):**
```javascript
const apiKey = process.env.API_KEY;  // From environment
```

### Task 3: Export Results

**For your team:**
```bash
# JSON format
curl http://localhost:3000/api/export/json > report.json

# CSV format (for Excel)
curl http://localhost:3000/api/export/csv > report.csv
```

**What you get:**
- Complete list of all vulnerabilities
- File locations and line numbers
- Severity levels
- Descriptions

### Task 4: Filter Results

**In Dashboard:**
- Click **"Critical"** button - Shows only critical issues
- Click **"High"** button - Shows only high severity
- Click **"All"** - Shows everything

**Via API:**
```bash
# Only critical issues
curl http://localhost:3000/api/vulnerabilities?severity=CRITICAL

# Only SQL injection
curl http://localhost:3000/api/vulnerabilities?category=sql-injection
```

---

## 💡 Tips & Tricks

### Tip 1: Start with Critical Issues

Always fix **Critical** issues first. They're the most dangerous!

### Tip 2: Use Search

Type keywords in the search box:
- "password" - Find password-related issues
- "sql" - Find SQL injection vulnerabilities
- "config.js" - Find issues in specific file

### Tip 3: Check Health Score Daily

Monitor your health score to track improvement:
- **Going up?** 📈 You're fixing issues!
- **Going down?** 📉 New vulnerabilities added

### Tip 4: Set Up Git Hooks

Prevent bad code from being pushed:
```bash
# Install pre-push hook
Copy-Item git-hooks/pre-push .git/hooks/
```

Now git will scan before every push!

### Tip 5: Share with Team

Export reports and share:
```bash
# Generate team report
node cli/scanner.js . > team-report.txt
```

---

## 🆘 Troubleshooting

### Problem: Dashboard Won't Load

**Solution:**
1. Check if backend is running (port 3000)
2. Check if frontend is running (port 5173)
3. Try refreshing the page (Ctrl+F5)

### Problem: No Vulnerabilities Showing

**Solution:**
1. Run a scan first: `node cli/scanner.js .`
2. Check if scan results exist: `cache/vulnerabilities.json`
3. Refresh the dashboard

### Problem: Can't Read Text

**Solution:**
- The new dark theme has high contrast
- White text on dark background
- If still hard to read, zoom in (Ctrl++)

### Problem: Too Many False Positives

**Solution:**
Add exclusions to `.bob/modes/sentinel.yaml`:
```yaml
exclude:
  - "test/**"
  - "*.test.js"
  - "node_modules/**"
```

---

## 📚 Learn More

### Understanding Vulnerabilities

**Hardcoded Secrets:**
- **What:** Passwords/keys in code
- **Why bad:** Anyone can see them
- **Fix:** Use environment variables

**SQL Injection:**
- **What:** Unsafe database queries
- **Why bad:** Attackers can steal data
- **Fix:** Use parameterized queries

**XSS (Cross-Site Scripting):**
- **What:** Unsafe HTML output
- **Why bad:** Attackers can run malicious scripts
- **Fix:** Sanitize user input

**Command Injection:**
- **What:** Unsafe system commands
- **Why bad:** Attackers can run commands
- **Fix:** Validate and escape input

### Best Practices

1. **Scan regularly** - Daily or before each commit
2. **Fix critical first** - Prioritize by severity
3. **Review all changes** - Understand each fix
4. **Test after fixing** - Ensure code still works
5. **Share knowledge** - Teach your team

---

## 🎓 Training Scenarios

### Scenario 1: First Scan

**You:** Run first scan
**Result:** 26 vulnerabilities found
**Action:** Don't panic! Start with critical ones

### Scenario 2: Critical Issue

**You:** See "Hardcoded API Key"
**Action:**
1. Click "View Details"
2. Read explanation
3. Move key to `.env` file
4. Update code to use `process.env.API_KEY`
5. Re-scan to verify

### Scenario 3: Before Deployment

**You:** About to deploy to production
**Action:**
1. Run full scan
2. Check health score (should be >80)
3. Fix any critical/high issues
4. Export report for records
5. Deploy with confidence!

---

## 🎯 Goals

### Week 1: Learn the Basics
- ✅ Install Bob Sentinel
- ✅ Run your first scan
- ✅ Fix one vulnerability
- ✅ Understand health score

### Week 2: Build Habits
- ✅ Scan before every commit
- ✅ Fix all critical issues
- ✅ Improve health score by 10 points
- ✅ Share results with team

### Week 3: Master It
- ✅ Set up git hooks
- ✅ Achieve 90+ health score
- ✅ Help teammates fix issues
- ✅ Customize scan patterns

---

## 📞 Get Help

### Quick Help
```
/help sentinel
```

### Documentation
- **Features:** [FEATURES.md](FEATURES.md)
- **IBM Bob Integration:** [IBM_BOB_INTEGRATION.md](IBM_BOB_INTEGRATION.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)

### Support
- **GitHub Issues:** Report bugs
- **Team Chat:** Ask questions
- **Email:** support@bob-sentinel.com

---

## ✨ You're Ready!

You now know how to:
- ✅ Use the dashboard
- ✅ Find vulnerabilities
- ✅ Fix security issues
- ✅ Track your progress

**Start scanning and make your code more secure! 🛡️**

---

*Made with ❤️ for IBM Bob Hackathon*
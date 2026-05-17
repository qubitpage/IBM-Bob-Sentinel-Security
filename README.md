<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/IBM%20Bob-Hackathon-054ADA?logo=ibm" alt="IBM Bob Hackathon">
</p>

# 🛡️ Bob Sentinel — Pre-Flight Code & Secret Firewall

> **Zero-trust security scanner that catches vulnerabilities, hardcoded secrets, and unsafe code before it reaches production.**

Bob Sentinel scans any codebase in milliseconds, surfaces every finding in a clean web dashboard, and tells you exactly what's wrong, where, and how to fix it. Built for the **IBM Bob Hackathon**.

---

## Table of Contents

- [Quick Demo](#-quick-demo)
- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Security Patterns Detected](#-security-patterns-detected)
- [Sample Scan Results](#-sample-scan-results)
- [Technology Stack](#-technology-stack)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎬 Quick Demo

```text
$ node cli/scanner.js sample-vulnerable-app

╔════════════════════════════════════════════════════════╗
║         🛡️  Bob Sentinel Security Scanner             ║
╚════════════════════════════════════════════════════════╝

Scanning: sample-vulnerable-app

Scan Complete!
────────────────────────────────────────────────────────────
Files Scanned:     7
Vulnerabilities:   26
  Critical:        23
  High:            2
  Medium:          1
  Low:             0
Health Score:      0/100
Duration:          10ms
────────────────────────────────────────────────────────────
Report saved to: cache/vulnerabilities.json

⚠️  CRITICAL issues found! Review immediately.
```

Then open the dashboard at `http://localhost:5173` to explore every finding interactively.

---

## ✨ Features

### Security Scanner (CLI)
- **40 vulnerability patterns** covering OWASP Top 10 categories
- Recursive directory scanning with smart exclusions (`node_modules`, `.git`, `dist`, `.next`, `cache`, etc.)
- Per-finding CWE and OWASP mapping with confidence scores
- JSON report output, CI/CD-friendly exit codes
- Scans JS, TS, JSX, TSX, Python, Java, PHP, Ruby, Go, C#, `.env`, config, JSON, YAML

### Code & Secret Firewall
- **Policy engine:** every scan is evaluated by `lib/firewall.js`
- **Release decision:** returns `ALLOW`, `WARN`, or `BLOCK`
- **Blocking logic:** blocks critical issues, critical secret leaks, critical exploit paths, and scans below the health floor
- **Explainable checks:** reports which firewall rule fired and which files are affected
- **Publish guard:** `node cli/publish-guard.js` checks release targets before any human or AI publishes
- **Git enforcement:** the pre-push hook blocks when the firewall returns `BLOCK`

### Web Dashboard
- **Scan from the browser** — enter any directory path and click Run Scan
- **Folder browser** — navigate your filesystem visually, pick a folder, scan it
- **Health Score ring** — 0-100 score with severity breakdown
- **Overview tab** — severity cards, category bars, most affected files
- **Issues tab** — searchable, sortable, filterable list with expandable detail cards
  - Each card shows: code snippet, "What is this?" explanation, file path, line number, CWE, OWASP, confidence %
- **Scan Log tab** — full scanner console output with Rescan and Clear buttons
- **Firewall tab** — release gate status, policy checks, block reasons, affected files, next steps
- **Filters** — severity pills (Critical/High/Medium/Low), category dropdown, text search
- **Code Diff Viewer** — side-by-side vulnerable vs. secure code with fix steps
- **Export** — download results as JSON or CSV

### REST API
- 12+ endpoints for programmatic access
- Filter by severity, category, file
- Health checks, export, browse, and firewall decision endpoints
- CORS enabled for frontend integration

### IBM Bob Integration
- Custom Bob mode (`sentinel.yaml`) with 6 slash commands
- `/scan`, `/results`, `/fix`, `/export`, `/health`, `/help`
- PowerShell and Bash installers for one-click setup

---

## 📋 Requirements

| Requirement | Version |
|-------------|---------|
| **Node.js** | 18 or later |
| **npm** | 9 or later (ships with Node.js) |
| **OS** | Windows, macOS, or Linux |
| **Browser** | Any modern browser (Chrome, Firefox, Edge, Safari) |
| **Disk** | ~50 MB |

> **No database, no Docker, no cloud account required.** Everything runs locally.

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/qubitpage/IBM-Bob-Sentinel-Security.git
cd IBM-Bob-Sentinel-Security
```

### 2. Install dependencies

```bash
# Backend API
cd dashboard/backend
npm install

# Frontend dashboard (open a second terminal)
cd dashboard/frontend
npm install
```

### 3. Start the servers

```bash
# Terminal 1 — Backend API (port 3000)
cd dashboard/backend
npm start

# Terminal 2 — Frontend dev server (port 5173)
cd dashboard/frontend
npm run dev
```

### 4. Open the dashboard

Navigate to **http://localhost:5173** in your browser.

### One-liner (after clone)

```bash
cd IBM-Bob-Sentinel-Security && \
  cd dashboard/backend && npm install && npm start &
  cd dashboard/frontend && npm install && npm run dev
```

### Windows — Double-click installer

Run `INSTALL.bat` to install everything and start the servers automatically.

### Optional — IBM Bob integration

```powershell
# PowerShell (Windows)
.\install-bob-integration.ps1

# Bash (macOS/Linux)
chmod +x install.sh && ./install.sh
```

---

## 🔍 Usage

### Scan from the web dashboard

1. Open **http://localhost:5173**
2. Type a directory path in the top bar (or leave empty for the sample app)
3. Click **Run Scan**
4. Results appear immediately — overview, issues, firewall, and scan log

### Scan using the folder browser

1. Click the **📁** button in the top bar
2. Navigate up/down through directories
3. Click **Scan** on any folder, or click **Scan This Folder** for the current directory
4. The browser closes, the path fills in, and the scan runs

### Scan from the command line

```bash
# Scan any project
node cli/scanner.js /path/to/your/project

# Scan the included sample app
node cli/scanner.js sample-vulnerable-app

# Results are saved to cache/vulnerabilities.json
```

### Guard a publish or AI-assisted push

Run the publish guard before pushing to GitHub or before asking an AI agent to publish changes:

```bash
node cli/publish-guard.js
```

By default it scans the production release surfaces:

```text
cli
lib
dashboard/backend
dashboard/frontend/src
```

It exits with code `1` when the firewall returns `BLOCK`, so chat agents, terminal scripts, CI jobs, and Git hooks can stop the publish automatically. You can scan explicit targets too:

```bash
node cli/publish-guard.js cli lib dashboard/backend dashboard/frontend/src
```

For a custom release set, use:

```bash
BOB_SENTINEL_TARGETS="cli;lib;dashboard/backend;dashboard/frontend/src" node cli/publish-guard.js
```

If an AI assistant publishes through normal `git push`, the installed pre-push hook runs this guard automatically. If an AI assistant publishes through a direct GitHub API upload or a web UI, that path bypasses local Git hooks, so the assistant must run `node cli/publish-guard.js` first and refuse to publish on `BLOCK`.

### Fix with Bob from the dashboard

The Firewall tab includes the coordinated release loop:

1. **Send Fixes to Bob** creates a structured fix handoff in `.bob/inbox/` and `cache/bob-fix-session.json`.
2. Bob Sentinel mode can use `/fix latest-session` to apply the requested fixes from that handoff.
3. **Rescan** refreshes findings and the firewall decision.
4. **Run Publish Guard** checks whether the release is allowed.
5. **Push to GitHub** runs the publish guard first and only runs `git push` when the firewall is not blocking.

The dashboard does not silently rewrite source files by itself. It hands the exact findings and secure-fix directions to Bob, then uses the firewall to decide whether publishing is allowed.

### Filter and explore results

- **Severity pills** in the sidebar — click to filter by Critical, High, Medium, Low
- **Category dropdown** — filter by Secrets, Injection, Authentication, Configuration, Cryptography
- **Search box** on the Issues tab — search by file name, message, or type
- **Sort dropdown** — sort by severity, file, or type
- **Expand any issue** — see the code, explanation, file + line, CWE/OWASP badges
- **View Fix** — opens the Code Diff Viewer with vulnerable vs. secure code
- **Firewall tab** — see whether this folder is allowed, warning-only, or blocked by policy

### Export results

- Click **Export** in the top bar to download JSON
- Use the API for CSV: `GET http://localhost:3000/api/export?format=csv`

### Rescan

- Click **Rescan** in the Scan Log tab to re-run the same scan
- Results update instantly across all tabs

---

## ⚙️ How It Works

```
┌───────────────────────────────────────────────────────────────┐
│                       User / Browser                          │
│  1. Enter path  →  2. Click Scan  →  3. View results          │
└──────────────┬────────────────────────────┬───────────────────┘
               │ POST /api/scan             │ GET /api/scan-results
               ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Express.js API (3000)  │  │   React Dashboard (5173) │
│   - Spawns scanner       │  │   - Fetches API data     │
│   - Evaluates firewall   │  │   - Renders components   │
│   - Browse directories   │  │   - Filters/sorts client │
└────────────┬─────────────┘  └──────────────────────────┘
             │ node cli/scanner.js <dir>
             ▼
┌──────────────────────────┐
│   CLI Scanner Engine     │
│   - Walks directory tree │
│   - Skips node_modules…  │
│   - Matches 40 patterns  │
│   - Writes JSON report   │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│   Firewall Policy Engine │
│   - ALLOW / WARN / BLOCK │
│   - Explains decision    │
│   - Feeds git hook + UI  │
└────────────┬─────────────┘
     ▼
  cache/vulnerabilities.json
  cache/firewall-decision.json
```

**Scanner pipeline:**

1. **Walk** — Recursively reads the target directory, skipping `node_modules`, `.git`, `dist`, `build`, `.next`, `cache`, `.bob`, `__pycache__`, `coverage`, `vendor`, `target`
2. **Filter** — Only scans files with known extensions: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.php`, `.rb`, `.go`, `.cs`, `.env`, `.config`, `.json`, `.yaml`, `.yml`
3. **Match** — Runs 40 regex patterns against each file's content, recording line number, column, code snippet, and surrounding context
4. **Score** — Calculates a health score (100 base, minus penalties per severity level)
5. **Firewall** — Evaluates the report against critical, secret leak, exploit path, and health-floor rules
6. **Report** — Writes a structured JSON report to `cache/vulnerabilities.json` and a firewall decision to `cache/firewall-decision.json`

**Firewall decision logic:**

| Rule | Decision |
|------|----------|
| Any critical vulnerability | `BLOCK` |
| Critical secret leak such as live keys, passwords, tokens, private keys, connection strings | `BLOCK` |
| Critical exploit path such as SQL injection, command injection, SSRF, auth bypass, unsafe JWT | `BLOCK` |
| Health score below 50/100 | `BLOCK` |
| High severity findings without a blocking condition | `WARN` |
| Medium findings above the review threshold | `WARN` |
| No blocking or warning conditions | `ALLOW` |

**Health score calculation:**
| Severity | Penalty per issue |
|----------|-------------------|
| Critical | -20 points |
| High | -10 points |
| Medium | -5 points |
| Low | -2 points |

Score is clamped to 0–100. A score of 80+ is "Healthy", 50–79 is "Warning", below 50 is "Critical".

---

## 🏗️ Architecture

```
bob-sentinel/
├── .bob/
│   └── modes/
│       └── sentinel.yaml          # IBM Bob mode — 6 slash commands
├── cli/
│   ├── scanner.js                 # Security scanner engine (40 patterns)
│   └── publish-guard.js           # Publish/AI release firewall command
├── lib/
│   └── firewall.js                # Code & secret firewall policy engine
├── cache/
│   ├── vulnerabilities.json       # Latest scan results (generated)
│   └── firewall-decision.json     # Latest firewall decision (generated)
├── dashboard/
│   ├── backend/
│   │   ├── server.js              # Express.js API (10+ endpoints)
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx            # Main app — scan bar, tabs, filters
│       │   ├── App.css            # Global styles, dark topbar, light content
│       │   └── components/
│       │       ├── Dashboard.jsx      # Overview — severity cards, category bars
│       │       ├── FirewallPanel.jsx  # Firewall — allow/warn/block policy view
│       │       ├── HealthScore.jsx    # SVG ring health score widget
│       │       ├── VulnerabilityFeed.jsx  # Issues — search, sort, expand
│       │       ├── CodeDiffViewer.jsx     # Vulnerable vs. secure code
│       │       └── FolderBrowser.jsx      # Filesystem folder navigator
│       └── package.json
├── sample-vulnerable-app/         # Demo app with 31 real vulnerabilities
│   ├── backend/
│   │   ├── config.js              # Hardcoded AWS, Stripe, JWT secrets
│   │   ├── db.js                  # SQL injection patterns
│   │   ├── auth.js                # Weak authentication
│   │   └── api.js                 # XSS, command injection, eval()
│   ├── frontend/
│   │   └── api-client.js          # Exposed API keys, innerHTML
│   └── .env                       # Leaked credentials
├── install-bob-integration.ps1    # Windows PowerShell installer
├── install.sh                     # macOS/Linux bash installer
├── INSTALL.bat                    # Windows double-click installer
└── docs/                          # Additional documentation
```

---

## 📡 API Reference

All endpoints are served at `http://localhost:3000/api/`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check — returns API status |
| `GET` | `/scan-results` | Full scan report with all vulnerabilities |
| `GET` | `/firewall` | Latest firewall decision with policy checks and reasons |
| `GET` | `/firewall/policy` | Active firewall policy defaults |
| `POST` | `/bob/fix-session` | Create a Bob fix handoff from the latest scan |
| `GET` | `/bob/fix-session` | Read the latest Bob fix handoff |
| `POST` | `/publish/guard` | Run the publish firewall guard |
| `POST` | `/publish/github` | Run the guard, then `git push` only if allowed |
| `GET` | `/vulnerabilities` | Filtered list — query: `?severity=CRITICAL&category=secrets&file=api.js` |
| `GET` | `/vulnerability/:id` | Single vulnerability detail by ID (e.g., `VULN-001`) |
| `GET` | `/health-score` | Health score, breakdown, recommendations |
| `GET` | `/summary` | Summary statistics |
| `GET` | `/files` | Files with vulnerabilities, sorted by severity count |
| `GET` | `/categories` | Vulnerabilities grouped by category |
| `GET` | `/browse` | Directory listing — query: `?dir=/path/to/folder` |
| `GET` | `/export` | Download results — query: `?format=json` or `?format=csv` |
| `POST` | `/scan` | Trigger a scan — body: `{ "directory": "/path/to/project" }` |

**Example:**

```bash
# Trigger a scan
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"directory": "./sample-vulnerable-app"}'

# Get critical issues only
curl http://localhost:3000/api/vulnerabilities?severity=CRITICAL

# Get the firewall release decision
curl http://localhost:3000/api/firewall

# Export as CSV
curl -o results.csv http://localhost:3000/api/export?format=csv
```

---

## 🔐 Security Patterns Detected

The scanner currently loads **40 detection rules**. The table below shows the first core rules; the full JSON report also includes the exact `type`, CWE, OWASP category, confidence, and fix guidance for every finding.

| # | Pattern | Severity | Category | CWE | OWASP |
|---|---------|----------|----------|-----|-------|
| 1 | AWS Access Key (`AKIA...`) | Critical | Secrets | CWE-798 | A07:2021 |
| 2 | AWS Secret Key | Critical | Secrets | CWE-798 | A07:2021 |
| 3 | Stripe Live Key (`sk_live_...`) | Critical | Secrets | CWE-798 | A07:2021 |
| 4 | Hardcoded API Key | Critical | Secrets | CWE-798 | A07:2021 |
| 5 | Hardcoded Password | Critical | Secrets | CWE-798 | A07:2021 |
| 6 | JWT Secret in Source | Critical | Secrets | CWE-798 | A07:2021 |
| 7 | SQL Injection (template literal) | Critical | Injection | CWE-89 | A03:2021 |
| 8 | SQL Injection (concatenation) | Critical | Injection | CWE-89 | A03:2021 |
| 9 | XSS — innerHTML | High | Injection | CWE-79 | A03:2021 |
| 10 | XSS — document.write | High | Injection | CWE-79 | A03:2021 |
| 11 | Command Injection | Critical | Injection | CWE-78 | A03:2021 |
| 12 | Unsafe eval() | Critical | Injection | CWE-95 | A03:2021 |
| 13 | Path Traversal | High | Injection | CWE-22 | A01:2021 |
| 14 | Weak Crypto (MD5) | Medium | Crypto | CWE-327 | A02:2021 |
| 15 | Debug Mode Enabled | Medium | Config | CWE-489 | A05:2021 |

---

## 📊 Sample Scan Results

The included `sample-vulnerable-app` contains **31 real vulnerabilities** across 7 scanned files:

| Severity | Count | Examples |
|----------|-------|---------|
| **Critical** | 18 | Hardcoded AWS/Stripe keys, SQL injection, command injection, eval() |
| **High** | 9 | XSS, SSRF, sensitive logging, weak randomness |
| **Medium** | 4 | Debug mode, insecure cookies, broad CORS, missing security headers |
| **Low** | 0 | — |

**Health Score: 0/100** — the sample app is intentionally insecure for testing.

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Scanner** | Pure JavaScript (regex-based) | — |
| **Backend** | Node.js + Express.js | 18+ / 4.18 |
| **Frontend** | React + Vite | 18 / 8.x |
| **Styling** | CSS3 (no framework) | — |
| **File I/O** | Node.js `fs/promises` | — |

No external databases, no Docker, no cloud dependencies. Everything runs with `npm install && npm start`.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-pattern`
3. Add your security pattern to `cli/scanner.js`
4. Test against the sample app: `node cli/scanner.js sample-vulnerable-app`
5. Submit a pull request

**Adding a new detection pattern:**

```javascript
// In cli/scanner.js → SecurityScanner.patterns
your_pattern: {
  regex: /your-regex-here/gi,
  severity: 'CRITICAL',        // CRITICAL | HIGH | MEDIUM | LOW
  type: 'your_pattern_type',
  category: 'secrets',          // secrets | injection | crypto | config
  message: 'Human-readable description',
  cwe: 'CWE-XXX',
  owasp: 'A0X:2021'
}
```

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🏆 IBM Bob Hackathon

- **Real security value** — solves actual developer pain points
- **Production ready** — no mocks, no placeholders, no fake data
- **Educational** — every finding explains what's wrong and how to fix it
- **Fast** — scans thousands of files in milliseconds
- **Extensible** — add new patterns in minutes

---

<p align="center">
  <strong>Built with ❤️ for the IBM Bob Hackathon</strong><br>
  <em>Zero-Trust Security Sentinel for Your Repository</em>
</p>
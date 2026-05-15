<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite">
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
- **13 vulnerability patterns** covering OWASP Top 10 categories
- Recursive directory scanning with smart exclusions (`node_modules`, `.git`, `dist`, `.next`, `cache`, etc.)
- Per-finding CWE and OWASP mapping with confidence scores
- JSON report output, CI/CD-friendly exit codes
- Scans JS, TS, JSX, TSX, Python, Java, PHP, Ruby, Go, C#, `.env`, config, JSON, YAML

### Web Dashboard
- **Scan from the browser** — enter any directory path and click Run Scan
- **Folder browser** — navigate your filesystem visually, pick a folder, scan it
- **Health Score ring** — 0-100 score with severity breakdown
- **Overview tab** — severity cards, category bars, most affected files
- **Issues tab** — searchable, sortable, filterable list with expandable detail cards
  - Each card shows: code snippet, "What is this?" explanation, file path, line number, CWE, OWASP, confidence %
- **Scan Log tab** — full scanner console output with Rescan and Clear buttons
- **Filters** — severity pills (Critical/High/Medium/Low), category dropdown, text search
- **Code Diff Viewer** — side-by-side vulnerable vs. secure code with fix steps
- **Export** — download results as JSON or CSV

### REST API
- 10+ endpoints for programmatic access
- Filter by severity, category, file
- Health checks, export, and browse endpoints
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
4. Results appear immediately — overview, issues, and scan log

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

### Filter and explore results

- **Severity pills** in the sidebar — click to filter by Critical, High, Medium, Low
- **Category dropdown** — filter by Secrets, Injection, Authentication, Configuration, Cryptography
- **Search box** on the Issues tab — search by file name, message, or type
- **Sort dropdown** — sort by severity, file, or type
- **Expand any issue** — see the code, explanation, file + line, CWE/OWASP badges
- **View Fix** — opens the Code Diff Viewer with vulnerable vs. secure code

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
│   - Serves results       │  │   - Renders components   │
│   - Browse directories   │  │   - Filters/sorts client │
└────────────┬─────────────┘  └──────────────────────────┘
             │ node cli/scanner.js <dir>
             ▼
┌──────────────────────────┐
│   CLI Scanner Engine     │
│   - Walks directory tree │
│   - Skips node_modules…  │
│   - Matches 13 patterns  │
│   - Writes JSON report   │
└────────────┬─────────────┘
             ▼
      cache/vulnerabilities.json
```

**Scanner pipeline:**

1. **Walk** — Recursively reads the target directory, skipping `node_modules`, `.git`, `dist`, `build`, `.next`, `cache`, `.bob`, `__pycache__`, `coverage`, `vendor`, `target`
2. **Filter** — Only scans files with known extensions: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.php`, `.rb`, `.go`, `.cs`, `.env`, `.config`, `.json`, `.yaml`, `.yml`
3. **Match** — Runs 13 regex patterns against each file's content, recording line number, column, code snippet, and surrounding context
4. **Score** — Calculates a health score (100 base, minus penalties per severity level)
5. **Report** — Writes a structured JSON report to `cache/vulnerabilities.json`

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
│   └── scanner.js                 # Security scanner engine (13 patterns)
├── cache/
│   └── vulnerabilities.json       # Latest scan results (generated)
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
│       │       ├── HealthScore.jsx    # SVG ring health score widget
│       │       ├── VulnerabilityFeed.jsx  # Issues — search, sort, expand
│       │       ├── CodeDiffViewer.jsx     # Vulnerable vs. secure code
│       │       └── FolderBrowser.jsx      # Filesystem folder navigator
│       └── package.json
├── sample-vulnerable-app/         # Demo app with 26 real vulnerabilities
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

# Export as CSV
curl -o results.csv http://localhost:3000/api/export?format=csv
```

---

## 🔐 Security Patterns Detected

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

The included `sample-vulnerable-app` contains **26 real vulnerabilities** across 5 files:

| Severity | Count | Examples |
|----------|-------|---------|
| **Critical** | 23 | Hardcoded AWS/Stripe keys, SQL injection, command injection, eval() |
| **High** | 2 | innerHTML XSS |
| **Medium** | 1 | Debug mode enabled |
| **Low** | 0 | — |

**Health Score: 0/100** — the sample app is intentionally insecure for testing.

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Scanner** | Pure JavaScript (regex-based) | — |
| **Backend** | Node.js + Express.js | 18+ / 4.18 |
| **Frontend** | React + Vite | 18 / 5.x |
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
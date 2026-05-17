# Bob Sentinel - Complete Feature Documentation

## 📚 Table of Contents
1. [Security Scanner](#security-scanner)
2. [Code & Secret Firewall](#code--secret-firewall)
3. [Dashboard Components](#dashboard-components)
4. [REST API](#rest-api)
5. [Git Hook Integration](#git-hook-integration)
6. [Vulnerability Types](#vulnerability-types)

---

## 🔍 Security Scanner

### Overview
The security scanner is a real, production-ready tool that analyzes source code for security vulnerabilities using pattern matching and static analysis.

---

## 🧱 Code & Secret Firewall

### Overview
The firewall is the release gate that sits after scanning. The scanner finds issues; the firewall decides whether the code can pass, needs review, or must be blocked.

**File:** `lib/firewall.js`

### How It Works

1. The CLI scanner writes a full report to `cache/vulnerabilities.json`.
2. The firewall policy engine evaluates the report.
3. The decision is attached to the report as `firewall` and exposed through the backend API.
4. The dashboard Firewall tab shows the decision, failed checks, reasons, affected files, and next steps.
5. The dashboard can create a Bob fix handoff in `.bob/inbox/`.
6. The publish guard reruns the firewall before any GitHub push.
7. The Git pre-push hook blocks when the firewall returns `BLOCK`.

### Decision Logic

| Check | Result |
|-------|--------|
| Any critical vulnerability | `BLOCK` |
| Critical secret leak | `BLOCK` |
| Critical exploit path | `BLOCK` |
| Health score below 50/100 | `BLOCK` |
| High severity findings without a block | `WARN` |
| Medium findings above threshold | `WARN` |
| Clean scan | `ALLOW` |

### API

- `GET /api/firewall` returns the latest firewall decision.
- `GET /api/firewall/policy` returns the active policy.
- `POST /api/scan` returns scan results with `results.firewall` included.
- `POST /api/bob/fix-session` writes a Bob fix request from the latest scan.
- `POST /api/publish/guard` runs the publish firewall from the UI.
- `POST /api/publish/github` runs the guard, then pushes only when allowed.

### Dashboard To Bob Sync

The Firewall tab has four release actions:

- **Send Fixes to Bob:** writes a redacted, structured fix prompt to `.bob/inbox/`.
- **Run Publish Guard:** executes `node cli/publish-guard.js` and reports allow/warn/block.
- **Push to GitHub:** executes the publish guard first, then `git push` only if not blocked.
- **Rescan:** reruns the scanner so Bob's fixes are checked by the same firewall logic.

### Why It Matters
This turns Bob Sentinel from a passive report into a pre-flight security firewall: dangerous code and secrets are stopped before they leave the developer machine.

### How It Works

**File:** `cli/scanner.js`

```javascript
// The scanner uses regex patterns to detect vulnerabilities
const patterns = {
  aws_key: /AKIA[0-9A-Z]{16}/g,
  sql_injection: /(?:execute|query|sql)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/gi,
  // ... 40 total detection rules
};
```

### Features

#### 1. **Recursive Directory Scanning**
- Scans entire project trees
- Automatically skips excluded directories (node_modules, .git, dist, build)
- Processes multiple file types (.js, .ts, .py, .java, .php, etc.)

**Usage:**
```bash
node cli/scanner.js /path/to/project
```

#### 2. **Pattern-Based Detection**
Detects 40 vulnerability patterns, including:
- **Secrets**: AWS keys, Stripe keys, API keys, passwords, JWT secrets
- **Injection**: SQL injection, XSS, command injection, path traversal
- **Unsafe Code**: eval() usage, weak crypto (MD5)
- **Config Issues**: Debug mode enabled

#### 3. **Context Extraction**
For each vulnerability found:
- Exact line number and column
- Code snippet
- Surrounding context (3 lines before/after)
- File path

#### 4. **Health Score Calculation**
```
Base Score: 100
- Critical: -20 points each
- High: -10 points each
- Medium: -5 points each
- Low: -2 points each
Minimum: 0, Maximum: 100
```

#### 5. **JSON Output**
Results saved to `cache/vulnerabilities.json`:
```json
{
  "scan_timestamp": "2026-05-15T15:30:00Z",
  "repository": "project-name",
  "total_files_scanned": 7,
  "scan_duration_ms": 15,
  "vulnerabilities": [...],
  "summary": {
    "critical": 12,
    "high": 6,
    "medium": 2,
    "low": 0,
    "total": 20,
    "health_score": 0
  }
}
```

---

## 📊 Dashboard Components

### 1. Health Score Widget

**File:** `dashboard/frontend/src/components/HealthScore.jsx`

**Features:**
- **Circular Progress Indicator**: Visual 0-100 score
- **Color-Coded Status**:
  - 🟢 Green (80-100): Healthy
  - 🟡 Yellow (50-79): Warning
  - 🔴 Red (0-49): Critical
- **Issue Breakdown**: Count by severity
- **Status Messages**: Context-aware descriptions
- **Recommendations**: Top 3 action items

**How to Use:**
```jsx
<HealthScore data={scanData} />
```

**Visual Elements:**
- SVG circle with animated progress
- Real-time score calculation
- Responsive design

---

### 2. Dashboard Overview

**File:** `dashboard/frontend/src/components/Dashboard.jsx`

**Features:**

#### Severity Distribution
Visual cards for each severity level:
- **Critical** 🔴: Immediate action required
- **High** 🟠: Fix before deployment
- **Medium** 🟡: Should be addressed
- **Low** 🟢: Best practice improvements

Each card shows:
- Count of issues
- Percentage of total
- Progress bar
- Description

#### Category Breakdown
Groups vulnerabilities by type:
- 🔑 Secrets
- 💉 Injection
- 🔐 Authentication
- ⚙️ Configuration
- 🔒 Cryptography

#### Summary Statistics
- Total issues found
- Files with issues
- Scan duration

**How to Use:**
```jsx
<Dashboard data={scanData} />
```

---

### 3. Vulnerability Feed

**File:** `dashboard/frontend/src/components/VulnerabilityFeed.jsx`

**Features:**

#### Filtering & Sorting
- **Sort by**: Severity, File, Type
- **Search**: Real-time text search
- **Filter**: By severity or category

#### Expandable Cards
Each vulnerability card shows:
- **Header**: Severity badge, category icon, ID
- **Content**: Message, file, line number, code preview
- **Expanded**: Full context, security info (CWE, OWASP), confidence score

#### Interactive Elements
- Click card to expand/collapse
- Click "View Full Details" to open CodeDiffViewer
- Color-coded severity badges

**How to Use:**
```jsx
<VulnerabilityFeed 
  vulnerabilities={filteredVulns}
  onSelect={handleSelect}
  filter={currentFilter}
/>
```

---

### 4. Code Diff Viewer

**File:** `dashboard/frontend/src/components/CodeDiffViewer.jsx`

**Features:**

#### Side-by-Side Comparison
- **Left Panel**: Vulnerable code (❌)
- **Right Panel**: Secure code (✅)
- Copy-to-clipboard buttons

#### Detailed Information
1. **Vulnerability Details**
   - ID, Type, Category
   - File path and line number
   - Confidence score
   - CWE and OWASP references

2. **Explanation Section** 🔍
   - What's wrong with the code
   - Why it's dangerous
   - Technical details

3. **Security Impact** ⚠️
   - Real-world consequences
   - Potential damage assessment
   - Compliance violations

4. **Fix Instructions** ✅
   - Step-by-step remediation
   - Best practices
   - Code examples

5. **External Resources** 📚
   - Links to CWE documentation
   - OWASP Top 10 reference
   - Security best practices

**How to Use:**
```jsx
<CodeDiffViewer 
  vulnerability={selectedVuln}
  onBack={handleBack}
/>
```

#### Secure Code Generation
Automatically generates secure alternatives for:
- Hardcoded secrets → Environment variables
- SQL injection → Parameterized queries
- XSS → Sanitization/escaping
- Command injection → Safe APIs
- Unsafe eval() → Safe alternatives

---

## 🌐 REST API

**File:** `dashboard/backend/server.js`

### Endpoints

#### 1. Health Check
```
GET /api/health
```
Returns API status and version.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-15T15:30:00Z",
  "version": "1.0.0",
  "service": "Bob Sentinel API"
}
```

#### 2. Get Scan Results
```
GET /api/scan-results
```
Returns complete scan data including all vulnerabilities.

**Response:** Full `vulnerabilities.json` content

#### 3. Get Vulnerabilities (Filtered)
```
GET /api/vulnerabilities?severity=CRITICAL&category=secrets&file=config.js
```
Returns filtered list of vulnerabilities.

**Query Parameters:**
- `severity`: CRITICAL, HIGH, MEDIUM, LOW
- `category`: secrets, injection, auth, config, crypto
- `file`: Partial file path match

**Response:**
```json
{
  "total": 5,
  "vulnerabilities": [...],
  "filters": {
    "severity": "CRITICAL",
    "category": "secrets",
    "file": null
  }
}
```

#### 4. Get Specific Vulnerability
```
GET /api/vulnerability/:id
```
Returns detailed information about a single vulnerability.

**Response:**
```json
{
  "id": "VULN-001",
  "severity": "CRITICAL",
  "type": "hardcoded_aws_key",
  "file": "config.js",
  "line": 8,
  "code": "const AWS_KEY = \"AKIA...\"",
  "message": "AWS Access Key detected",
  "cwe": "CWE-798",
  "owasp": "A07:2021",
  "confidence": 100
}
```

#### 5. Get Health Score
```
GET /api/health-score
```
Returns repository health metrics.

**Response:**
```json
{
  "score": 42,
  "status": "critical",
  "breakdown": {
    "critical": 12,
    "high": 6,
    "medium": 2,
    "low": 0
  },
  "categories": {
    "secrets": 8,
    "injection": 10
  },
  "totalIssues": 20,
  "filesAffected": 6,
  "lastScan": "2026-05-15T15:30:00Z",
  "recommendations": [...]
}
```

#### 6. Get Summary
```
GET /api/summary
```
Returns scan summary statistics.

#### 7. Get Files
```
GET /api/files
```
Returns list of files with vulnerabilities, sorted by severity.

**Response:**
```json
{
  "total": 6,
  "files": [
    {
      "file": "backend/config.js",
      "vulnerabilities": ["VULN-001", "VULN-002"],
      "critical": 5,
      "high": 2,
      "medium": 0,
      "low": 0
    }
  ]
}
```

#### 8. Get Categories
```
GET /api/categories
```
Returns vulnerabilities grouped by category.

#### 9. Export Results
```
GET /api/export?format=json
GET /api/export?format=csv
```
Exports scan results in specified format.

**Formats:**
- `json`: Complete JSON data
- `csv`: Comma-separated values

---

## 🔗 Git Hook Integration

### Pre-Push Hook

**File:** `cli/pre-push-hook.sh`

**Features:**

#### Automatic Security Checks
Runs before every `git push`:
1. Checks for cached scan results
2. Displays health score
3. Shows issue counts
4. Blocks push if critical issues found

#### Smart Behavior
- **Critical Issues**: Blocks push, exits with code 1
- **High Issues**: Shows warning, allows push
- **No Issues**: Silent success

#### User-Friendly Output
```
╔════════════════════════════════════════════════════════╗
║         🛡️  Bob Sentinel - Pre-Push Security Check    ║
╚════════════════════════════════════════════════════════╝

✓ Using cached scan results

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repository Health Score: 0/100
Total Issues: 26
  Critical: 23
  High: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ PUSH BLOCKED: 23 critical security issues detected!
```

### Installation

**File:** `cli/install-hook.sh`

**Features:**
- Checks if in git repository
- Backs up existing hooks
- Installs pre-push hook
- Sets executable permissions
- Provides usage instructions

**Usage:**
```bash
bash bob-sentinel/cli/install-hook.sh
```

**Bypass Hook (Not Recommended):**
```bash
git push --no-verify
```

---

## 🐛 Vulnerability Types

### 1. Hardcoded Secrets

#### AWS Credentials
**Pattern:** `AKIA[0-9A-Z]{16}`
**Severity:** CRITICAL
**CWE:** CWE-798

**Example:**
```javascript
// ❌ VULNERABLE
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";

// ✅ SECURE
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
```

#### Stripe Keys
**Pattern:** `sk_live_[a-zA-Z0-9]{24,}`
**Severity:** CRITICAL

#### API Keys
**Pattern:** `api[_-]?key.*[=:].*['"][a-zA-Z0-9]{20,}['"]`
**Severity:** CRITICAL

#### Passwords
**Pattern:** `password.*[=:].*['"][^'"]{3,}['"]`
**Severity:** CRITICAL

#### JWT Secrets
**Pattern:** `jwt[_-]?secret.*[=:].*['"][^'"]{8,}['"]`
**Severity:** CRITICAL

---

### 2. Injection Vulnerabilities

#### SQL Injection
**Pattern:** Template literals or concatenation in SQL queries
**Severity:** CRITICAL
**CWE:** CWE-89

**Example:**
```javascript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SECURE
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.execute(query, [email]);
```

#### XSS (Cross-Site Scripting)
**Pattern:** `innerHTML\s*[=+]`
**Severity:** HIGH
**CWE:** CWE-79

**Example:**
```javascript
// ❌ VULNERABLE
element.innerHTML = userInput;

// ✅ SECURE
element.textContent = userInput;
// Or use DOMPurify
element.innerHTML = DOMPurify.sanitize(userInput);
```

#### Command Injection
**Pattern:** `exec.*\$\{`
**Severity:** CRITICAL
**CWE:** CWE-78

**Example:**
```javascript
// ❌ VULNERABLE
exec(`ping ${host}`);

// ✅ SECURE
const { spawn } = require('child_process');
spawn('ping', ['-c', '4', host]);
```

#### Path Traversal
**Pattern:** `readFile.*\.\.[/\\]`
**Severity:** HIGH
**CWE:** CWE-22

---

### 3. Unsafe Code Patterns

#### Unsafe eval()
**Pattern:** `\beval\s*\(`
**Severity:** CRITICAL
**CWE:** CWE-95

**Example:**
```javascript
// ❌ VULNERABLE
eval(userInput);

// ✅ SECURE
// Use JSON.parse for JSON
const data = JSON.parse(jsonString);
// Use mathjs for expressions
const result = math.evaluate(expression);
```

---

### 4. Configuration Issues

#### Debug Mode Enabled
**Pattern:** `DEBUG\s*[=:]\s*true`
**Severity:** MEDIUM
**CWE:** CWE-489

**Example:**
```javascript
// ❌ VULNERABLE
const DEBUG = true;

// ✅ SECURE
const DEBUG = process.env.NODE_ENV !== 'production';
```

#### Weak Cryptography
**Pattern:** `\bmd5\s*\(`
**Severity:** MEDIUM
**CWE:** CWE-327

---

## 🎯 Best Practices

### For Developers

1. **Run scans regularly**
   ```bash
   node bob-sentinel/cli/scanner.js .
   ```

2. **Review dashboard before commits**
   - Check health score
   - Address critical issues first
   - Review all findings

3. **Use environment variables**
   - Never hardcode secrets
   - Use `.env` files (add to `.gitignore`)
   - Rotate exposed credentials immediately

4. **Follow secure coding practices**
   - Use parameterized queries
   - Sanitize all user inputs
   - Implement proper error handling
   - Enable security headers

### For Teams

1. **Install git hooks**
   ```bash
   bash bob-sentinel/cli/install-hook.sh
   ```

2. **Set up CI/CD integration**
   - Run scanner in pipeline
   - Block merges with critical issues
   - Generate reports

3. **Regular security reviews**
   - Weekly dashboard reviews
   - Track health score trends
   - Update security patterns

---

## 📈 Metrics & Reporting

### Health Score Trends
Track repository security over time:
- Monitor score improvements
- Identify recurring issues
- Measure remediation effectiveness

### Issue Distribution
Analyze vulnerability patterns:
- Most common vulnerability types
- Files with most issues
- Category breakdown

### Team Performance
Measure security awareness:
- Issues caught before push
- Average remediation time
- Repeat vulnerabilities

---

**Built for IBM Bob Hackathon**
*Production-ready security scanning for modern development*
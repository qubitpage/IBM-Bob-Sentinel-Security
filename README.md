# 🛡️ Bob Sentinel - Pre-Flight Code & Secret Firewall

> **Zero-Trust Security Sentinel for Your Repository**

Bob Sentinel is a production-ready security scanner that detects vulnerabilities, hardcoded secrets, and security issues before code reaches production. Built for the IBM Bob Hackathon.

## 🎯 Features

### 1. **Real-Time Security Scanning**
- **Pattern-based detection** using regex patterns for common vulnerabilities
- **26+ vulnerability types** detected including:
  - Hardcoded AWS, Stripe, and API keys
  - SQL injection vulnerabilities
  - XSS (Cross-Site Scripting)
  - Command injection
  - Path traversal
  - Unsafe eval() usage
  - Weak cryptography
  - Debug mode in production

### 2. **Interactive Dashboard**
- **Health Score Widget**: Visual 0-100 score with color-coded status
- **Severity Breakdown**: Critical, High, Medium, Low categorization
- **Category Analysis**: Group issues by type (secrets, injection, auth, config)
- **File-by-File View**: See which files have the most issues
- **Real-time Filtering**: Filter by severity, category, or search term

### 3. **Code Diff Viewer**
- **Side-by-side comparison**: Vulnerable vs. Secure code
- **Detailed explanations**: Why it's vulnerable and how to fix it
- **Security impact assessment**: Understand the real-world consequences
- **Step-by-step fixes**: Clear instructions for remediation
- **Copy-to-clipboard**: Easy code copying
- **External resources**: Links to CWE, OWASP documentation

### 4. **CLI Scanner**
- **Fast scanning**: Analyzes files in milliseconds
- **Recursive directory scanning**: Scans entire project trees
- **Smart exclusions**: Skips node_modules, .git, dist, etc.
- **JSON output**: Machine-readable results
- **Exit codes**: Integrates with CI/CD pipelines

### 5. **REST API**
- **Complete API**: 10+ endpoints for accessing scan data
- **Export functionality**: JSON and CSV formats
- **Health checks**: Monitor API status
- **CORS enabled**: Frontend integration ready

##  Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

```bash
# 1. Clone or navigate to bob-sentinel directory
cd bob-sentinel

# 2. Install backend dependencies
cd dashboard/backend
npm install

# 3. Install frontend dependencies (in separate terminal)
cd dashboard/frontend
npm install

# 4. Run a security scan
cd ../../
node cli/scanner.js sample-vulnerable-app

# 5. Start the backend API
cd dashboard/backend
npm start

# 6. Start the frontend (in separate terminal)
cd dashboard/frontend
npm run dev

# 7. Open browser
# Navigate to http://localhost:5173
```

## 🔍 How to Use

### Scanning Your Code

```bash
# Scan a directory
node cli/scanner.js /path/to/your/project

# Scan the sample vulnerable app
node cli/scanner.js sample-vulnerable-app

# Results are saved to cache/vulnerabilities.json
```

### Understanding the Dashboard

#### 1. **Health Score (Sidebar)**
- **Green (80-100)**: Repository is healthy
- **Yellow (50-79)**: Needs attention
- **Red (0-49)**: Critical issues present

**Calculation:**
- Base score: 100
- Critical: -20 points each
- High: -10 points each  
- Medium: -5 points each
- Low: -2 points each

#### 2. **Dashboard Overview**
- **Severity Distribution**: Visual breakdown of issue types
- **Category Breakdown**: Issues grouped by category
- **Summary Stats**: Quick metrics at a glance

#### 3. **Vulnerability Feed**
- **Sortable**: By severity, file, or type
- **Searchable**: Find specific issues quickly
- **Expandable cards**: Click to see more details
- **Filterable**: Use sidebar filters

#### 4. **Code Diff Viewer**
Click any vulnerability to see:
- **Vulnerable code**: What's wrong
- **Secure code**: How to fix it
- **Explanation**: Why it's dangerous
- **Impact**: Real-world consequences
- **Fix steps**: How to remediate
- **Resources**: Learn more

### API Endpoints

```bash
# Health check
GET http://localhost:3000/api/health

# Get all scan results
GET http://localhost:3000/api/scan-results

# Get vulnerabilities (with filters)
GET http://localhost:3000/api/vulnerabilities?severity=CRITICAL&category=secrets

# Get specific vulnerability
GET http://localhost:3000/api/vulnerability/VULN-001

# Get health score
GET http://localhost:3000/api/health-score

# Get summary
GET http://localhost:3000/api/summary

# Get files with issues
GET http://localhost:3000/api/files

# Get categories
GET http://localhost:3000/api/categories

# Export results
GET http://localhost:3000/api/export?format=json
GET http://localhost:3000/api/export?format=csv
```

## 🏗️ Architecture

```
bob-sentinel/
├── .bob/modes/              # Bob custom mode configuration
│   └── sentinel.yaml        # Security scanning rules
├── sample-vulnerable-app/   # Demo app with intentional vulnerabilities
│   ├── backend/            # Backend vulnerabilities
│   │   ├── config.js       # Hardcoded secrets
│   │   ├── db.js           # SQL injection
│   │   ├── auth.js         # Weak authentication
│   │   └── api.js          # XSS, command injection
│   ├── frontend/           # Frontend vulnerabilities
│   │   └── api-client.js   # Exposed API keys
│   └── .env                # Leaked credentials
├── cache/                   # Scan results storage
│   └── vulnerabilities.json # Latest scan results
├── cli/                     # Command-line tools
│   └── scanner.js          # Real security scanner
├── dashboard/
│   ├── backend/            # Express.js API
│   │   ├── server.js       # REST API server
│   │   └── package.json
│   └── frontend/           # React dashboard
│       ├── src/
│       │   ├── App.jsx                    # Main app
│       │   ├── components/
│       │   │   ├── Dashboard.jsx          # Overview
│       │   │   ├── HealthScore.jsx        # Health widget
│       │   │   ├── VulnerabilityFeed.jsx  # Issue list
│       │   │   └── CodeDiffViewer.jsx     # Diff viewer
│       │   └── App.css
│       └── package.json
└── docs/                    # Documentation
```

## 🔐 Security Patterns Detected

### Secrets Detection
- ✅ AWS Access Keys (AKIA...)
- ✅ AWS Secret Keys
- ✅ Stripe API Keys (sk_live_...)
- ✅ Generic API Keys
- ✅ Passwords in code
- ✅ JWT Secrets
- ✅ OAuth Credentials
- ✅ Database Credentials

### Injection Vulnerabilities
- ✅ SQL Injection (template literals, concatenation)
- ✅ XSS (innerHTML, document.write)
- ✅ Command Injection (exec, spawn with user input)
- ✅ Path Traversal (../ in file paths)
- ✅ Unsafe eval()

### Configuration Issues
- ✅ Debug mode enabled
- ✅ Weak cryptography (MD5)
- ✅ Missing security headers
- ✅ Insecure CORS

## 📊 Sample Scan Results

The included `sample-vulnerable-app` contains **26 real vulnerabilities**:
- **23 Critical** issues (hardcoded secrets, SQL injection, command injection)
- **2 High** issues (XSS, path traversal)
- **1 Medium** issue (debug mode enabled)

**Health Score: 0/100** ⚠️

## 🎓 Educational Value

Each vulnerability includes:
1. **Clear explanation** of what's wrong
2. **Security impact** assessment
3. **Before/after code** comparison
4. **Step-by-step fix** instructions
5. **Links to resources** (CWE, OWASP)

## 🚀 Production Ready

- ✅ **No mocks**: Real scanner with actual pattern matching
- ✅ **Real vulnerabilities**: Sample app has genuine security issues
- ✅ **Complete API**: Full REST API with 10+ endpoints
- ✅ **Interactive UI**: Production-ready React dashboard
- ✅ **Comprehensive docs**: Every feature explained
- ✅ **Error handling**: Robust error management
- ✅ **Responsive design**: Works on all screen sizes

## 🛠️ Technology Stack

**Backend:**
- Node.js 18+
- Express.js 4.18
- Native fs/promises for file operations

**Frontend:**
- React 18
- Vite (build tool)
- CSS3 (no framework dependencies)

**Scanner:**
- Pure JavaScript
- Regex-based pattern matching
- Recursive file system traversal

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This project was built for the IBM Bob Hackathon. Contributions welcome!

## 🏆 Hackathon Highlights

- **Real Security Value**: Solves actual developer pain points
- **Production Ready**: No mocks, no placeholders
- **Educational**: Teaches secure coding practices
- **Scalable**: Can be extended with more patterns
- **Well Documented**: Every feature explained

## 📞 Support

For issues or questions:
1. Check the documentation above
2. Review the code comments (extensively documented)
3. Run the sample scan to see it in action

---

**Built with ❤️ for IBM Bob Hackathon**

*Zero-Trust Security Sentinel for Your Repository*
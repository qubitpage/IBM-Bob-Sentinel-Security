#!/usr/bin/env node

/**
 * Bob Sentinel CLI Scanner
 * Real security vulnerability scanner that analyzes code for security issues
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.filesScanned = 0;
    this.startTime = Date.now();
    
    // Security patterns to detect
    this.patterns = {
      // Hardcoded secrets
      aws_key: {
        regex: /AKIA[0-9A-Z]{16}/g,
        severity: 'CRITICAL',
        type: 'hardcoded_aws_key',
        category: 'secrets',
        message: 'AWS Access Key ID detected in source code',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      aws_secret: {
        regex: /(?:aws[_-]?secret|AWS_SECRET)[_-]?(?:ACCESS[_-]?)?KEY['"]?\s*[=:]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi,
        severity: 'CRITICAL',
        type: 'hardcoded_aws_secret',
        category: 'secrets',
        message: 'AWS Secret Access Key detected',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      stripe_key: {
        regex: /sk_live_[a-zA-Z0-9]{24,}/g,
        severity: 'CRITICAL',
        type: 'hardcoded_stripe_key',
        category: 'secrets',
        message: 'Stripe live secret key detected',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      api_key: {
        regex: /(?:api[_-]?key|apikey|api[_-]?secret)['"]?\s*[=:]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
        severity: 'CRITICAL',
        type: 'hardcoded_api_key',
        category: 'secrets',
        message: 'API key hardcoded in source code',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      password: {
        regex: /(?:password|passwd|pwd)['"]?\s*[=:]\s*['"]([^'"]{3,})['"]/gi,
        severity: 'CRITICAL',
        type: 'hardcoded_password',
        category: 'secrets',
        message: 'Password hardcoded in source code',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      jwt_secret: {
        regex: /(?:jwt[_-]?secret|token[_-]?secret)['"]?\s*[=:]\s*['"]([^'"]{8,})['"]/gi,
        severity: 'CRITICAL',
        type: 'hardcoded_jwt_secret',
        category: 'secrets',
        message: 'JWT secret hardcoded in source code',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      
      // SQL Injection
      sql_template_literal: {
        regex: /(?:execute|query|sql)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/gi,
        severity: 'CRITICAL',
        type: 'sql_injection',
        category: 'injection',
        message: 'SQL injection - template literal with user input',
        cwe: 'CWE-89',
        owasp: 'A03:2021'
      },
      sql_concatenation: {
        regex: /(?:SELECT|INSERT|UPDATE|DELETE)[^;]*\+[^;]*\+/gi,
        severity: 'CRITICAL',
        type: 'sql_injection',
        category: 'injection',
        message: 'SQL injection - string concatenation in query',
        cwe: 'CWE-89',
        owasp: 'A03:2021'
      },
      
      // XSS
      innerHTML: {
        regex: /innerHTML\s*[=+]/gi,
        severity: 'HIGH',
        type: 'xss_vulnerability',
        category: 'injection',
        message: 'Potential XSS - innerHTML usage',
        cwe: 'CWE-79',
        owasp: 'A03:2021'
      },
      document_write: {
        regex: /document\.write\s*\(/gi,
        severity: 'HIGH',
        type: 'xss_vulnerability',
        category: 'injection',
        message: 'Potential XSS - document.write usage',
        cwe: 'CWE-79',
        owasp: 'A03:2021'
      },
      
      // Command Injection
      exec_with_input: {
        regex: /(?:exec|spawn|system)\s*\([^)]*\$\{[^}]*\}[^)]*\)/gi,
        severity: 'CRITICAL',
        type: 'command_injection',
        category: 'injection',
        message: 'Command injection - user input in shell command',
        cwe: 'CWE-78',
        owasp: 'A03:2021'
      },
      
      // Unsafe eval
      eval_usage: {
        regex: /\beval\s*\(/gi,
        severity: 'CRITICAL',
        type: 'unsafe_eval',
        category: 'injection',
        message: 'Unsafe eval() usage',
        cwe: 'CWE-95',
        owasp: 'A03:2021'
      },
      
      // Path Traversal
      path_traversal: {
        regex: /(?:readFile|writeFile|open)\s*\([^)]*\.\.[/\\]/gi,
        severity: 'HIGH',
        type: 'path_traversal',
        category: 'injection',
        message: 'Path traversal vulnerability',
        cwe: 'CWE-22',
        owasp: 'A01:2021'
      },
      
      // Weak crypto
      md5_usage: {
        regex: /\bmd5\s*\(/gi,
        severity: 'MEDIUM',
        type: 'weak_crypto',
        category: 'crypto',
        message: 'Weak cryptographic algorithm - MD5',
        cwe: 'CWE-327',
        owasp: 'A02:2021'
      },
      
      // Debug mode
      debug_enabled: {
        regex: /DEBUG\s*[=:]\s*true/gi,
        severity: 'MEDIUM',
        type: 'debug_enabled',
        category: 'config',
        message: 'Debug mode enabled',
        cwe: 'CWE-489',
        owasp: 'A05:2021'
      }
    };
  }

  /**
   * Scan a directory recursively
   */
  async scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip excluded directories
        if (entry.isDirectory()) {
          if (this.shouldSkipDirectory(entry.name)) {
            continue;
          }
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          if (this.shouldScanFile(entry.name)) {
            await this.scanFile(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(name) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'target', 'vendor', '.next', 'coverage', 'cache', '.bob', '__pycache__'];
    return skipDirs.includes(name);
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(filename) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php', '.rb', '.go', '.cs', '.env', '.config', '.json', '.yaml', '.yml'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Generate a concrete fix for a vulnerability
   */
  generateFix(type, code, filePath) {
    const fixes = {
      hardcoded_aws_key: {
        code: 'const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;',
        explanation: 'Hardcoded AWS credentials can be extracted by anyone with repository access. Move them to environment variables and never commit them to source control.',
        steps: [
          'Remove the hardcoded key from source code immediately',
          'Add the key to a .env file (ensure .env is in .gitignore)',
          'Reference it via process.env.AWS_ACCESS_KEY_ID',
          'Rotate the exposed key in the AWS IAM console'
        ]
      },
      hardcoded_aws_secret: {
        code: 'const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;',
        explanation: 'AWS secret keys grant full programmatic access to your cloud resources. A leaked key can result in data theft, crypto-mining charges, or full account takeover.',
        steps: [
          'Remove the secret from source code',
          'Store in .env or a secrets manager (AWS Secrets Manager, Vault)',
          'Load via process.env.AWS_SECRET_ACCESS_KEY',
          'Rotate the compromised key immediately in AWS IAM'
        ]
      },
      hardcoded_stripe_key: {
        code: 'const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;',
        explanation: 'A Stripe live secret key allows anyone to process charges, issue refunds, and access customer payment data. This is a PCI-DSS compliance violation.',
        steps: [
          'Remove sk_live_* from source code',
          'Add STRIPE_SECRET_KEY to .env (ensure .env is gitignored)',
          'Reference via process.env.STRIPE_SECRET_KEY',
          'Roll the key in Stripe Dashboard → Developers → API Keys'
        ]
      },
      hardcoded_api_key: {
        code: 'const API_KEY = process.env.API_KEY;',
        explanation: 'API keys embedded in source are visible to anyone who can read the repository. Attackers use leaked keys for unauthorized access, data exfiltration, and service abuse.',
        steps: [
          'Extract the key value to a .env file',
          'Replace the hardcoded string with process.env.API_KEY',
          'Add .env to .gitignore if not already present',
          'Regenerate the key if the repo has been public'
        ]
      },
      hardcoded_password: {
        code: 'const DB_PASSWORD = process.env.DB_PASSWORD;',
        explanation: 'Passwords in source code are the #1 cause of credential leaks. Even in private repos, they persist in git history forever unless force-purged.',
        steps: [
          'Move the password to an environment variable or secrets manager',
          'Replace with process.env.DB_PASSWORD (or equivalent)',
          'Change the compromised password on the target system',
          'Audit git history: git log -p -S "password_value"'
        ]
      },
      hardcoded_jwt_secret: {
        code: 'const JWT_SECRET = process.env.JWT_SECRET;\n// Use a strong random secret: require("crypto").randomBytes(64).toString("hex")',
        explanation: 'A leaked JWT signing secret allows attackers to forge valid authentication tokens and impersonate any user, including admins.',
        steps: [
          'Move the JWT secret to an environment variable',
          'Generate a new secret with: require("crypto").randomBytes(64).toString("hex")',
          'Invalidate all existing tokens (force re-login)',
          'Store in .env or a secrets manager'
        ]
      },
      sql_injection: {
        code: (code.includes('`') || code.includes('${'))
          ? '// Use parameterized queries:\nconst result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);'
          : '// Use parameterized queries instead of string concatenation:\nconst result = await db.query("SELECT * FROM users WHERE id = ?", [userId]);',
        explanation: 'SQL injection lets attackers execute arbitrary database commands — reading all data, modifying records, or deleting entire tables. It is the #1 web application vulnerability (OWASP A03).',
        steps: [
          'Replace string concatenation/template literals with parameterized queries',
          'Use placeholders ($1, ?, :name) and pass values as a separate array',
          'Use an ORM (Sequelize, Prisma, Knex) that auto-parameterizes',
          'Validate and sanitize all user input at the API boundary'
        ]
      },
      xss_vulnerability: {
        code: code.includes('innerHTML')
          ? '// Use textContent instead of innerHTML:\nelement.textContent = userInput;\n// Or sanitize with DOMPurify:\nelement.innerHTML = DOMPurify.sanitize(userInput);'
          : '// Avoid document.write. Use DOM APIs:\nconst el = document.createElement("div");\nel.textContent = userInput;\ndocument.body.appendChild(el);',
        explanation: 'Cross-Site Scripting allows attackers to inject malicious JavaScript that runs in other users\' browsers, stealing session tokens, credentials, or performing actions on their behalf.',
        steps: [
          'Replace innerHTML/document.write with textContent or DOM APIs',
          'If HTML rendering is required, sanitize with DOMPurify',
          'Set Content-Security-Policy headers to restrict inline scripts',
          'Encode all user-supplied data before rendering'
        ]
      },
      command_injection: {
        code: '// Use execFile with explicit arguments (no shell interpolation):\nconst { execFile } = require("child_process");\nexecFile("command", [arg1, arg2], (err, stdout) => { });',
        explanation: 'Command injection lets attackers execute arbitrary system commands on your server. A single vulnerable endpoint can lead to full server compromise, data theft, or ransomware.',
        steps: [
          'Replace exec() with execFile() — it does NOT invoke a shell',
          'Pass arguments as an array, never as a concatenated string',
          'Validate and whitelist all user-supplied inputs',
          'Run the process with minimal privileges (least-privilege principle)'
        ]
      },
      unsafe_eval: {
        code: '// Replace eval() with safe alternatives:\n// JSON parsing: JSON.parse(data)\n// Dynamic property access: obj[propertyName]\n// Computed function calls: const fn = handlers[name]; fn();',
        explanation: 'eval() executes arbitrary code strings at runtime. Attackers who control the input can run any JavaScript — reading files, making network requests, or taking over the process.',
        steps: [
          'Identify why eval() is being used (JSON parsing, dynamic dispatch, etc.)',
          'Replace with the specific safe alternative (JSON.parse, Map lookup, etc.)',
          'If eval is truly needed, use vm2 or a sandboxed environment',
          'Add "no-eval" to your ESLint config to prevent future use'
        ]
      },
      path_traversal: {
        code: 'const safePath = path.join(BASE_DIR, path.basename(userInput));\n// Or validate the resolved path stays within bounds:\nconst resolved = path.resolve(BASE_DIR, userInput);\nif (!resolved.startsWith(BASE_DIR)) throw new Error("Access denied");',
        explanation: 'Path traversal (../../) allows attackers to read or write files outside the intended directory — accessing /etc/passwd, configuration files, or overwriting system files.',
        steps: [
          'Use path.basename() to strip directory components from user input',
          'Resolve the full path and verify it starts with the allowed base directory',
          'Never pass raw user input to fs.readFile/writeFile',
          'Use a chroot or container to limit filesystem access'
        ]
      },
      weak_crypto: {
        code: '// Replace MD5 with a secure algorithm:\nconst crypto = require("crypto");\nconst hash = crypto.createHash("sha256").update(data).digest("hex");\n// For passwords, use bcrypt or argon2 instead of hashing',
        explanation: 'MD5 is cryptographically broken — collisions can be generated in seconds. It must never be used for password hashing, integrity checks, or any security-sensitive operation.',
        steps: [
          'Replace MD5 with SHA-256 (for checksums) or bcrypt/argon2 (for passwords)',
          'If MD5 is used for non-security purposes (cache keys), document the reason',
          'Rehash any stored MD5 password hashes with bcrypt on next login',
          'Update any systems that verify MD5 hashes'
        ]
      },
      debug_enabled: {
        code: 'const DEBUG = process.env.NODE_ENV !== "production";\n// Or use a proper logging library:\nconst logger = require("pino")({ level: process.env.LOG_LEVEL || "info" });',
        explanation: 'Debug mode in production exposes stack traces, internal state, database queries, and environment variables to end users. Attackers use this information for targeted exploitation.',
        steps: [
          'Set DEBUG=false in production environment variables',
          'Use NODE_ENV=production to auto-disable debug features',
          'Replace console.log with a structured logger (pino, winston)',
          'Ensure error responses never include stack traces in production'
        ]
      }
    };

    return fixes[type] || {
      code: '// Review and apply the appropriate security fix for this pattern',
      explanation: 'This code pattern has been flagged as a potential security concern. Review the specific context and apply the recommended remediation.',
      steps: ['Review the flagged code in context', 'Apply the security best practice for this vulnerability type', 'Test that the fix does not break functionality', 'Add automated tests to prevent regression']
    };
  }

  /**
   * Scan a single file
   */
  async scanFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      this.filesScanned++;

      // Check each pattern
      for (const [patternName, pattern] of Object.entries(this.patterns)) {
        let match;
        pattern.regex.lastIndex = 0; // Reset regex
        
        while ((match = pattern.regex.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const lineContent = lines[lineNumber - 1].trim();
          
          // Get context lines
          const contextStart = Math.max(0, lineNumber - 2);
          const contextEnd = Math.min(lines.length, lineNumber + 1);
          const context = lines.slice(contextStart, contextEnd).join('\n');

          // Generate concrete fix
          const fix = this.generateFix(pattern.type, lineContent, filePath);
          
          this.vulnerabilities.push({
            id: `VULN-${String(this.vulnerabilities.length + 1).padStart(3, '0')}`,
            severity: pattern.severity,
            type: pattern.type,
            category: pattern.category,
            file: filePath,
            line: lineNumber,
            column: this.getColumnNumber(lines[lineNumber - 1], match[0]),
            code: lineContent,
            context: context,
            message: pattern.message,
            cwe: pattern.cwe,
            owasp: pattern.owasp,
            confidence: 85,
            fix: fix
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
    }
  }

  /**
   * Get line number from character index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Get column number in line
   */
  getColumnNumber(line, searchText) {
    const index = line.indexOf(searchText);
    return index >= 0 ? index + 1 : 1;
  }

  /**
   * Calculate health score
   */
  calculateHealthScore() {
    const penalties = {
      CRITICAL: 20,
      HIGH: 10,
      MEDIUM: 5,
      LOW: 2
    };

    let score = 100;
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    this.vulnerabilities.forEach(vuln => {
      const severity = vuln.severity.toLowerCase();
      summary[severity]++;
      score -= penalties[vuln.severity];
    });

    return {
      score: Math.max(0, Math.min(100, score)),
      summary
    };
  }

  /**
   * Generate scan report
   */
  generateReport(targetPath) {
    const healthData = this.calculateHealthScore();
    const duration = Date.now() - this.startTime;

    // Group by category
    const categories = {};
    this.vulnerabilities.forEach(vuln => {
      if (!categories[vuln.category]) {
        categories[vuln.category] = 0;
      }
      categories[vuln.category]++;
    });

    // Count files with issues
    const filesWithIssues = new Set(this.vulnerabilities.map(v => v.file)).size;

    return {
      scan_timestamp: new Date().toISOString(),
      repository: path.basename(targetPath),
      total_files_scanned: this.filesScanned,
      scan_duration_ms: duration,
      vulnerabilities: this.vulnerabilities,
      summary: {
        ...healthData.summary,
        total: this.vulnerabilities.length,
        health_score: healthData.score,
        files_with_issues: filesWithIssues,
        categories
      }
    };
  }
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scanner.js <directory>');
    console.log('Example: node scanner.js ../sample-vulnerable-app');
    process.exit(1);
  }

  const targetPath = path.resolve(args[0]);
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         🛡️  Bob Sentinel Security Scanner            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Scanning: ${targetPath}`);
  console.log();

  const scanner = new SecurityScanner();
  await scanner.scanDirectory(targetPath);
  
  const report = scanner.generateReport(targetPath);
  
  // Save report
  const outputPath = path.join(__dirname, '../cache/vulnerabilities.json');
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('Scan Complete!');
  console.log('─'.repeat(60));
  console.log(`Files Scanned:     ${report.total_files_scanned}`);
  console.log(`Vulnerabilities:   ${report.summary.total}`);
  console.log(`  Critical:        ${report.summary.critical}`);
  console.log(`  High:            ${report.summary.high}`);
  console.log(`  Medium:          ${report.summary.medium}`);
  console.log(`  Low:             ${report.summary.low}`);
  console.log(`Health Score:      ${report.summary.health_score}/100`);
  console.log(`Duration:          ${report.scan_duration_ms}ms`);
  console.log('─'.repeat(60));
  console.log(`Report saved to: ${outputPath}`);
  console.log();
  
  if (report.summary.critical > 0) {
    console.log('⚠️  CRITICAL issues found! Review immediately.');
    process.exit(1);
  } else if (report.summary.high > 0) {
    console.log('⚠️  HIGH severity issues found.');
    process.exit(1);
  } else {
    console.log('✓ No critical issues found.');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Scanner error:', error);
    process.exit(1);
  });
}

module.exports = SecurityScanner;

// Made with Bob

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
    this.scannedFiles = [];
    this.skippedDirs = [];
    this.directoriesEntered = 0;
    this.verbose = true;
    
    // Security patterns to detect
    this.patterns = {
      // ── HARDCODED SECRETS ────────────────────────────────
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
      api_key_generic: {
        regex: /(?:api[_-]?key|apikey|api[_-]?secret)['"]?\s*[=:]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
        severity: 'CRITICAL',
        type: 'hardcoded_api_key',
        category: 'secrets',
        message: 'API key hardcoded in source code',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      password_hardcoded: {
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
      private_key: {
        regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
        severity: 'CRITICAL',
        type: 'hardcoded_private_key',
        category: 'secrets',
        message: 'Private key embedded in source code',
        cwe: 'CWE-321',
        owasp: 'A07:2021'
      },
      github_token: {
        regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
        severity: 'CRITICAL',
        type: 'hardcoded_github_token',
        category: 'secrets',
        message: 'GitHub personal access token detected',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      generic_secret: {
        regex: /(?:secret|token|auth)['"]?\s*[=:]\s*['"]([A-Za-z0-9_\-/+=]{20,})['"]/gi,
        severity: 'HIGH',
        type: 'hardcoded_secret',
        category: 'secrets',
        message: 'Potential secret/token hardcoded in source',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },
      connection_string: {
        regex: /(?:mongodb|postgres|mysql|redis|amqp):\/\/[^'">\s]{10,}/gi,
        severity: 'CRITICAL',
        type: 'hardcoded_connection_string',
        category: 'secrets',
        message: 'Database connection string with credentials in source',
        cwe: 'CWE-798',
        owasp: 'A07:2021'
      },

      // ── SQL INJECTION ────────────────────────────────────
      sql_template_literal: {
        regex: /(?:execute|query|sql|raw)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/gi,
        severity: 'CRITICAL',
        type: 'sql_injection',
        category: 'injection',
        message: 'SQL injection - template literal with user input',
        cwe: 'CWE-89',
        owasp: 'A03:2021'
      },
      sql_concatenation: {
        regex: /(?:SELECT|INSERT|UPDATE|DELETE)\s[^;]*['"]\s*\+\s*[a-zA-Z]/gi,
        severity: 'CRITICAL',
        type: 'sql_injection',
        category: 'injection',
        message: 'SQL injection - string concatenation in query',
        cwe: 'CWE-89',
        owasp: 'A03:2021'
      },
      sql_format_string: {
        regex: /(?:execute|cursor\.execute|query)\s*\(\s*[f"'].*%[sd]/gi,
        severity: 'CRITICAL',
        type: 'sql_injection',
        category: 'injection',
        message: 'SQL injection - format string in query',
        cwe: 'CWE-89',
        owasp: 'A03:2021'
      },

      // ── XSS ──────────────────────────────────────────────
      innerHTML: {
        regex: /\.innerHTML\s*[=+]/gi,
        severity: 'HIGH',
        type: 'xss_vulnerability',
        category: 'injection',
        message: 'Potential XSS - innerHTML usage with dynamic content',
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
      dangerouslySetInnerHTML: {
        regex: /dangerouslySetInnerHTML\s*=\s*\{/gi,
        severity: 'HIGH',
        type: 'xss_vulnerability',
        category: 'injection',
        message: 'React dangerouslySetInnerHTML - potential XSS vector',
        cwe: 'CWE-79',
        owasp: 'A03:2021'
      },

      // ── COMMAND INJECTION ────────────────────────────────
      exec_template: {
        regex: /(?:exec|execSync|spawn|spawnSync|system)\s*\([^)]*\$\{[^}]*\}[^)]*\)/gi,
        severity: 'CRITICAL',
        type: 'command_injection',
        category: 'injection',
        message: 'Command injection - user input in shell command',
        cwe: 'CWE-78',
        owasp: 'A03:2021'
      },
      exec_concat: {
        regex: /(?:exec|execSync|system)\s*\(\s*['"][^'"]*['"]\s*\+\s*[a-zA-Z]/gi,
        severity: 'CRITICAL',
        type: 'command_injection',
        category: 'injection',
        message: 'Command injection - concatenated shell command',
        cwe: 'CWE-78',
        owasp: 'A03:2021'
      },
      os_system: {
        regex: /os\.system\s*\(|subprocess\.call\s*\(\s*[^[\]]*\+|subprocess\.Popen\s*\(\s*[^[\]]*\+/gi,
        severity: 'CRITICAL',
        type: 'command_injection',
        category: 'injection',
        message: 'Command injection - os.system/subprocess with concatenation',
        cwe: 'CWE-78',
        owasp: 'A03:2021'
      },

      // ── UNSAFE EVAL / DESERIALIZATION ────────────────────
      eval_usage: {
        regex: /[^a-zA-Z_]eval\s*\(/gi,
        severity: 'CRITICAL',
        type: 'unsafe_eval',
        category: 'injection',
        message: 'Unsafe eval() - arbitrary code execution risk',
        cwe: 'CWE-95',
        owasp: 'A03:2021'
      },
      new_function: {
        regex: /new\s+Function\s*\(/gi,
        severity: 'HIGH',
        type: 'unsafe_eval',
        category: 'injection',
        message: 'new Function() - equivalent to eval(), code injection risk',
        cwe: 'CWE-95',
        owasp: 'A03:2021'
      },
      unsafe_deserialize: {
        regex: /(?:pickle\.loads|yaml\.load\s*\([^)]*(?!Loader)|unserialize|ObjectInputStream|readObject\s*\()/gi,
        severity: 'CRITICAL',
        type: 'insecure_deserialization',
        category: 'injection',
        message: 'Insecure deserialization - remote code execution risk',
        cwe: 'CWE-502',
        owasp: 'A08:2021'
      },

      // ── PATH TRAVERSAL ──────────────────────────────────
      path_traversal: {
        regex: /(?:readFile|writeFile|createReadStream|open)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        severity: 'HIGH',
        type: 'path_traversal',
        category: 'injection',
        message: 'Potential path traversal - user input in file operation',
        cwe: 'CWE-22',
        owasp: 'A01:2021'
      },
      path_dotdot: {
        regex: /(?:readFile|writeFile|open)\s*\([^)]*\.\.[/\\]/gi,
        severity: 'HIGH',
        type: 'path_traversal',
        category: 'injection',
        message: 'Path traversal - directory traversal pattern detected',
        cwe: 'CWE-22',
        owasp: 'A01:2021'
      },

      // ── SSRF ─────────────────────────────────────────────
      ssrf_fetch: {
        regex: /(?:fetch|axios|request|got|http\.get|urllib)\s*\([^)]*(?:req\.|params\.|query\.|body\.|user)/gi,
        severity: 'HIGH',
        type: 'ssrf',
        category: 'injection',
        message: 'Potential SSRF - user-controlled URL in HTTP request',
        cwe: 'CWE-918',
        owasp: 'A10:2021'
      },

      // ── OPEN REDIRECT ────────────────────────────────────
      open_redirect: {
        regex: /(?:res\.redirect|location\.href|window\.location)\s*[=(]\s*(?:req\.|params\.|query\.)/gi,
        severity: 'MEDIUM',
        type: 'open_redirect',
        category: 'injection',
        message: 'Open redirect - user-controlled redirect destination',
        cwe: 'CWE-601',
        owasp: 'A01:2021'
      },

      // ── WEAK CRYPTO ──────────────────────────────────────
      md5_usage: {
        regex: /(?:createHash|hashlib\.)\s*\(\s*['"]md5['"]/gi,
        severity: 'MEDIUM',
        type: 'weak_crypto',
        category: 'crypto',
        message: 'Weak cryptographic algorithm - MD5 is broken',
        cwe: 'CWE-327',
        owasp: 'A02:2021'
      },
      sha1_usage: {
        regex: /(?:createHash|hashlib\.)\s*\(\s*['"]sha1?['"]/gi,
        severity: 'MEDIUM',
        type: 'weak_crypto',
        category: 'crypto',
        message: 'Weak cryptographic algorithm - SHA1 is deprecated',
        cwe: 'CWE-327',
        owasp: 'A02:2021'
      },
      math_random_crypto: {
        regex: /Math\.random\s*\(\s*\).*(?:token|secret|password|key|salt|nonce|iv)/gi,
        severity: 'HIGH',
        type: 'weak_crypto',
        category: 'crypto',
        message: 'Math.random() used for security - not cryptographically secure',
        cwe: 'CWE-338',
        owasp: 'A02:2021'
      },

      // ── INSECURE CONFIGURATION ───────────────────────────
      debug_enabled: {
        regex: /DEBUG\s*[=:]\s*(?:true|1|[Tt]rue|[Yy]es)/gi,
        severity: 'MEDIUM',
        type: 'debug_enabled',
        category: 'config',
        message: 'Debug mode enabled - exposes internals in production',
        cwe: 'CWE-489',
        owasp: 'A05:2021'
      },
      cors_wildcard: {
        regex: /(?:cors|Access-Control-Allow-Origin)\s*[:(=]\s*['"]?\*/gi,
        severity: 'MEDIUM',
        type: 'cors_misconfiguration',
        category: 'config',
        message: 'CORS wildcard (*) - allows any origin to access API',
        cwe: 'CWE-942',
        owasp: 'A05:2021'
      },
      tls_disabled: {
        regex: /(?:rejectUnauthorized|NODE_TLS_REJECT_UNAUTHORIZED)\s*[=:]\s*(?:false|0|'0'|"0")/gi,
        severity: 'HIGH',
        type: 'tls_disabled',
        category: 'config',
        message: 'TLS certificate verification disabled - MitM attack risk',
        cwe: 'CWE-295',
        owasp: 'A07:2021'
      },
      insecure_cookie: {
        regex: /(?:httpOnly|secure|sameSite)\s*[=:]\s*false/gi,
        severity: 'MEDIUM',
        type: 'insecure_cookie',
        category: 'config',
        message: 'Insecure cookie configuration - missing security flags',
        cwe: 'CWE-614',
        owasp: 'A05:2021'
      },
      exposed_stacktrace: {
        regex: /(?:err|error)\.stack\b.*(?:res\.|send|json|write)/gi,
        severity: 'MEDIUM',
        type: 'info_disclosure',
        category: 'config',
        message: 'Stack trace sent to client - information disclosure',
        cwe: 'CWE-209',
        owasp: 'A05:2021'
      },
      hardcoded_ip: {
        regex: /['"](?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?::\d{2,5})?['"]/g,
        severity: 'LOW',
        type: 'hardcoded_ip',
        category: 'config',
        message: 'Hardcoded IP address - use environment variables',
        cwe: 'CWE-547',
        owasp: 'A05:2021'
      },

      // ── AUTHENTICATION FLAWS ─────────────────────────────
      no_auth_check: {
        regex: /app\.(?:get|post|put|delete|patch)\s*\(\s*['"][^'"]*(?:admin|user|account|profile|dashboard)[^'"]*['"](?:(?!auth|session|jwt|token|middleware|protect|guard|verify|isAuth|requireAuth|ensureAuth|passport).){0,100}\(req,\s*res/gi,
        severity: 'HIGH',
        type: 'missing_auth',
        category: 'auth',
        message: 'Sensitive route potentially missing authentication middleware',
        cwe: 'CWE-306',
        owasp: 'A07:2021'
      },
      jwt_none_algo: {
        regex: /algorithms?\s*[=:]\s*\[?\s*['"]none['"]/gi,
        severity: 'CRITICAL',
        type: 'jwt_none_algorithm',
        category: 'auth',
        message: 'JWT "none" algorithm allowed - signature bypass',
        cwe: 'CWE-345',
        owasp: 'A07:2021'
      },

      // ── PROTOTYPE POLLUTION ──────────────────────────────
      prototype_pollution: {
        regex: /\[(?:req\.body|req\.query|req\.params|user_input|data)\s*\[/gi,
        severity: 'HIGH',
        type: 'prototype_pollution',
        category: 'injection',
        message: 'Potential prototype pollution via dynamic property access',
        cwe: 'CWE-1321',
        owasp: 'A03:2021'
      },

      // ── XXE ──────────────────────────────────────────────
      xxe_parser: {
        regex: /(?:parseString|parseXML|DOMParser|SAXParser|XMLReader)\s*\(/gi,
        severity: 'MEDIUM',
        type: 'xxe_vulnerability',
        category: 'injection',
        message: 'XML parsing without explicit XXE protection',
        cwe: 'CWE-611',
        owasp: 'A05:2021'
      },

      // ── LOGGING SENSITIVE DATA ───────────────────────────
      log_sensitive: {
        regex: /(?:console\.log|logger?\.\w+|print)\s*\([^)]*(?:password|secret|token|apiKey|credit.?card|ssn)/gi,
        severity: 'MEDIUM',
        type: 'sensitive_data_logging',
        category: 'secrets',
        message: 'Sensitive data written to logs',
        cwe: 'CWE-532',
        owasp: 'A09:2021'
      },
    };
  }

  /**
   * Scan a directory recursively
   */
  async scanDirectory(dirPath, depth = 0) {
    try {
      this.directoriesEntered++;
      const indent = '  '.repeat(Math.min(depth, 6));
      const dirName = path.basename(dirPath);
      if (this.verbose) {
        console.log(`${indent}📂 ${depth === 0 ? dirPath : dirName}/`);
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // Sort: directories first, then files
      const dirs = [];
      const files = [];
      for (const entry of entries) {
        if (entry.isDirectory()) dirs.push(entry);
        else if (entry.isFile()) files.push(entry);
      }

      // Scan files in this directory
      for (const entry of files) {
        const fullPath = path.join(dirPath, entry.name);
        if (this.shouldScanFile(entry.name)) {
          const prevCount = this.vulnerabilities.length;
          await this.scanFile(fullPath);
          const found = this.vulnerabilities.length - prevCount;
          if (this.verbose) {
            if (found > 0) {
              console.log(`${indent}  ⚠  ${entry.name}  [${found} issue${found > 1 ? 's' : ''}]`);
            } else {
              console.log(`${indent}  ✓  ${entry.name}`);
            }
          }
        }
      }

      // Recurse into subdirectories
      for (const entry of dirs) {
        const fullPath = path.join(dirPath, entry.name);
        if (this.shouldSkipDirectory(entry.name)) {
          this.skippedDirs.push(fullPath);
          if (this.verbose) {
            console.log(`${indent}  ⊘  ${entry.name}/  (skipped)`);
          }
          continue;
        }
        await this.scanDirectory(fullPath, depth + 1);
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(name) {
    const skipDirs = [
      'node_modules', '.git', 'dist', 'build', 'target', 'vendor',
      '.next', 'coverage', 'cache', '.bob', '__pycache__', '.venv',
      'venv', '.tox', '.mypy_cache', '.pytest_cache', 'eggs',
      '.gradle', '.mvn', 'bin', 'obj', '.vs', '.idea',
      '.terraform', '.serverless'
    ];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(filename) {
    // Skip lock files, minified files, source maps
    const skipFiles = [
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'composer.lock', 'Gemfile.lock', 'Cargo.lock', 'poetry.lock'
    ];
    if (skipFiles.includes(filename)) return false;
    if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) return false;
    if (filename.endsWith('.map')) return false;
    if (filename.endsWith('.d.ts')) return false;

    const extensions = [
      '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
      '.py', '.java', '.php', '.rb', '.go', '.cs', '.rs',
      '.env', '.config', '.json', '.yaml', '.yml',
      '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd',
      '.sql', '.graphql', '.gql',
      '.html', '.htm', '.xml', '.svg',
      '.tf', '.hcl',
      '.dockerfile', '.toml', '.ini', '.cfg', '.conf'
    ];
    if (filename === 'Dockerfile' || filename === 'Makefile' || filename === 'Vagrantfile') return true;
    if (filename === '.env' || filename.startsWith('.env.')) return true;
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
      },
      hardcoded_private_key: {
        code: '// Load private key from file or secrets manager:\nconst privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");',
        explanation: 'Private keys in source code can be extracted by anyone with repo access. Once leaked, an attacker can impersonate your service, decrypt data, or sign malicious payloads.',
        steps: [
          'Remove the private key from source code immediately',
          'Store it in a file outside the repo or in a secrets manager',
          'Reference via environment variable (PRIVATE_KEY_PATH or PRIVATE_KEY)',
          'Rotate the key — the old one is compromised'
        ]
      },
      hardcoded_github_token: {
        code: 'const GITHUB_TOKEN = process.env.GITHUB_TOKEN;',
        explanation: 'GitHub tokens grant access to repositories, organizations, and APIs. A leaked token can be used to read private repos, push malicious code, or exfiltrate data.',
        steps: [
          'Revoke the token immediately at github.com/settings/tokens',
          'Move to environment variable: process.env.GITHUB_TOKEN',
          'Use fine-grained tokens with minimal scope',
          'Add .env to .gitignore'
        ]
      },
      hardcoded_secret: {
        code: 'const SECRET = process.env.APP_SECRET;',
        explanation: 'Secrets hardcoded in source persist in git history and are visible to anyone with repo access.',
        steps: [
          'Move the secret to an environment variable',
          'Add .env to .gitignore',
          'Rotate the secret if the repo was ever public',
          'Consider using a secrets manager (Vault, AWS Secrets Manager)'
        ]
      },
      hardcoded_connection_string: {
        code: 'const DB_URL = process.env.DATABASE_URL;',
        explanation: 'Connection strings contain hostnames, ports, usernames, and passwords. A leaked connection string gives direct database access.',
        steps: [
          'Move the connection string to DATABASE_URL in .env',
          'Change the database password immediately',
          'Restrict database network access (firewall, VPC)',
          'Use SSL/TLS for database connections'
        ]
      },
      insecure_deserialization: {
        code: '// Python: use yaml.safe_load() instead of yaml.load()\n// Java: validate class types before deserialization\n// PHP: use json_decode() instead of unserialize()',
        explanation: 'Insecure deserialization allows attackers to execute arbitrary code by crafting malicious serialized objects. This is one of the most dangerous vulnerability classes.',
        steps: [
          'Replace unsafe deserialization with safe alternatives (yaml.safe_load, JSON.parse)',
          'If deserialization is required, validate and whitelist allowed classes',
          'Never deserialize data from untrusted sources',
          'Implement integrity checks (HMAC) on serialized data'
        ]
      },
      ssrf: {
        code: '// Validate and whitelist allowed URLs:\nconst url = new URL(userInput);\nconst allowed = ["api.example.com"];\nif (!allowed.includes(url.hostname)) throw new Error("Blocked");',
        explanation: 'Server-Side Request Forgery lets attackers make your server request internal services, cloud metadata endpoints (169.254.169.254), or other protected resources.',
        steps: [
          'Validate and whitelist allowed hostnames/URLs',
          'Block requests to private IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x)',
          'Use a URL parser to prevent bypass techniques',
          'Disable HTTP redirects or validate redirect targets'
        ]
      },
      open_redirect: {
        code: '// Validate redirect URL is relative or whitelisted:\nconst url = new URL(redirectTo, "https://myapp.com");\nif (url.origin !== "https://myapp.com") throw new Error("Invalid redirect");',
        explanation: 'Open redirects allow attackers to use your domain in phishing URLs. Users trust your domain and click links that redirect to malicious sites.',
        steps: [
          'Validate that redirect URLs are relative paths (start with /)',
          'Whitelist allowed redirect domains',
          'Use a URL parser to prevent bypass techniques (//evil.com, \\evil.com)',
          'Log and monitor redirect destinations'
        ]
      },
      cors_misconfiguration: {
        code: '// Use specific origins instead of wildcard:\napp.use(cors({\n  origin: ["https://myapp.com", "https://admin.myapp.com"],\n  credentials: true\n}));',
        explanation: 'CORS wildcard (*) allows any website to make authenticated requests to your API, potentially stealing user data or performing actions on their behalf.',
        steps: [
          'Replace "*" with specific allowed origins',
          'Never use wildcard with credentials: true',
          'Validate the Origin header server-side',
          'Consider using a CORS whitelist from environment config'
        ]
      },
      tls_disabled: {
        code: '// Never disable TLS verification in production:\n// Remove rejectUnauthorized: false\n// If needed for dev, use NODE_ENV check:\nconst tlsOptions = process.env.NODE_ENV === "production" ? {} : { rejectUnauthorized: false };',
        explanation: 'Disabling TLS certificate verification allows Man-in-the-Middle attacks. Attackers can intercept, read, and modify all HTTPS traffic.',
        steps: [
          'Remove rejectUnauthorized: false from production code',
          'If self-signed certs are needed, add them to the trust store',
          'Use proper CA-signed certificates in production',
          'Gate any TLS bypass behind NODE_ENV !== "production"'
        ]
      },
      insecure_cookie: {
        code: 'res.cookie("session", token, {\n  httpOnly: true,\n  secure: true,\n  sameSite: "strict",\n  maxAge: 3600000\n});',
        explanation: 'Cookies without security flags can be stolen via XSS (httpOnly), sent over HTTP (secure), or used in CSRF attacks (sameSite).',
        steps: [
          'Set httpOnly: true to prevent JavaScript access',
          'Set secure: true to require HTTPS',
          'Set sameSite: "strict" or "lax" to prevent CSRF',
          'Set reasonable maxAge/expires values'
        ]
      },
      info_disclosure: {
        code: '// Never send stack traces to clients:\napp.use((err, req, res, next) => {\n  console.error(err.stack); // Log server-side only\n  res.status(500).json({ error: "Internal server error" });\n});',
        explanation: 'Stack traces reveal internal file paths, library versions, and application structure. Attackers use this information to find exploitable vulnerabilities.',
        steps: [
          'Log errors server-side only (console.error, logger)',
          'Return generic error messages to clients',
          'Use a global error handler that strips internal details',
          'Set NODE_ENV=production to disable verbose errors'
        ]
      },
      missing_auth: {
        code: '// Add authentication middleware:\napp.get("/admin/dashboard", requireAuth, (req, res) => { ... });',
        explanation: 'Sensitive routes without authentication allow unauthorized access to admin panels, user data, or privileged operations.',
        steps: [
          'Add authentication middleware before the route handler',
          'Verify the user role/permissions match the route requirements',
          'Implement rate limiting on authentication endpoints',
          'Log failed authentication attempts'
        ]
      },
      jwt_none_algorithm: {
        code: '// Always specify allowed algorithms:\njwt.verify(token, secret, { algorithms: ["HS256"] });',
        explanation: 'Allowing the "none" algorithm means JWTs can be forged without any signature. Attackers bypass all authentication.',
        steps: [
          'Remove "none" from allowed algorithms immediately',
          'Explicitly whitelist: algorithms: ["HS256"] (or RS256)',
          'Invalidate all existing tokens',
          'Use a well-maintained JWT library'
        ]
      },
      prototype_pollution: {
        code: '// Validate property names before dynamic access:\nconst SAFE_KEYS = new Set(["name", "email", "age"]);\nfor (const key of Object.keys(input)) {\n  if (!SAFE_KEYS.has(key)) delete input[key];\n}',
        explanation: 'Prototype pollution lets attackers inject properties into Object.prototype, affecting all objects in the application. Can lead to RCE or authentication bypass.',
        steps: [
          'Validate and whitelist allowed property names',
          'Use Object.create(null) for lookup objects',
          'Freeze prototypes: Object.freeze(Object.prototype)',
          'Use Map instead of plain objects for user-controlled keys'
        ]
      },
      xxe_vulnerability: {
        code: '// Disable external entities in XML parser:\n// Node.js: use xml2js (safe by default)\n// Java: factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);',
        explanation: 'XXE attacks allow reading local files, SSRF, and denial of service via specially crafted XML documents with external entity references.',
        steps: [
          'Disable external entity processing in the XML parser',
          'Use JSON instead of XML where possible',
          'If XML is required, use a parser that disables DTDs by default',
          'Validate and sanitize XML input before parsing'
        ]
      },
      sensitive_data_logging: {
        code: '// Redact sensitive fields before logging:\nconst safeLog = { ...data, password: "[REDACTED]", token: "[REDACTED]" };\nconsole.log("User action:", safeLog);',
        explanation: 'Logging passwords, tokens, or API keys exposes them in log files, monitoring systems, and error tracking tools — all of which may have broader access than the source code.',
        steps: [
          'Remove or redact sensitive fields before logging',
          'Use a logging library with built-in redaction (pino, winston)',
          'Audit existing log statements for sensitive data',
          'Configure log rotation and access controls'
        ]
      },
      hardcoded_ip: {
        code: 'const SERVER_HOST = process.env.SERVER_HOST || "localhost";',
        explanation: 'Hardcoded IP addresses make deployments brittle and can expose internal infrastructure details.',
        steps: [
          'Move IP addresses to environment variables',
          'Use DNS hostnames instead of IPs where possible',
          'Document required network configuration',
          'Use service discovery in containerized environments'
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
      // Skip files that are too large (>2MB) — likely generated/binary
      const stat = await fs.stat(filePath);
      if (stat.size > 2 * 1024 * 1024) return;

      const content = await fs.readFile(filePath, 'utf8');

      // Skip binary-looking content
      if (content.includes('\0')) return;

      const lines = content.split('\n');
      this.filesScanned++;
      this.scannedFiles.push(filePath);

      // Detect if this file is the scanner itself or contains fix templates
      const isScannerCode = filePath.endsWith('scanner.js') && content.includes('class SecurityScanner');
      const isFixTemplate = content.includes('TYPE_INFO') && content.includes('label:') && content.includes('desc:');

      // Check each pattern
      for (const [patternName, pattern] of Object.entries(this.patterns)) {
        let match;
        pattern.regex.lastIndex = 0; // Reset regex
        
        while ((match = pattern.regex.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const lineContent = lines[lineNumber - 1].trim();

          // Skip false positives inside fix templates, string descriptions, and comments
          if (isScannerCode || isFixTemplate) {
            const lineRaw = lines[lineNumber - 1];
            // Check if match is inside a string literal, fix template, or type definition
            const isInTemplate = /^\s*(?:code:|explanation:|desc:|message:|steps:|label:|regex:)/.test(lineRaw)
              || /^\s*['"?:]/.test(lineRaw)
              || /^\s*\/\//.test(lineRaw)
              || /^\s*\*/.test(lineRaw);
            // In TYPE_INFO files, also skip lines that define type entries (key: { label: ..., desc: ... })
            const isTypeInfoLine = isFixTemplate && /\blabel:\s*'/.test(lineRaw) && /\bdesc:\s*'/.test(lineRaw);
            if (isInTemplate || isTypeInfoLine) continue;
          }

          // Skip matches inside comments
          if (lineContent.startsWith('//') || lineContent.startsWith('*') || lineContent.startsWith('#')) continue;
          
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

    // Group by type for breakdown
    const typeBreakdown = {};
    this.vulnerabilities.forEach(vuln => {
      if (!typeBreakdown[vuln.type]) {
        typeBreakdown[vuln.type] = { count: 0, severity: vuln.severity, message: vuln.message };
      }
      typeBreakdown[vuln.type].count++;
    });

    return {
      scan_timestamp: new Date().toISOString(),
      repository: path.basename(targetPath),
      scan_target: targetPath,
      total_files_scanned: this.filesScanned,
      directories_traversed: this.directoriesEntered,
      directories_skipped: this.skippedDirs.length,
      scan_duration_ms: duration,
      scanned_files: this.scannedFiles,
      vulnerabilities: this.vulnerabilities,
      summary: {
        ...healthData.summary,
        total: this.vulnerabilities.length,
        health_score: healthData.score,
        files_with_issues: filesWithIssues,
        categories,
        type_breakdown: typeBreakdown
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
  console.log(`Target: ${targetPath}`);
  console.log(`Patterns loaded: ${Object.keys(new SecurityScanner().patterns).length} detection rules`);
  console.log('─'.repeat(60));
  console.log();

  const scanner = new SecurityScanner();
  await scanner.scanDirectory(targetPath);
  
  const report = scanner.generateReport(targetPath);
  
  // Ensure cache dir exists and save report
  const cacheDir = path.join(__dirname, '../cache');
  await fs.mkdir(cacheDir, { recursive: true });
  const outputPath = path.join(cacheDir, 'vulnerabilities.json');
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  
  // Display findings inline
  console.log();
  if (report.vulnerabilities.length > 0) {
    console.log('─'.repeat(60));
    console.log('  FINDINGS');
    console.log('─'.repeat(60));
    const byFile = {};
    report.vulnerabilities.forEach(v => {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    });
    for (const [file, vulns] of Object.entries(byFile)) {
      const relFile = path.relative(targetPath, file);
      console.log(`\n  📄 ${relFile}`);
      vulns.forEach(v => {
        const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'HIGH' ? '🟠' : v.severity === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`     ${icon} L${v.line}: ${v.message} [${v.cwe}]`);
      });
    }
    console.log();
  }

  // Display summary
  console.log('═'.repeat(60));
  console.log('  SCAN SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Target:           ${targetPath}`);
  console.log(`  Directories:      ${report.directories_traversed} scanned, ${report.directories_skipped} skipped`);
  console.log(`  Files Scanned:    ${report.total_files_scanned}`);
  console.log(`  Vulnerabilities:  ${report.summary.total}`);
  console.log(`    🔴 Critical:    ${report.summary.critical}`);
  console.log(`    🟠 High:        ${report.summary.high}`);
  console.log(`    🟡 Medium:      ${report.summary.medium}`);
  console.log(`    🟢 Low:         ${report.summary.low}`);
  console.log(`  Health Score:     ${report.summary.health_score}/100`);
  console.log(`  Duration:         ${report.scan_duration_ms}ms`);
  console.log('─'.repeat(60));

  // Category breakdown
  if (Object.keys(report.summary.categories).length > 0) {
    console.log('  Categories:');
    for (const [cat, count] of Object.entries(report.summary.categories)) {
      console.log(`    ${cat}: ${count}`);
    }
    console.log('─'.repeat(60));
  }

  console.log(`  Report saved to: ${outputPath}`);
  console.log();
  
  if (report.summary.critical > 0) {
    console.log('⚠️  CRITICAL issues found! Review immediately.');
    process.exit(1);
  } else if (report.summary.high > 0) {
    console.log('⚠️  HIGH severity issues found.');
    process.exit(1);
  } else if (report.summary.total > 0) {
    console.log('⚠️  Issues found. Review recommended.');
    process.exit(0);
  } else {
    console.log('✅ No security issues found. Clean scan.');
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

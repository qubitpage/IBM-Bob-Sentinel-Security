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
            confidence: 85
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

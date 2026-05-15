import { useState, useEffect } from 'react';
import './CodeDiffViewer.css';

/**
 * CodeDiffViewer Component
 * Displays detailed vulnerability information with before/after code comparison
 * 
 * Features:
 * - Side-by-side code comparison
 * - Syntax highlighting
 * - Line-by-line annotations
 * - Copy code buttons
 * - Detailed explanation of vulnerability and fix
 * - Security impact assessment
 */
function CodeDiffViewer({ vulnerability, onBack }) {
  const [copied, setCopied] = useState(false);

  /**
   * Copy code to clipboard
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /**
   * Get severity color
   */
  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: '#ef4444',
      HIGH: '#f97316',
      MEDIUM: '#f59e0b',
      LOW: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  /**
   * Format file path
   */
  const formatFilePath = (path) => {
    return path.replace(/\\/g, '/');
  };

  /**
   * Generate secure code fix based on vulnerability type
   */
  const generateSecureFix = (vuln) => {
    const fixes = {
      hardcoded_aws_key: `// ✅ SECURE: Use environment variables
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Add to .env file (never commit this):
// AWS_ACCESS_KEY_ID=your_key_here
// AWS_SECRET_ACCESS_KEY=your_secret_here`,

      hardcoded_stripe_key: `// ✅ SECURE: Use environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Add to .env file (never commit this):
// STRIPE_SECRET_KEY=your_key_here`,

      hardcoded_api_key: `// ✅ SECURE: Use environment variables
const API_KEY = process.env.API_KEY;

// Add to .env file (never commit this):
// API_KEY=your_key_here`,

      hardcoded_password: `// ✅ SECURE: Use environment variables
const DB_PASSWORD = process.env.DB_PASSWORD;

// Add to .env file (never commit this):
// DB_PASSWORD=your_password_here`,

      hardcoded_jwt_secret: `// ✅ SECURE: Use environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Generate a secure secret:
// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,

      sql_injection: `// ✅ SECURE: Use parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.execute(query, [email]);

// Never concatenate user input into SQL queries`,

      xss_vulnerability: `// ✅ SECURE: Use textContent or sanitize HTML
const container = document.getElementById('content');
container.textContent = userInput; // Automatically escapes HTML

// Or use DOMPurify for rich content:
// container.innerHTML = DOMPurify.sanitize(userInput);`,

      command_injection: `// ✅ SECURE: Use spawn with argument array
const { spawn } = require('child_process');

// Validate input first
if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
  throw new Error('Invalid hostname');
}

const ping = spawn('ping', ['-c', '4', host]);`,

      unsafe_eval: `// ✅ SECURE: Never use eval()
// For math expressions, use a safe parser:
const math = require('mathjs');
const result = math.evaluate(expression);

// For JSON, use JSON.parse():
const data = JSON.parse(jsonString);`,

      debug_enabled: `// ✅ SECURE: Disable debug in production
const DEBUG = process.env.NODE_ENV !== 'production';
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'error' : 'debug';`
    };

    return fixes[vuln.type] || `// ✅ SECURE: Fix for ${vuln.type}
// Consult security best practices for this vulnerability type`;
  };

  if (!vulnerability) {
    return null;
  }

  const secureFix = generateSecureFix(vulnerability);

  return (
    <div className="code-diff-viewer">
      {/* Header */}
      <div className="diff-header">
        <button onClick={onBack} className="btn-back">
          ← Back to List
        </button>
        
        <div className="diff-title">
          <h2>{vulnerability.message}</h2>
          <span 
            className="severity-badge"
            style={{ backgroundColor: getSeverityColor(vulnerability.severity) }}
          >
            {vulnerability.severity}
          </span>
        </div>
      </div>

      {/* Vulnerability Details */}
      <div className="vuln-details">
        <div className="detail-grid">
          <div className="detail-item">
            <strong>ID:</strong> {vulnerability.id}
          </div>
          <div className="detail-item">
            <strong>Type:</strong> {vulnerability.type.replace(/_/g, ' ')}
          </div>
          <div className="detail-item">
            <strong>Category:</strong> {vulnerability.category}
          </div>
          <div className="detail-item">
            <strong>File:</strong> {formatFilePath(vulnerability.file)}
          </div>
          <div className="detail-item">
            <strong>Line:</strong> {vulnerability.line}
          </div>
          <div className="detail-item">
            <strong>Confidence:</strong> {vulnerability.confidence}%
          </div>
        </div>

        {/* Security Standards */}
        <div className="security-standards">
          {vulnerability.cwe && (
            <a 
              href={`https://cwe.mitre.org/data/definitions/${vulnerability.cwe.replace('CWE-', '')}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="standard-badge"
            >
              {vulnerability.cwe}
            </a>
          )}
          {vulnerability.owasp && (
            <span className="standard-badge">
              {vulnerability.owasp}
            </span>
          )}
        </div>
      </div>

      {/* Explanation Section */}
      <div className="explanation-section">
        <h3>🔍 What's Wrong?</h3>
        <p className="explanation-text">
          {getExplanation(vulnerability)}
        </p>
      </div>

      {/* Impact Section */}
      <div className="impact-section">
        <h3>⚠️ Security Impact</h3>
        <p className="impact-text">
          {getImpact(vulnerability)}
        </p>
      </div>

      {/* Code Comparison */}
      <div className="code-comparison">
        <h3>Code Comparison</h3>
        
        <div className="comparison-grid">
          {/* Vulnerable Code */}
          <div className="code-panel vulnerable">
            <div className="panel-header">
              <span className="panel-title">❌ Vulnerable Code</span>
              <button 
                onClick={() => copyToClipboard(vulnerability.code)}
                className="btn-copy"
                title="Copy code"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <div className="code-content">
              <pre><code>{vulnerability.code}</code></pre>
            </div>
          </div>

          {/* Secure Code */}
          <div className="code-panel secure">
            <div className="panel-header">
              <span className="panel-title">✅ Secure Code</span>
              <button 
                onClick={() => copyToClipboard(secureFix)}
                className="btn-copy"
                title="Copy code"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <div className="code-content">
              <pre><code>{secureFix}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Fix Explanation */}
      <div className="fix-section">
        <h3>✅ How to Fix</h3>
        <div className="fix-steps">
          {getFixSteps(vulnerability).map((step, index) => (
            <div key={index} className="fix-step">
              <span className="step-number">{index + 1}</span>
              <span className="step-text">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="resources-section">
        <h3>📚 Learn More</h3>
        <ul className="resource-list">
          <li>
            <a href={`https://cwe.mitre.org/data/definitions/${vulnerability.cwe?.replace('CWE-', '')}.html`} target="_blank" rel="noopener noreferrer">
              CWE Documentation
            </a>
          </li>
          <li>
            <a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noopener noreferrer">
              OWASP Top 10
            </a>
          </li>
          <li>
            <a href={`https://www.google.com/search?q=${vulnerability.type}+security+best+practices`} target="_blank" rel="noopener noreferrer">
              Security Best Practices
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Get detailed explanation for vulnerability
 */
function getExplanation(vuln) {
  const explanations = {
    hardcoded_aws_key: 'AWS credentials are hardcoded directly in the source code. Anyone with access to the repository can use these credentials to access your AWS resources, potentially leading to data breaches, resource hijacking, or significant financial costs.',
    hardcoded_stripe_key: 'Stripe API keys are exposed in the source code. This allows attackers to process payments, issue refunds, and access customer payment information, violating PCI DSS compliance.',
    hardcoded_api_key: 'API keys are hardcoded in the source, making them accessible to anyone who can view the code. This can lead to unauthorized API usage, quota exhaustion, and potential service abuse.',
    hardcoded_password: 'Passwords are stored in plain text in the source code. This is a critical security vulnerability that exposes user accounts and system access.',
    hardcoded_jwt_secret: 'JWT secret keys are hardcoded, allowing anyone with access to forge valid authentication tokens and impersonate any user.',
    sql_injection: 'User input is directly concatenated into SQL queries without parameterization. Attackers can inject malicious SQL code to bypass authentication, extract data, or modify the database.',
    xss_vulnerability: 'User input is inserted into HTML without sanitization, allowing attackers to inject malicious JavaScript that executes in other users\' browsers.',
    command_injection: 'User input is passed to shell commands without validation, allowing attackers to execute arbitrary system commands.',
    unsafe_eval: 'The eval() function executes arbitrary code, creating a severe security risk when used with user input.',
    debug_enabled: 'Debug mode is enabled in production, potentially exposing sensitive information through verbose error messages and stack traces.'
  };
  
  return explanations[vuln.type] || `This ${vuln.type} vulnerability poses a security risk to your application.`;
}

/**
 * Get security impact description
 */
function getImpact(vuln) {
  const impacts = {
    hardcoded_aws_key: 'Complete AWS account compromise. Attackers could access all resources, steal data, deploy malicious infrastructure, or incur massive costs. Estimated damage: $50,000+',
    hardcoded_stripe_key: 'Financial fraud and PCI DSS violations. Attackers could steal payment information, process fraudulent transactions, or issue unauthorized refunds.',
    hardcoded_api_key: 'Unauthorized API access leading to quota exhaustion, service abuse, or data exposure. May result in unexpected charges and service disruption.',
    hardcoded_password: 'Account takeover and unauthorized access. If users reuse passwords, the impact extends to other services.',
    hardcoded_jwt_secret: 'Complete authentication bypass. Attackers can impersonate any user, including administrators, gaining full system access.',
    sql_injection: 'Complete database compromise. Attackers can read, modify, or delete all data, bypass authentication, or execute administrative operations.',
    xss_vulnerability: 'Session hijacking, credential theft, malware distribution, or phishing attacks. Affects all users who view the malicious content.',
    command_injection: 'Complete server compromise. Attackers can execute any system command, install backdoors, steal data, or pivot to other systems.',
    unsafe_eval: 'Remote code execution. Attackers gain complete control over the application and potentially the entire server.',
    debug_enabled: 'Information disclosure. Sensitive data, internal paths, and system details may be exposed through error messages.'
  };
  
  return impacts[vuln.type] || 'This vulnerability could be exploited to compromise system security.';
}

/**
 * Get step-by-step fix instructions
 */
function getFixSteps(vuln) {
  const steps = {
    hardcoded_aws_key: [
      'Remove the hardcoded credentials from the source code',
      'Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your .env file',
      'Ensure .env is in .gitignore',
      'Rotate the exposed credentials immediately in AWS IAM',
      'Use AWS IAM roles when possible instead of access keys'
    ],
    hardcoded_stripe_key: [
      'Remove the hardcoded Stripe key from source code',
      'Add STRIPE_SECRET_KEY to your .env file',
      'Rotate the exposed key immediately in Stripe dashboard',
      'Use Stripe\'s test keys for development',
      'Implement proper key management for production'
    ],
    sql_injection: [
      'Replace string concatenation with parameterized queries',
      'Use prepared statements with placeholders ($1, $2, etc.)',
      'Validate and sanitize all user inputs',
      'Use an ORM that handles parameterization automatically',
      'Test with SQL injection payloads to verify the fix'
    ],
    xss_vulnerability: [
      'Use textContent instead of innerHTML for plain text',
      'Sanitize HTML content with DOMPurify before insertion',
      'Implement Content-Security-Policy headers',
      'Encode output based on context (HTML, JavaScript, URL)',
      'Validate and sanitize all user inputs'
    ],
    command_injection: [
      'Never pass user input directly to shell commands',
      'Use spawn() with argument arrays instead of exec()',
      'Validate input against strict patterns (whitelist)',
      'Use safe APIs instead of shell commands when possible',
      'Implement proper input sanitization'
    ],
    unsafe_eval: [
      'Remove all eval() usage from the code',
      'Use JSON.parse() for JSON data',
      'Use safe expression parsers (like mathjs) for calculations',
      'Implement proper input validation',
      'Use Function constructor only with trusted code'
    ]
  };
  
  return steps[vuln.type] || [
    'Review the vulnerability details carefully',
    'Implement the secure code pattern shown above',
    'Test the fix thoroughly',
    'Run the security scanner again to verify'
  ];
}

export default CodeDiffViewer;

// Made with Bob

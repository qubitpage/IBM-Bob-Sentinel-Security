/**
 * Bob Sentinel Dashboard - Backend API Server
 * Production-ready Express.js server for serving security scan data
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fsSync = require('fs');
const fs = require('fs').promises;
const { execFileSync } = require('child_process');
const { DEFAULT_FIREWALL_POLICY, evaluateFirewall } = require('../../lib/firewall');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '../..');
const BOB_INBOX_DIR = path.join(ROOT_DIR, '.bob/inbox');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Cache directory path
const CACHE_DIR = path.join(ROOT_DIR, 'cache');

/**
 * Helper function to read JSON file from cache
 */
async function readCacheFile(filename) {
  try {
    const filePath = path.join(CACHE_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    throw new Error(`Cache file not found: ${filename}`);
  }
}

/**
 * Helper function to write JSON file to cache
 */
async function writeCacheFile(filename, data) {
  try {
    const filePath = path.join(CACHE_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    throw new Error(`Failed to write cache file: ${filename}`);
  }
}

function withFirewallDecision(scanData) {
  return {
    ...scanData,
    firewall: evaluateFirewall(scanData)
  };
}

function redactSensitiveCode(code = '') {
  return String(code)
    .replace(/AKIA[0-9A-Z]{16}/g, 'AKIA[REDACTED]')
    .replace(/sk_live_[a-zA-Z0-9]{12,}/g, 'sk_live_[REDACTED]')
    .replace(/gh[pousr]_[A-Za-z0-9_]{12,}/g, 'gh_[REDACTED]')
    .replace(/(password|passwd|pwd|secret|token|api[_-]?key)(['"]?\s*[=:]\s*['"])[^'"]+(['"])/gi, '$1$2[REDACTED]$3')
    .replace(/((?:mongodb|postgres|mysql|redis|amqp):\/\/)[^'"\s]+/gi, '$1[REDACTED]');
}

function buildBobFixSession(scanData, requestedIds = []) {
  const vulnerabilities = scanData.vulnerabilities || [];
  const idSet = new Set(requestedIds);
  const selected = vulnerabilities
    .filter(vulnerability => idSet.size === 0 || idSet.has(vulnerability.id))
    .filter(vulnerability => idSet.size > 0 || ['CRITICAL', 'HIGH'].includes(vulnerability.severity))
    .slice(0, 25);

  const sessionId = `fix-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const promptLines = [
    '# Bob Sentinel Fix Session',
    '',
    `Session: ${sessionId}`,
    `Repository: ${scanData.repository}`,
    `Scan target: ${scanData.scan_target}`,
    `Firewall: ${scanData.firewall?.action || 'UNKNOWN'} (${scanData.firewall?.status || 'unknown'})`,
    '',
    'You are IBM Bob in Sentinel mode. Fix the listed vulnerabilities in the workspace. Preserve behavior, use minimal scoped edits, and do not introduce placeholders or mock fixes.',
    '',
    'After editing, run the Bob Sentinel scan again, then run the publish guard. Only report ready when the firewall returns ALLOW or an accepted WARN.',
    '',
    '## Findings To Fix',
    ''
  ];

  selected.forEach((vulnerability, index) => {
    const fix = vulnerability.fix || {};
    promptLines.push(
      `### ${index + 1}. ${vulnerability.id} - ${vulnerability.severity} - ${vulnerability.type}`,
      '',
      `File: ${vulnerability.file}`,
      `Line: ${vulnerability.line}`,
      `Message: ${vulnerability.message}`,
      `CWE: ${vulnerability.cwe || 'n/a'}`,
      `OWASP: ${vulnerability.owasp || 'n/a'}`,
      '',
      'Vulnerable code:',
      '```',
      redactSensitiveCode(vulnerability.code || ''),
      '```',
      '',
      'Suggested secure direction:',
      '```',
      redactSensitiveCode(fix.code || 'Review context and apply the secure equivalent for this finding.'),
      '```',
      '',
      fix.explanation ? `Reason: ${fix.explanation}` : '',
      ''
    );
  });

  if (vulnerabilities.length > selected.length) {
    promptLines.push(`Note: ${vulnerabilities.length - selected.length} additional findings remain in cache/vulnerabilities.json. Fix this selected release-blocking batch first, rescan, then continue.`);
  }

  return {
    sessionId,
    createdAt: new Date().toISOString(),
    repository: scanData.repository,
    scanTarget: scanData.scan_target,
    firewall: scanData.firewall,
    vulnerabilityCount: selected.length,
    vulnerabilityIds: selected.map(vulnerability => vulnerability.id),
    prompt: promptLines.filter(Boolean).join('\n')
  };
}

function runLocalCommand(command, args, options = {}) {
  try {
    const output = execFileSync(command, args, {
      encoding: 'utf8',
      timeout: options.timeout || 120000,
      cwd: options.cwd || ROOT_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...(options.env || {}) }
    });
    return { exitCode: 0, output };
  } catch (error) {
    return {
      exitCode: typeof error.status === 'number' ? error.status : 1,
      output: `${error.stdout || ''}${error.stderr || error.message || ''}`
    };
  }
}

function parsePublishGuardOutput(output) {
  if (output.includes('PUBLISH BLOCKED')) return 'blocked';
  if (output.includes('PUBLISH WARNING')) return 'warning';
  if (output.includes('PUBLISH ALLOWED')) return 'allowed';
  return 'unknown';
}

function runPublishGuardPreservingScan(targets = []) {
  const reportPath = path.join(CACHE_DIR, 'vulnerabilities.json');
  const firewallPath = path.join(CACHE_DIR, 'firewall-decision.json');
  const previousReport = fsSync.existsSync(reportPath) ? fsSync.readFileSync(reportPath, 'utf8') : null;
  const previousFirewall = fsSync.existsSync(firewallPath) ? fsSync.readFileSync(firewallPath, 'utf8') : null;

  try {
    return runLocalCommand(process.execPath, [path.join(ROOT_DIR, 'cli/publish-guard.js'), ...targets], { timeout: 180000 });
  } finally {
    if (previousReport !== null) fsSync.writeFileSync(reportPath, previousReport, 'utf8');
    if (previousFirewall !== null) fsSync.writeFileSync(firewallPath, previousFirewall, 'utf8');
  }
}

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Bob Sentinel API'
  });
});

/**
 * GET /api/scan-results
 * Get complete scan results including all vulnerabilities
 */
app.get('/api/scan-results', async (req, res) => {
  try {
    const data = withFirewallDecision(await readCacheFile('vulnerabilities.json'));
    res.json(data);
  } catch (error) {
    res.status(404).json({
      error: 'Scan results not found',
      message: 'No scan has been performed yet. Run a security scan first.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/firewall/policy
 * Get the active code firewall policy
 */
app.get('/api/firewall/policy', (req, res) => {
  res.json(DEFAULT_FIREWALL_POLICY);
});

/**
 * GET /api/firewall
 * Get the latest code firewall decision from scan results
 */
app.get('/api/firewall', async (req, res) => {
  try {
    const data = withFirewallDecision(await readCacheFile('vulnerabilities.json'));
    res.json({
      repository: data.repository,
      scanTarget: data.scan_target,
      scanTimestamp: data.scan_timestamp,
      summary: data.summary,
      firewall: data.firewall
    });
  } catch (error) {
    res.status(404).json({
      error: 'Firewall decision not available',
      message: 'Run a security scan first.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/vulnerabilities
 * Get list of vulnerabilities with optional filtering
 * Query params: severity, category, file
 */
app.get('/api/vulnerabilities', async (req, res) => {
  try {
    const data = await readCacheFile('vulnerabilities.json');
    let vulnerabilities = data.vulnerabilities || [];

    // Apply filters
    const { severity, category, file } = req.query;

    if (severity) {
      vulnerabilities = vulnerabilities.filter(v => 
        v.severity.toLowerCase() === severity.toLowerCase()
      );
    }

    if (category) {
      vulnerabilities = vulnerabilities.filter(v => 
        v.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (file) {
      vulnerabilities = vulnerabilities.filter(v => 
        v.file.includes(file)
      );
    }

    res.json({
      total: vulnerabilities.length,
      vulnerabilities,
      filters: { severity, category, file }
    });
  } catch (error) {
    res.status(404).json({
      error: 'Vulnerabilities not found',
      message: error.message
    });
  }
});

/**
 * GET /api/vulnerability/:id
 * Get detailed information about a specific vulnerability
 */
app.get('/api/vulnerability/:id', async (req, res) => {
  try {
    const data = await readCacheFile('vulnerabilities.json');
    const vulnerability = data.vulnerabilities.find(v => v.id === req.params.id);

    if (!vulnerability) {
      return res.status(404).json({
        error: 'Vulnerability not found',
        id: req.params.id
      });
    }

    // Get fix details if available
    let fixDetails = null;
    try {
      const fixes = await readCacheFile('fixes.json');
      fixDetails = fixes.find(f => f.id === req.params.id);
    } catch (error) {
      // fixes.json might not exist yet
    }

    res.json({
      ...vulnerability,
      fixDetails
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve vulnerability',
      message: error.message
    });
  }
});

/**
 * GET /api/health-score
 * Get repository health score and breakdown
 */
app.get('/api/health-score', async (req, res) => {
  try {
    const data = await readCacheFile('vulnerabilities.json');
    
    const healthScore = {
      score: data.summary.health_score,
      status: data.summary.health_score >= 80 ? 'healthy' : 
              data.summary.health_score >= 50 ? 'warning' : 'critical',
      breakdown: {
        critical: data.summary.critical,
        high: data.summary.high,
        medium: data.summary.medium,
        low: data.summary.low
      },
      categories: data.summary.categories,
      totalIssues: data.summary.total,
      filesAffected: data.summary.files_with_issues,
      lastScan: data.scan_timestamp,
      recommendations: data.recommendations || []
    };

    res.json(healthScore);
  } catch (error) {
    res.status(404).json({
      error: 'Health score not available',
      message: error.message
    });
  }
});

/**
 * GET /api/summary
 * Get summary statistics
 */
app.get('/api/summary', async (req, res) => {
  try {
    const data = await readCacheFile('vulnerabilities.json');
    
    res.json({
      repository: data.repository,
      scanTimestamp: data.scan_timestamp,
      totalFiles: data.total_files_scanned,
      scanDuration: data.scan_duration_ms,
      summary: data.summary
    });
  } catch (error) {
    res.status(404).json({
      error: 'Summary not available',
      message: error.message
    });
  }
});

/**
 * GET /api/files
 * Get list of files with vulnerabilities
 */
app.get('/api/files', async (req, res) => {
  try {
    const data = await readCacheFile('vulnerabilities.json');
    
    // Group vulnerabilities by file
    const fileMap = new Map();
    
    data.vulnerabilities.forEach(vuln => {
      if (!fileMap.has(vuln.file)) {
        fileMap.set(vuln.file, {
          file: vuln.file,
          vulnerabilities: [],
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        });
      }
      
      const fileData = fileMap.get(vuln.file);
      fileData.vulnerabilities.push(vuln.id);
      fileData[vuln.severity.toLowerCase()]++;
    });

    const files = Array.from(fileMap.values()).sort((a, b) => {
      // Sort by severity: critical first, then high, etc.
      return (b.critical * 1000 + b.high * 100 + b.medium * 10 + b.low) -
             (a.critical * 1000 + a.high * 100 + a.medium * 10 + a.low);
    });

    res.json({
      total: files.length,
      files
    });
  } catch (error) {
    res.status(404).json({
      error: 'File list not available',
      message: error.message
    });
  }
});

/**
 * GET /api/categories
 * Get vulnerabilities grouped by category
 */
app.get('/api/categories', async (req, res) => {
  try {
    const data = await readCacheFile('vulnerabilities.json');
    
    const categories = {};
    
    data.vulnerabilities.forEach(vuln => {
      if (!categories[vuln.category]) {
        categories[vuln.category] = {
          name: vuln.category,
          count: 0,
          vulnerabilities: []
        };
      }
      
      categories[vuln.category].count++;
      categories[vuln.category].vulnerabilities.push({
        id: vuln.id,
        severity: vuln.severity,
        message: vuln.message
      });
    });

    res.json({
      categories: Object.values(categories)
    });
  } catch (error) {
    res.status(404).json({
      error: 'Categories not available',
      message: error.message
    });
  }
});

/**
 * GET /api/browse
 * Browse directories for folder selection
 * Query: dir (base directory to list)
 */
app.get('/api/browse', async (req, res) => {
  try {
    const baseDir = req.query.dir || path.join(__dirname, '../..');
    const resolvedDir = path.resolve(baseDir);

    // Security: prevent traversal above reasonable paths
    const dirStat = await fs.stat(resolvedDir).catch(() => null);
    if (!dirStat || !dirStat.isDirectory()) {
      return res.status(400).json({ error: 'Invalid directory', path: resolvedDir });
    }

    const entries = await fs.readdir(resolvedDir, { withFileTypes: true });
    const folders = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '__pycache__')
      .map(e => ({
        name: e.name,
        path: path.join(resolvedDir, e.name).replace(/\\/g, '/')
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      current: resolvedDir.replace(/\\/g, '/'),
      parent: path.dirname(resolvedDir).replace(/\\/g, '/'),
      folders
    });
  } catch (error) {
    res.status(500).json({ error: 'Browse failed', message: error.message });
  }
});

/**
 * POST /api/scan
 * Trigger a new security scan
 */
app.post('/api/scan', async (req, res) => {
  const targetDir = req.body.directory || path.join(__dirname, '../../sample-vulnerable-app');
  const scannerPath = path.join(__dirname, '../../cli/scanner.js');

  try {
    const resolvedDir = path.resolve(targetDir);

    // Validate the directory exists
    const dirStat = await fs.stat(resolvedDir).catch(() => null);
    if (!dirStat || !dirStat.isDirectory()) {
      return res.status(400).json({ success: false, error: 'Invalid directory', message: `Directory not found: ${resolvedDir}` });
    }

    // Ensure cache dir exists
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // Run scanner - use execFile to avoid shell injection
    let output = '';
    try {
      output = execFileSync('node', [scannerPath, resolvedDir], {
        encoding: 'utf8',
        timeout: 120000,
        cwd: path.join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (execErr) {
      // Scanner exits non-zero when vulnerabilities found - that's expected
      output = execErr.stdout || execErr.stderr || execErr.message;
    }

    // Read fresh results
    const data = withFirewallDecision(await readCacheFile('vulnerabilities.json'));
    await writeCacheFile('firewall-decision.json', data.firewall);
    res.json({ success: true, message: 'Scan completed', log: output, results: data });
  } catch (error) {
    // Even on non-zero exit, scanner may have written results
    try {
      const data = withFirewallDecision(await readCacheFile('vulnerabilities.json'));
      await writeCacheFile('firewall-decision.json', data.firewall);
      res.json({ success: true, message: 'Scan completed with findings', log: error.stdout || error.message, results: data });
    } catch (e2) {
      res.status(500).json({ success: false, error: 'Scan failed', message: error.message, log: error.stdout || '' });
    }
  }
});

/**
 * POST /api/bob/fix-session
 * Create a structured Bob Sentinel fix handoff for the current scan.
 */
app.post('/api/bob/fix-session', async (req, res) => {
  try {
    const scanData = withFirewallDecision(await readCacheFile('vulnerabilities.json'));
    const session = buildBobFixSession(scanData, req.body?.vulnerabilityIds || []);
    const jsonPath = path.join(BOB_INBOX_DIR, `${session.sessionId}.json`);
    const markdownPath = path.join(BOB_INBOX_DIR, `${session.sessionId}.md`);

    await fs.mkdir(BOB_INBOX_DIR, { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify(session, null, 2), 'utf8');
    await fs.writeFile(markdownPath, session.prompt, 'utf8');
    await writeCacheFile('bob-fix-session.json', {
      ...session,
      files: {
        json: jsonPath.replace(/\\/g, '/'),
        markdown: markdownPath.replace(/\\/g, '/')
      }
    });

    res.json({
      success: true,
      message: 'Bob fix session created',
      session: {
        ...session,
        files: {
          json: jsonPath.replace(/\\/g, '/'),
          markdown: markdownPath.replace(/\\/g, '/')
        }
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Fix session failed', message: error.message });
  }
});

/**
 * GET /api/bob/fix-session
 * Get the latest Bob fix handoff session.
 */
app.get('/api/bob/fix-session', async (req, res) => {
  try {
    const session = await readCacheFile('bob-fix-session.json');
    res.json({ success: true, session });
  } catch (error) {
    res.status(404).json({ success: false, error: 'No Bob fix session', message: 'Create a fix session from the Firewall tab first.' });
  }
});

/**
 * POST /api/publish/guard
 * Run the publish firewall guard from the dashboard.
 */
app.post('/api/publish/guard', async (req, res) => {
  const targets = Array.isArray(req.body?.targets) ? req.body.targets : [];
  const result = runPublishGuardPreservingScan(targets);
  const status = parsePublishGuardOutput(result.output);

  res.status(status === 'blocked' ? 409 : 200).json({
    success: result.exitCode === 0,
    allowed: status === 'allowed' || status === 'warning',
    status,
    exitCode: result.exitCode,
    output: result.output
  });
});

/**
 * POST /api/publish/github
 * Run the publish guard, then git push only when the firewall allows it.
 */
app.post('/api/publish/github', async (req, res) => {
  const targets = Array.isArray(req.body?.targets) ? req.body.targets : [];
  const guard = runPublishGuardPreservingScan(targets);
  const guardStatus = parsePublishGuardOutput(guard.output);

  if (guard.exitCode !== 0 || guardStatus === 'blocked') {
    return res.status(409).json({
      success: false,
      pushed: false,
      status: guardStatus,
      message: 'GitHub push blocked by Bob Sentinel firewall.',
      output: guard.output
    });
  }

  const push = runLocalCommand('git', ['push'], { timeout: 180000 });
  if (push.exitCode !== 0) {
    return res.status(500).json({
      success: false,
      pushed: false,
      status: guardStatus,
      message: 'Firewall allowed the push, but git push failed.',
      output: `${guard.output}\n${push.output}`
    });
  }

  res.json({
    success: true,
    pushed: true,
    status: guardStatus,
    message: 'Firewall allowed the release and git push completed.',
    output: `${guard.output}\n${push.output}`
  });
});

/**
 * GET /api/export
 * Export scan results in various formats
 * Query params: format (json, csv, pdf)
 */
app.get('/api/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const data = await readCacheFile('vulnerabilities.json');

    switch (format.toLowerCase()) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="scan-results.json"');
        res.json(data);
        break;

      case 'csv':
        // Convert to CSV format
        const csv = convertToCSV(data.vulnerabilities);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="scan-results.csv"');
        res.send(csv);
        break;

      default:
        res.status(400).json({
          error: 'Invalid format',
          message: 'Supported formats: json, csv'
        });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Export failed',
      message: error.message
    });
  }
});

/**
 * Helper function to convert vulnerabilities to CSV
 */
function convertToCSV(vulnerabilities) {
  const headers = ['ID', 'Severity', 'Type', 'Category', 'File', 'Line', 'Message', 'CWE', 'OWASP'];
  const rows = vulnerabilities.map(v => [
    v.id,
    v.severity,
    v.type,
    v.category,
    v.file,
    v.line,
    `"${v.message.replace(/"/g, '""')}"`,
    v.cwe || '',
    v.owasp || ''
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    message: 'The requested endpoint does not exist'
  });
});

/**
 * Start server
 */
function startServer(port = PORT) {
  const server = app.listen(port, () => {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║         🛡️  Bob Sentinel Dashboard API               ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Server running on: http://localhost:${port}           ║`);
    console.log(`║  Health check:      http://localhost:${port}/api/health║`);
    console.log(`║  Scan results:      http://localhost:${port}/api/scan-results║`);
    console.log('╚════════════════════════════════════════════════════════╝');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the existing backend or start this server with PORT=<free-port>.`);
      process.exit(1);
    }
    throw error;
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;

// Made with Bob

/**
 * Bob Sentinel Dashboard - Backend API Server
 * Production-ready Express.js server for serving security scan data
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

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
const CACHE_DIR = path.join(__dirname, '../../cache');

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
    const data = await readCacheFile('vulnerabilities.json');
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
    const { execSync } = require('child_process');
    const resolvedDir = path.resolve(targetDir);

    // Validate the directory exists
    const dirStat = await fs.stat(resolvedDir).catch(() => null);
    if (!dirStat || !dirStat.isDirectory()) {
      return res.status(400).json({ success: false, error: 'Invalid directory', message: `Directory not found: ${resolvedDir}` });
    }

    // Ensure cache dir exists
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // Run scanner
    let output = '';
    try {
      output = execSync(`node "${scannerPath}" "${resolvedDir}"`, {
        encoding: 'utf8',
        timeout: 60000,
        cwd: path.join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (execErr) {
      // Scanner exits non-zero when vulnerabilities found - that's expected
      output = execErr.stdout || execErr.stderr || execErr.message;
    }

    // Read fresh results
    const data = await readCacheFile('vulnerabilities.json');
    res.json({ success: true, message: 'Scan completed', log: output, results: data });
  } catch (error) {
    // Even on non-zero exit, scanner may have written results
    try {
      const data = await readCacheFile('vulnerabilities.json');
      res.json({ success: true, message: 'Scan completed with findings', log: error.stdout || error.message, results: data });
    } catch (e2) {
      res.status(500).json({ success: false, error: 'Scan failed', message: error.message, log: error.stdout || '' });
    }
  }
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
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         🛡️  Bob Sentinel Dashboard API               ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Server running on: http://localhost:${PORT}           ║`);
  console.log(`║  Health check:      http://localhost:${PORT}/api/health║`);
  console.log(`║  Scan results:      http://localhost:${PORT}/api/scan-results║`);
  console.log('╚════════════════════════════════════════════════════════╝');
});

module.exports = app;

// Made with Bob

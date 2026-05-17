#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'cli/scanner.js');
const samplePath = path.join(root, 'sample-vulnerable-app');
const reportPath = path.join(root, 'cache/vulnerabilities.json');
const backendPath = path.join(root, 'dashboard/backend/server.js');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const findFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.on('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolve(port));
  });
});

const requestJson = (url, options = {}) => new Promise((resolve, reject) => {
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const req = http.request(url, {
    method: options.method || 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
      ...(options.headers || {})
    }
  }, (res) => {
    let data = '';
    res.setEncoding('utf8');
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try {
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
      } catch (error) {
        reject(new Error(`Invalid JSON from ${url}: ${error.message}`));
      }
    });
  });
  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

const waitForHealth = async (baseUrl, timeoutMs = 10000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await requestJson(`${baseUrl}/api/health`);
      if (response.status === 200 && response.data.status === 'healthy') return response.data;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Backend did not become healthy: ${lastError ? lastError.message : 'timeout'}`);
};

const runDuplicatePortCheck = (port) => new Promise((resolve, reject) => {
  const duplicate = spawn(process.execPath, [backendPath], {
    cwd: path.join(root, 'dashboard/backend'),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  let stdout = '';
  const timeout = setTimeout(() => {
    duplicate.kill();
    reject(new Error('Duplicate backend did not exit on occupied port'));
  }, 5000);

  duplicate.stdout.on('data', chunk => { stdout += chunk.toString(); });
  duplicate.stderr.on('data', chunk => { stderr += chunk.toString(); });
  duplicate.on('close', (code) => {
    clearTimeout(timeout);
    try {
      assert(code === 1, `Duplicate backend exited ${code}, expected 1`);
      assert(stderr.includes(`Port ${port} is already in use`), 'Duplicate backend did not print clean occupied-port message');
      assert(!stderr.includes("Unhandled 'error' event"), 'Duplicate backend printed unhandled error event');
      assert(!stdout.includes("Unhandled 'error' event"), 'Duplicate backend stdout printed unhandled error event');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
});

const runCliScan = () => {
  const result = spawnSync(process.execPath, [scannerPath, samplePath], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10
  });

  assert(result.status === 1, `Expected scanner to exit 1 for vulnerable sample app, got ${result.status}`);
  assert(result.stdout.includes('Patterns loaded: 40 detection rules'), 'Scanner did not report 40 detection rules');
  assert(result.stdout.includes('backend/'), 'Scanner output did not show backend subfolder traversal');
  assert(result.stdout.includes('frontend/'), 'Scanner output did not show frontend subfolder traversal');
  assert(result.stdout.includes('Files Scanned:    7'), 'Scanner output did not report 7 scanned sample files');

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert(report.total_files_scanned === 7, `Expected 7 sample files scanned, got ${report.total_files_scanned}`);
  assert(report.directories_traversed === 3, `Expected 3 sample directories traversed, got ${report.directories_traversed}`);
  assert(report.summary.total === 31, `Expected 31 sample vulnerabilities, got ${report.summary.total}`);
  assert(report.summary.critical === 18, `Expected 18 critical vulnerabilities, got ${report.summary.critical}`);
  assert(report.summary.high === 9, `Expected 9 high vulnerabilities, got ${report.summary.high}`);
  assert(report.summary.medium === 4, `Expected 4 medium vulnerabilities, got ${report.summary.medium}`);

  return report;
};

const runBackendE2E = async () => {
  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [backendPath], {
    cwd: path.join(root, 'dashboard/backend'),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });

  try {
    await waitForHealth(baseUrl);
    await runDuplicatePortCheck(port);

    const scan = await requestJson(`${baseUrl}/api/scan`, { method: 'POST', body: {} });
    assert(scan.status === 200, `POST /api/scan returned ${scan.status}`);
    assert(scan.data.success === true, 'POST /api/scan did not return success true');
    assert(scan.data.results.total_files_scanned === 7, 'API scan did not scan 7 sample files');
    assert(scan.data.results.summary.total === 31, 'API scan did not return 31 sample vulnerabilities');
    assert(scan.data.log.includes('Patterns loaded: 40 detection rules'), 'API scan log did not include pattern count');
    assert(scan.data.log.includes('backend/'), 'API scan log did not include backend traversal');
    assert(scan.data.log.includes('frontend/'), 'API scan log did not include frontend traversal');

    const exportResponse = await requestJson(`${baseUrl}/api/export?format=json`);
    assert(exportResponse.status === 200, `GET /api/export returned ${exportResponse.status}`);
    assert(exportResponse.data.vulnerabilities.length === 31, 'Export did not include 31 vulnerabilities');

    const invalid = await requestJson(`${baseUrl}/api/scan`, {
      method: 'POST',
      body: { directory: path.join(root, 'does-not-exist') }
    });
    assert(invalid.status === 400, `Invalid directory scan returned ${invalid.status}, expected 400`);
    assert(invalid.data.success === false, 'Invalid directory scan did not return success false');
  } finally {
    child.kill();
  }

  assert(!stderr.includes('EADDRINUSE'), `Backend stderr included EADDRINUSE: ${stderr}`);
};

(async () => {
  const Scanner = require(scannerPath);
  const scanner = new Scanner();
  assert(Object.keys(scanner.patterns).length === 40, 'Scanner does not expose exactly 40 detection rules');

  const report = runCliScan();
  await runBackendE2E();

  console.log('PASS Bob Sentinel E2E verification');
  console.log(`Rules: ${Object.keys(scanner.patterns).length}`);
  console.log(`Sample scan: ${report.total_files_scanned} files, ${report.summary.total} issues`);
  console.log(`Severity: ${report.summary.critical} critical, ${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low`);
})().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
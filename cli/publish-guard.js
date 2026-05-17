#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCANNER = path.join(ROOT, 'cli/scanner.js');
const REPORT = path.join(ROOT, 'cache/vulnerabilities.json');

const DEFAULT_TARGETS = [
  'cli',
  'lib',
  'dashboard/backend',
  'dashboard/frontend/src'
];

function getTargets(argv) {
  const explicitTargets = argv.filter(arg => !arg.startsWith('-'));
  if (explicitTargets.length > 0) return explicitTargets;

  if (process.env.BOB_SENTINEL_TARGETS) {
    return process.env.BOB_SENTINEL_TARGETS.split(/[;,]/).map(item => item.trim()).filter(Boolean);
  }

  return DEFAULT_TARGETS;
}

function toDisplayPath(targetPath) {
  return path.relative(ROOT, targetPath).replace(/\\/g, '/') || '.';
}

function loadReport() {
  if (!fs.existsSync(REPORT)) {
    throw new Error('scanner did not produce cache/vulnerabilities.json');
  }
  return JSON.parse(fs.readFileSync(REPORT, 'utf8'));
}

function runScan(target) {
  const targetPath = path.resolve(ROOT, target);
  if (!fs.existsSync(targetPath)) {
    return {
      target: toDisplayPath(targetPath),
      missing: true,
      action: 'SKIP',
      status: 'missing',
      files: 0,
      total: 0,
      critical: 0,
      high: 0,
      reasons: [`target does not exist: ${targetPath}`]
    };
  }

  const result = spawnSync(process.execPath, [SCANNER, targetPath], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20
  });

  if (result.error) throw result.error;

  const report = loadReport();
  const firewall = report.firewall || { action: 'ALLOW', status: 'allowed', reasons: [] };
  return {
    target: toDisplayPath(targetPath),
    exitCode: result.status,
    action: firewall.action,
    status: firewall.status,
    files: report.total_files_scanned || 0,
    total: report.summary?.total || 0,
    critical: report.summary?.critical || 0,
    high: report.summary?.high || 0,
    reasons: firewall.reasons || []
  };
}

function printResult(result) {
  console.log(`  ${result.target}: ${result.files} files, ${result.total} issues, ${result.critical} critical, ${result.high} high, firewall ${result.action}`);
  result.reasons.slice(0, 3).forEach(reason => console.log(`    - ${reason}`));
}

function main() {
  const targets = getTargets(process.argv.slice(2));
  const results = [];

  console.log('');
  console.log('Bob Sentinel Publish Firewall');
  console.log('Scanning release targets before publish...');
  console.log('');

  for (const target of targets) {
    const result = runScan(target);
    results.push(result);
    printResult(result);
  }

  const blocked = results.filter(result => result.status === 'blocked');
  const warnings = results.filter(result => result.status === 'warning');
  const missing = results.filter(result => result.missing);

  console.log('');
  console.log(`Targets scanned: ${results.length - missing.length}`);
  console.log(`Blocked: ${blocked.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Missing: ${missing.length}`);
  console.log('');

  if (blocked.length > 0) {
    console.log('PUBLISH BLOCKED: Bob Sentinel firewall returned BLOCK. Fix the listed findings, rescan, then publish again.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('PUBLISH WARNING: no blocking rule fired, but review warnings before release.');
    process.exit(process.env.BOB_SENTINEL_BLOCK_ON_WARN === 'true' ? 1 : 0);
  }

  console.log('PUBLISH ALLOWED: firewall returned ALLOW for all scanned targets.');
  process.exit(0);
}

try {
  main();
} catch (error) {
  console.error(`PUBLISH GUARD FAILED: ${error.message}`);
  process.exit(2);
}
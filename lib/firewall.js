const DEFAULT_FIREWALL_POLICY = {
  name: 'Bob Sentinel Default Firewall',
  version: '1.0.0',
  mode: 'enforce',
  blockOnCritical: true,
  blockOnSecretLeak: true,
  blockOnExploitPath: true,
  minimumHealthScore: 50,
  highSeverityWarningThreshold: 1,
  mediumSeverityWarningThreshold: 10
};

const SECRET_TYPES = new Set([
  'hardcoded_aws_key',
  'hardcoded_aws_secret',
  'hardcoded_stripe_key',
  'hardcoded_api_key',
  'hardcoded_password',
  'hardcoded_jwt_secret',
  'hardcoded_private_key',
  'hardcoded_github_token',
  'hardcoded_secret',
  'hardcoded_connection_string'
]);

const EXPLOIT_PATH_TYPES = new Set([
  'sql_injection',
  'command_injection',
  'xss_vulnerability',
  'path_traversal',
  'ldap_injection',
  'xxe_vulnerability',
  'ssrf_vulnerability',
  'insecure_deserialization',
  'prototype_pollution',
  'missing_auth',
  'jwt_none_algorithm'
]);

function mergePolicy(policy = {}) {
  return { ...DEFAULT_FIREWALL_POLICY, ...policy };
}

function getSummary(report = {}) {
  const summary = report.summary || {};
  return {
    critical: Number(summary.critical || 0),
    high: Number(summary.high || 0),
    medium: Number(summary.medium || 0),
    low: Number(summary.low || 0),
    total: Number(summary.total || 0),
    healthScore: Number(summary.health_score ?? 100)
  };
}

function countByType(vulnerabilities, typeSet, severity = null) {
  return vulnerabilities.filter((vulnerability) => {
    const typeMatch = typeSet.has(vulnerability.type);
    const severityMatch = !severity || vulnerability.severity === severity;
    return typeMatch && severityMatch;
  }).length;
}

function uniqueFiles(vulnerabilities) {
  return Array.from(new Set(vulnerabilities.map(vulnerability => vulnerability.file))).sort();
}

function buildCheck(id, label, state, count, description) {
  return { id, label, state, count, description };
}

function evaluateFirewall(report = {}, policyOverrides = {}) {
  const policy = mergePolicy(policyOverrides);
  const vulnerabilities = Array.isArray(report.vulnerabilities) ? report.vulnerabilities : [];
  const summary = getSummary(report);
  const secretLeaks = countByType(vulnerabilities, SECRET_TYPES);
  const criticalSecrets = countByType(vulnerabilities, SECRET_TYPES, 'CRITICAL');
  const exploitPaths = countByType(vulnerabilities, EXPLOIT_PATH_TYPES);
  const criticalExploitPaths = countByType(vulnerabilities, EXPLOIT_PATH_TYPES, 'CRITICAL');

  const checks = [];
  const blockReasons = [];
  const warnReasons = [];

  if (policy.blockOnCritical && summary.critical > 0) {
    blockReasons.push(`${summary.critical} critical issue${summary.critical === 1 ? '' : 's'} found`);
  }
  checks.push(buildCheck(
    'critical-severity-gate',
    'Critical severity gate',
    summary.critical > 0 ? 'block' : 'pass',
    summary.critical,
    'Blocks release when any critical vulnerability is present.'
  ));

  if (policy.blockOnSecretLeak && criticalSecrets > 0) {
    blockReasons.push(`${criticalSecrets} critical secret leak${criticalSecrets === 1 ? '' : 's'} found`);
  } else if (secretLeaks > 0) {
    warnReasons.push(`${secretLeaks} possible secret exposure${secretLeaks === 1 ? '' : 's'} found`);
  }
  checks.push(buildCheck(
    'secret-leak-wall',
    'Secret leak wall',
    criticalSecrets > 0 ? 'block' : secretLeaks > 0 ? 'warn' : 'pass',
    secretLeaks,
    'Stops live keys, tokens, passwords, private keys, and connection strings from leaving the machine.'
  ));

  if (policy.blockOnExploitPath && criticalExploitPaths > 0) {
    blockReasons.push(`${criticalExploitPaths} critical exploitable code path${criticalExploitPaths === 1 ? '' : 's'} found`);
  } else if (exploitPaths > 0) {
    warnReasons.push(`${exploitPaths} exploitable code path${exploitPaths === 1 ? '' : 's'} should be reviewed`);
  }
  checks.push(buildCheck(
    'exploit-path-filter',
    'Exploit path filter',
    criticalExploitPaths > 0 ? 'block' : exploitPaths > 0 ? 'warn' : 'pass',
    exploitPaths,
    'Catches injection, traversal, SSRF, auth bypass, unsafe JWT, and deserialization paths.'
  ));

  if (summary.healthScore < policy.minimumHealthScore) {
    blockReasons.push(`health score ${summary.healthScore}/100 is below firewall floor ${policy.minimumHealthScore}/100`);
  }
  checks.push(buildCheck(
    'health-score-floor',
    'Health score floor',
    summary.healthScore < policy.minimumHealthScore ? 'block' : 'pass',
    summary.healthScore,
    'Blocks very risky scans even when individual issue severities are mixed.'
  ));

  if (summary.high >= policy.highSeverityWarningThreshold && summary.high > 0) {
    warnReasons.push(`${summary.high} high severity issue${summary.high === 1 ? '' : 's'} found`);
  }
  checks.push(buildCheck(
    'high-severity-review',
    'High severity review',
    summary.high > 0 ? 'warn' : 'pass',
    summary.high,
    'Flags high severity issues for review before shipping.'
  ));

  if (summary.medium >= policy.mediumSeverityWarningThreshold && summary.medium > 0) {
    warnReasons.push(`${summary.medium} medium severity issues exceed review threshold`);
  }
  checks.push(buildCheck(
    'medium-severity-threshold',
    'Medium severity threshold',
    summary.medium >= policy.mediumSeverityWarningThreshold ? 'warn' : 'pass',
    summary.medium,
    'Warns when medium issues accumulate into meaningful release risk.'
  ));

  const status = blockReasons.length > 0 ? 'blocked' : warnReasons.length > 0 ? 'warning' : 'allowed';
  const action = status === 'blocked' ? 'BLOCK' : status === 'warning' ? 'WARN' : 'ALLOW';
  const enforced = policy.mode === 'enforce' && status === 'blocked';

  return {
    status,
    action,
    enforced,
    mode: policy.mode,
    policy: {
      name: policy.name,
      version: policy.version,
      blockOnCritical: policy.blockOnCritical,
      blockOnSecretLeak: policy.blockOnSecretLeak,
      blockOnExploitPath: policy.blockOnExploitPath,
      minimumHealthScore: policy.minimumHealthScore,
      highSeverityWarningThreshold: policy.highSeverityWarningThreshold,
      mediumSeverityWarningThreshold: policy.mediumSeverityWarningThreshold
    },
    reasons: status === 'blocked' ? blockReasons : warnReasons,
    checks,
    affectedFiles: uniqueFiles(vulnerabilities).slice(0, 10),
    nextSteps: status === 'blocked'
      ? ['Fix critical findings first', 'Rotate any exposed secrets', 'Rescan the same folder', 'Push only after the firewall returns ALLOW or accepted WARN']
      : status === 'warning'
        ? ['Review high severity findings', 'Export the report for tracking', 'Rescan after fixes']
        : ['No blocking risks found', 'Keep the pre-push hook enabled'],
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = {
  DEFAULT_FIREWALL_POLICY,
  evaluateFirewall
};
import { useState } from 'react';
import API_BASE from '../api';
import './FirewallPanel.css';

const STATUS_COPY = {
  blocked: {
    title: 'Firewall Blocking',
    subtitle: 'This scan cannot pass the release gate until blocking findings are fixed.',
    tone: 'blocked'
  },
  warning: {
    title: 'Firewall Warning',
    subtitle: 'No hard block is active, but risky findings should be reviewed before shipping.',
    tone: 'warning'
  },
  allowed: {
    title: 'Firewall Clear',
    subtitle: 'No blocking or warning conditions are active for this scan.',
    tone: 'allowed'
  }
};

function FirewallPanel({ data, onRescan, scanning }) {
  const firewall = data?.firewall;
  const [workflowBusy, setWorkflowBusy] = useState('');
  const [workflowResult, setWorkflowResult] = useState(null);

  const callWorkflow = async (action, endpoint) => {
    try {
      setWorkflowBusy(action);
      setWorkflowResult(null);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      setWorkflowResult({ action, ok: response.ok, ...result });
    } catch (error) {
      setWorkflowResult({ action, ok: false, success: false, message: error.message });
    } finally {
      setWorkflowBusy('');
    }
  };

  const copyPrompt = async () => {
    const prompt = workflowResult?.session?.prompt;
    if (!prompt || !navigator.clipboard) return;
    await navigator.clipboard.writeText(prompt);
    setWorkflowResult({ ...workflowResult, copied: true });
  };

  if (!firewall) {
    return (
      <div className="firewall-empty">
        <div className="firewall-empty-icon">F</div>
        <h3>No Firewall Decision</h3>
        <p>Run a scan to evaluate the folder against the Bob Sentinel firewall policy.</p>
        <button className="action-btn" onClick={onRescan} disabled={scanning}>{scanning ? 'Scanning...' : 'Run Scan'}</button>
      </div>
    );
  }

  const copy = STATUS_COPY[firewall.status] || STATUS_COPY.warning;

  return (
    <div className="firewall-panel">
      <section className={`firewall-hero ${copy.tone}`}>
        <div>
          <div className="firewall-eyebrow">Code & Secret Firewall</div>
          <h2>{copy.title}</h2>
          <p>{copy.subtitle}</p>
        </div>
        <div className="firewall-action">
          <span>{firewall.action}</span>
          <small>{firewall.mode} mode</small>
        </div>
      </section>

      <section className="firewall-section workflow">
        <div className="firewall-title">Bob Sync & Publish</div>
        <div className="workflow-actions">
          <button className="action-btn" onClick={() => callWorkflow('bob-fix', '/bob/fix-session')} disabled={!!workflowBusy}>
            {workflowBusy === 'bob-fix' ? 'Syncing...' : 'Send Fixes to Bob'}
          </button>
          <button className="action-btn secondary" onClick={() => callWorkflow('guard', '/publish/guard')} disabled={!!workflowBusy}>
            {workflowBusy === 'guard' ? 'Checking...' : 'Run Publish Guard'}
          </button>
          <button className="action-btn secondary" onClick={() => callWorkflow('push', '/publish/github')} disabled={!!workflowBusy}>
            {workflowBusy === 'push' ? 'Pushing...' : 'Push to GitHub'}
          </button>
          <button className="action-btn secondary" onClick={onRescan} disabled={scanning || !!workflowBusy}>
            {scanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>

        {workflowResult && (
          <div className={`workflow-result ${workflowResult.ok || workflowResult.success ? 'ok' : 'fail'}`}>
            <div className="workflow-result-top">
              <strong>{workflowResult.message || (workflowResult.status ? `Firewall ${workflowResult.status}` : 'Workflow result')}</strong>
              {workflowResult.session?.files?.markdown && <span>{workflowResult.session.files.markdown}</span>}
            </div>
            {workflowResult.session?.prompt && (
              <div className="workflow-prompt">
                <button className="action-btn small secondary" onClick={copyPrompt}>{workflowResult.copied ? 'Copied' : 'Copy Bob Prompt'}</button>
                <pre>{workflowResult.session.prompt}</pre>
              </div>
            )}
            {workflowResult.output && <pre className="workflow-output">{workflowResult.output}</pre>}
          </div>
        )}
      </section>

      <div className="firewall-grid">
        <section className="firewall-section">
          <div className="firewall-title">Policy Logic</div>
          <div className="policy-list">
            <div><span>Critical gate</span><strong>{firewall.policy.blockOnCritical ? 'Block' : 'Monitor'}</strong></div>
            <div><span>Secret leaks</span><strong>{firewall.policy.blockOnSecretLeak ? 'Block' : 'Monitor'}</strong></div>
            <div><span>Exploit paths</span><strong>{firewall.policy.blockOnExploitPath ? 'Block' : 'Monitor'}</strong></div>
            <div><span>Health floor</span><strong>{firewall.policy.minimumHealthScore}/100</strong></div>
          </div>
        </section>

        <section className="firewall-section">
          <div className="firewall-title">Decision Reasons</div>
          {firewall.reasons.length > 0 ? (
            <ul className="firewall-list">
              {firewall.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          ) : (
            <p className="firewall-muted">All firewall checks passed.</p>
          )}
        </section>
      </div>

      <section className="firewall-section checks">
        <div className="firewall-title">Checks</div>
        <div className="check-grid">
          {firewall.checks.map((check) => (
            <article className={`check-card ${check.state}`} key={check.id}>
              <div className="check-top">
                <span>{check.label}</span>
                <strong>{check.state}</strong>
              </div>
              <div className="check-count">{check.count}</div>
              <p>{check.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="firewall-grid">
        <section className="firewall-section">
          <div className="firewall-title">Next Steps</div>
          <ul className="firewall-list">
            {firewall.nextSteps.map((step) => <li key={step}>{step}</li>)}
          </ul>
        </section>

        <section className="firewall-section">
          <div className="firewall-title">Affected Files</div>
          {firewall.affectedFiles.length > 0 ? (
            <div className="affected-files">
              {firewall.affectedFiles.map((file) => <span key={file} title={file}>{file.split(/[/\\]/).slice(-2).join('/')}</span>)}
            </div>
          ) : (
            <p className="firewall-muted">No affected files.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default FirewallPanel;
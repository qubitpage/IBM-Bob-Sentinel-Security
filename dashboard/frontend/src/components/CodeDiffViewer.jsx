import './CodeDiffViewer.css';

function CodeDiffViewer({ vulnerability, onBack }) {
  if (!vulnerability) return null;

  const fix = vulnerability.fix || {};
  const steps = fix.steps || ['Replace the vulnerable code with the secure version shown above.'];
  const resources = fix.resources || [];

  return (
    <div className="cdv">
      <button className="cdv-back" onClick={onBack}>&larr; Back to Issues</button>

      <div className="cdv-header">
        <span className={`vf-sev ${vulnerability.severity.toLowerCase()}`}>{vulnerability.severity}</span>
        <h2 className="cdv-title">{vulnerability.message}</h2>
      </div>

      <div className="cdv-location">
        <code>{vulnerability.file}</code> &mdash; Line {vulnerability.line}
      </div>

      {/* Code Comparison */}
      <div className="cdv-panels">
        <div className="cdv-panel bad">
          <div className="cdv-panel-hdr">Vulnerable Code</div>
          <pre><code>{vulnerability.code || 'N/A'}</code></pre>
        </div>
        <div className="cdv-panel good">
          <div className="cdv-panel-hdr">Secure Code</div>
          <pre><code>{fix.code || '// Apply recommended fix'}</code></pre>
        </div>
      </div>

      {/* Explanation */}
      {fix.explanation && (
        <div className="cdv-explain">
          <strong>Why is this a problem?</strong>
          <p>{fix.explanation}</p>
        </div>
      )}

      {/* Steps */}
      <div className="cdv-steps">
        <strong>Fix Steps:</strong>
        <ol>
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>

      {/* Resources */}
      {resources.length > 0 && (
        <div className="cdv-resources">
          <strong>Learn More:</strong>
          <ul>
            {resources.map((r, i) => (
              <li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title || r.url}</a></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CodeDiffViewer;

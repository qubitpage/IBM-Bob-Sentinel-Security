import { useMemo } from 'react';
import './Dashboard.css';

const CATEGORY_LABELS = {
  secrets: 'Hardcoded Secrets',
  injection: 'Injection Flaws',
  auth: 'Auth Issues',
  config: 'Configuration',
  crypto: 'Weak Crypto',
  exposure: 'Data Exposure'
};

function Dashboard({ data }) {
  const severities = useMemo(() => {
    if (!data?.summary) return [];
    const s = data.summary;
    const total = s.total || 1;
    return [
      { key: 'critical', label: 'Critical', count: s.critical, pct: Math.round((s.critical/total)*100), desc: 'Immediate action required. Severe security risks.' },
      { key: 'high', label: 'High', count: s.high, pct: Math.round((s.high/total)*100), desc: 'Fix before deployment. Significant concerns.' },
      { key: 'medium', label: 'Medium', count: s.medium, pct: Math.round((s.medium/total)*100), desc: 'Should be addressed. Moderate risk.' },
      { key: 'low', label: 'Low', count: s.low, pct: Math.round((s.low/total)*100), desc: 'Best practice improvements.' },
    ];
  }, [data]);

  const categories = useMemo(() => {
    if (!data?.summary?.categories) return [];
    const total = data.summary.total || 1;
    return Object.entries(data.summary.categories)
      .map(([name, count]) => ({ name, label: CATEGORY_LABELS[name] || name, count, pct: Math.round((count/total)*100) }))
      .sort((a,b) => b.count - a.count);
  }, [data]);

  const fileGroups = useMemo(() => {
    if (!data?.vulnerabilities) return [];
    const map = {};
    data.vulnerabilities.forEach(v => {
      const short = v.file.split(/[/\\]/).slice(-2).join('/');
      if (!map[short]) map[short] = { file: short, full: v.file, count: 0, critical: 0, high: 0 };
      map[short].count++;
      if (v.severity === 'CRITICAL') map[short].critical++;
      if (v.severity === 'HIGH') map[short].high++;
    });
    return Object.values(map).sort((a,b) => b.count - a.count).slice(0, 8);
  }, [data]);

  if (!data) return null;

  return (
    <div className="dash">
      {/* Severity Cards */}
      <div className="sev-grid">
        {severities.map(s => (
          <div className={`sev-card ${s.key}`} key={s.key}>
            <div className="sev-top">
              <span className="sev-label">{s.label}</span>
              <span className="sev-count">{s.count}</span>
            </div>
            <div className="sev-bar-track"><div className={`sev-bar-fill ${s.key}`} style={{width:`${s.pct}%`}}></div></div>
            <div className="sev-desc">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="dash-cols">
        {/* Categories */}
        <div className="dash-card">
          <div className="dash-card-title">Issues by Category</div>
          {categories.map(c => (
            <div className="cat-row" key={c.name}>
              <span className="cat-name">{c.label}</span>
              <div className="cat-bar-track"><div className="cat-bar-fill" style={{width:`${c.pct}%`}}></div></div>
              <span className="cat-count">{c.count}</span>
            </div>
          ))}
        </div>

        {/* Affected Files */}
        <div className="dash-card">
          <div className="dash-card-title">Most Affected Files</div>
          {fileGroups.map(f => (
            <div className="file-row" key={f.file}>
              <span className="file-name" title={f.full}>{f.file}</span>
              <div className="file-badges">
                {f.critical > 0 && <span className="file-badge critical">{f.critical}C</span>}
                {f.high > 0 && <span className="file-badge high">{f.high}H</span>}
                <span className="file-total">{f.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="summary-row">
        <div className="sum-item"><div className="sum-val">{data.summary.total}</div><div className="sum-lbl">Total Issues</div></div>
        <div className="sum-item"><div className="sum-val">{data.summary.files_with_issues}</div><div className="sum-lbl">Files Affected</div></div>
        <div className="sum-item"><div className="sum-val">{data.total_files_scanned}</div><div className="sum-lbl">Files Scanned</div></div>
        <div className="sum-item"><div className="sum-val">{data.scan_duration_ms}ms</div><div className="sum-lbl">Scan Duration</div></div>
      </div>
    </div>
  );
}

export default Dashboard;

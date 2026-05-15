import { useMemo } from 'react';
import './HealthScore.css';

function HealthScore({ data }) {
  const { score, status, color } = useMemo(() => {
    if (!data?.summary) return { score: 0, status: 'unknown', color: '#888' };
    const s = data.summary.health_score;
    if (s >= 80) return { score: s, status: 'Healthy', color: '#16a34a' };
    if (s >= 50) return { score: s, status: 'Warning', color: '#d97706' };
    return { score: s, status: 'Critical', color: '#dc2626' };
  }, [data]);

  if (!data?.summary) return null;

  const pct = score / 100;
  const circ = 2 * Math.PI * 40;
  const offset = circ - pct * circ;

  return (
    <div className="health-widget">
      <div className="health-ring-wrap">
        <svg viewBox="0 0 100 100" className="health-ring">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e5ea" strokeWidth="6" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 50 50)" style={{transition:'stroke-dashoffset .8s ease'}} />
        </svg>
        <div className="health-ring-text">
          <div className="health-num" style={{color}}>{score}</div>
          <div className="health-label">/100</div>
        </div>
      </div>
      <div className="health-status" style={{color}}>{status}</div>
      <div className="health-breakdown">
        {[
          { label: 'Critical', count: data.summary.critical, cls: 'critical' },
          { label: 'High', count: data.summary.high, cls: 'high' },
          { label: 'Medium', count: data.summary.medium, cls: 'medium' },
          { label: 'Low', count: data.summary.low, cls: 'low' },
        ].map(b => (
          <div className="hb-row" key={b.cls}>
            <span className={`hb-dot ${b.cls}`}></span>
            <span className="hb-name">{b.label}</span>
            <span className="hb-count">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HealthScore;

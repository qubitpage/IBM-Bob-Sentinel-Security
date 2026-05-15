import { useMemo } from 'react';
import './HealthScore.css';

/**
 * HealthScore Component
 * Displays repository health score with visual indicator
 * 
 * Features:
 * - Circular progress indicator
 * - Color-coded status (red < 50, yellow 50-80, green > 80)
 * - Breakdown by severity
 * - Status message
 * 
 * Health Score Calculation:
 * - Base score: 100
 * - Critical: -20 points each
 * - High: -10 points each
 * - Medium: -5 points each
 * - Low: -2 points each
 * - Minimum: 0, Maximum: 100
 */
function HealthScore({ data }) {
  /**
   * Calculate health status based on score
   */
  const healthStatus = useMemo(() => {
    if (!data || !data.summary) return null;

    const score = data.summary.health_score;
    
    if (score >= 80) {
      return {
        status: 'healthy',
        color: '#10b981',
        icon: '✓',
        message: 'Repository is in good health',
        description: 'Few security issues detected. Keep up the good work!'
      };
    } else if (score >= 50) {
      return {
        status: 'warning',
        color: '#f59e0b',
        icon: '⚠',
        message: 'Repository needs attention',
        description: 'Several security issues found. Address high-priority items.'
      };
    } else {
      return {
        status: 'critical',
        color: '#ef4444',
        icon: '✗',
        message: 'Repository has critical issues',
        description: 'Immediate action required! Multiple severe vulnerabilities detected.'
      };
    }
  }, [data]);

  /**
   * Calculate circle progress
   */
  const circleProgress = useMemo(() => {
    if (!data || !data.summary) return 0;
    
    const score = data.summary.health_score;
    const circumference = 2 * Math.PI * 54; // radius = 54
    const progress = circumference - (score / 100) * circumference;
    
    return progress;
  }, [data]);

  if (!data || !data.summary) {
    return (
      <div className="health-score">
        <div className="health-score-loading">Loading...</div>
      </div>
    );
  }

  const score = data.summary.health_score;

  return (
    <div className="health-score">
      <h3>Repository Health</h3>
      
      {/* Circular Progress */}
      <div className="health-circle-container">
        <svg className="health-circle" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            className="health-circle-bg"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          
          {/* Progress circle */}
          <circle
            className="health-circle-progress"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={healthStatus.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={circleProgress}
            transform="rotate(-90 60 60)"
          />
        </svg>
        
        {/* Score display */}
        <div className="health-score-value">
          <div className="score-number">{score}</div>
          <div className="score-max">/100</div>
        </div>
      </div>

      {/* Status */}
      <div className={`health-status ${healthStatus.status}`}>
        <div className="status-icon">{healthStatus.icon}</div>
        <div className="status-text">
          <div className="status-message">{healthStatus.message}</div>
          <div className="status-description">{healthStatus.description}</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="health-breakdown">
        <h4>Issue Breakdown</h4>
        
        <div className="breakdown-item critical">
          <span className="breakdown-label">
            <span className="breakdown-dot"></span>
            Critical
          </span>
          <span className="breakdown-value">{data.summary.critical}</span>
        </div>

        <div className="breakdown-item high">
          <span className="breakdown-label">
            <span className="breakdown-dot"></span>
            High
          </span>
          <span className="breakdown-value">{data.summary.high}</span>
        </div>

        <div className="breakdown-item medium">
          <span className="breakdown-label">
            <span className="breakdown-dot"></span>
            Medium
          </span>
          <span className="breakdown-value">{data.summary.medium}</span>
        </div>

        <div className="breakdown-item low">
          <span className="breakdown-label">
            <span className="breakdown-dot"></span>
            Low
          </span>
          <span className="breakdown-value">{data.summary.low}</span>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="health-recommendations">
          <h4>Top Recommendations</h4>
          <ul>
            {data.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default HealthScore;

// Made with Bob

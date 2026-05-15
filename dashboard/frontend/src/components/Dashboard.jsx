import { useMemo } from 'react';
import './Dashboard.css';

/**
 * Dashboard Component
 * Displays overview statistics and severity breakdown
 * 
 * Features:
 * - Severity distribution chart
 * - Category breakdown
 * - Recent scan information
 * - Quick action buttons
 */
function Dashboard({ data }) {
  /**
   * Calculate severity percentages for visualization
   */
  const severityStats = useMemo(() => {
    if (!data || !data.summary) return null;

    const total = data.summary.total;
    if (total === 0) return null;

    return {
      critical: {
        count: data.summary.critical,
        percentage: Math.round((data.summary.critical / total) * 100)
      },
      high: {
        count: data.summary.high,
        percentage: Math.round((data.summary.high / total) * 100)
      },
      medium: {
        count: data.summary.medium,
        percentage: Math.round((data.summary.medium / total) * 100)
      },
      low: {
        count: data.summary.low,
        percentage: Math.round((data.summary.low / total) * 100)
      }
    };
  }, [data]);

  /**
   * Get category statistics
   */
  const categoryStats = useMemo(() => {
    if (!data || !data.summary || !data.summary.categories) return [];

    return Object.entries(data.summary.categories).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / data.summary.total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [data]);

  if (!data) {
    return <div className="dashboard">No data available</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Security Overview</h2>
        <p className="scan-info">
          Scanned {data.total_files_scanned} files in {data.scan_duration_ms}ms
        </p>
      </div>

      {/* Severity Breakdown */}
      <div className="severity-section">
        <h3>Severity Distribution</h3>
        
        {severityStats && (
          <div className="severity-grid">
            {/* Critical */}
            <div className="severity-card critical">
              <div className="severity-header">
                <span className="severity-icon">🔴</span>
                <span className="severity-label">Critical</span>
              </div>
              <div className="severity-count">{severityStats.critical.count}</div>
              <div className="severity-bar">
                <div 
                  className="severity-bar-fill critical"
                  style={{ width: `${severityStats.critical.percentage}%` }}
                ></div>
              </div>
              <div className="severity-percentage">{severityStats.critical.percentage}%</div>
              <div className="severity-description">
                Immediate action required. These issues pose severe security risks.
              </div>
            </div>

            {/* High */}
            <div className="severity-card high">
              <div className="severity-header">
                <span className="severity-icon">🟠</span>
                <span className="severity-label">High</span>
              </div>
              <div className="severity-count">{severityStats.high.count}</div>
              <div className="severity-bar">
                <div 
                  className="severity-bar-fill high"
                  style={{ width: `${severityStats.high.percentage}%` }}
                ></div>
              </div>
              <div className="severity-percentage">{severityStats.high.percentage}%</div>
              <div className="severity-description">
                Fix before deployment. Significant security concerns.
              </div>
            </div>

            {/* Medium */}
            <div className="severity-card medium">
              <div className="severity-header">
                <span className="severity-icon">🟡</span>
                <span className="severity-label">Medium</span>
              </div>
              <div className="severity-count">{severityStats.medium.count}</div>
              <div className="severity-bar">
                <div 
                  className="severity-bar-fill medium"
                  style={{ width: `${severityStats.medium.percentage}%` }}
                ></div>
              </div>
              <div className="severity-percentage">{severityStats.medium.percentage}%</div>
              <div className="severity-description">
                Should be addressed. Moderate security issues.
              </div>
            </div>

            {/* Low */}
            <div className="severity-card low">
              <div className="severity-header">
                <span className="severity-icon">🟢</span>
                <span className="severity-label">Low</span>
              </div>
              <div className="severity-count">{severityStats.low.count}</div>
              <div className="severity-bar">
                <div 
                  className="severity-bar-fill low"
                  style={{ width: `${severityStats.low.percentage}%` }}
                ></div>
              </div>
              <div className="severity-percentage">{severityStats.low.percentage}%</div>
              <div className="severity-description">
                Best practice improvements. Minor concerns.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="category-section">
        <h3>Issues by Category</h3>
        <div className="category-list">
          {categoryStats.map(cat => (
            <div key={cat.name} className="category-item">
              <div className="category-info">
                <span className="category-icon">{getCategoryIcon(cat.name)}</span>
                <span className="category-name">{formatCategoryName(cat.name)}</span>
              </div>
              <div className="category-stats">
                <span className="category-count">{cat.count}</span>
                <div className="category-bar">
                  <div 
                    className="category-bar-fill"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-section">
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-value">{data.summary.total}</div>
            <div className="summary-label">Total Issues Found</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📁</div>
          <div className="summary-content">
            <div className="summary-value">{data.summary.files_with_issues}</div>
            <div className="summary-label">Files with Issues</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⏱️</div>
          <div className="summary-content">
            <div className="summary-value">{data.scan_duration_ms}ms</div>
            <div className="summary-label">Scan Duration</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get icon for category
 */
function getCategoryIcon(category) {
  const icons = {
    secrets: '🔑',
    injection: '💉',
    auth: '🔐',
    config: '⚙️',
    crypto: '🔒',
    exposure: '👁️'
  };
  return icons[category] || '📌';
}

/**
 * Format category name for display
 */
function formatCategoryName(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default Dashboard;

// Made with Bob

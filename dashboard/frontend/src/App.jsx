import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import VulnerabilityFeed from './components/VulnerabilityFeed';
import CodeDiffViewer from './components/CodeDiffViewer';
import HealthScore from './components/HealthScore';
import './App.css';

/**
 * Main Application Component
 * Bob Sentinel Security Dashboard
 */
function App() {
  const [scanData, setScanData] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ severity: '', category: '' });

  const API_BASE = 'http://localhost:3000/api';

  /**
   * Fetch scan results on component mount
   */
  useEffect(() => {
    fetchScanResults();
  }, []);

  /**
   * Fetch scan results from API
   */
  const fetchScanResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/scan-results`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scan results');
      }
      
      const data = await response.json();
      setScanData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching scan results:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle vulnerability selection
   */
  const handleSelectVulnerability = (vuln) => {
    setSelectedVuln(vuln);
  };

  /**
   * Handle back to list
   */
  const handleBackToList = () => {
    setSelectedVuln(null);
  };

  /**
   * Apply filters
   */
  const getFilteredVulnerabilities = () => {
    if (!scanData) return [];
    
    let filtered = scanData.vulnerabilities;
    
    if (filter.severity) {
      filtered = filtered.filter(v => v.severity === filter.severity);
    }
    
    if (filter.category) {
      filtered = filtered.filter(v => v.category === filter.category);
    }
    
    return filtered;
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading scan results...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="app error">
        <div className="error-container">
          <h2>⚠️ Error Loading Scan Results</h2>
          <p>{error}</p>
          <button onClick={fetchScanResults} className="btn-retry">
            Retry
          </button>
          <div className="error-help">
            <h3>Troubleshooting:</h3>
            <ul>
              <li>Make sure the backend server is running on port 3000</li>
              <li>Run: <code>cd dashboard/backend && npm start</code></li>
              <li>Ensure scan results exist: <code>node cli/scanner.js sample-vulnerable-app</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render main dashboard
   */
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🛡️</span>
            <div className="logo-text">
              <h1>Bob Sentinel</h1>
              <p className="tagline">Pre-Flight Security Scanner</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={fetchScanResults} 
              className="btn-refresh"
              title="Refresh scan results"
            >
              🔄 Refresh
            </button>
            <a 
              href={`${API_BASE}/export?format=json`}
              download="scan-results.json"
              className="btn-export"
              title="Export results"
            >
              📥 Export
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Sidebar */}
        <aside className="sidebar">
          <HealthScore data={scanData} />
          
          <div className="quick-stats">
            <h3>Quick Stats</h3>
            <div className="stat-item">
              <span className="stat-label">Files Scanned</span>
              <span className="stat-value">{scanData.total_files_scanned}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Issues</span>
              <span className="stat-value">{scanData.summary.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Files Affected</span>
              <span className="stat-value">{scanData.summary.files_with_issues}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Scan Duration</span>
              <span className="stat-value">{scanData.scan_duration_ms}ms</span>
            </div>
          </div>

          {/* Filters */}
          <div className="filters">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>Severity</label>
              <select 
                value={filter.severity} 
                onChange={(e) => setFilter({...filter, severity: e.target.value})}
              >
                <option value="">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Category</label>
              <select 
                value={filter.category} 
                onChange={(e) => setFilter({...filter, category: e.target.value})}
              >
                <option value="">All</option>
                <option value="secrets">Secrets</option>
                <option value="injection">Injection</option>
                <option value="auth">Authentication</option>
                <option value="config">Configuration</option>
                <option value="crypto">Cryptography</option>
              </select>
            </div>

            {(filter.severity || filter.category) && (
              <button 
                onClick={() => setFilter({ severity: '', category: '' })}
                className="btn-clear-filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <section className="content">
          {selectedVuln ? (
            <CodeDiffViewer 
              vulnerability={selectedVuln} 
              onBack={handleBackToList}
            />
          ) : (
            <>
              <Dashboard data={scanData} />
              <VulnerabilityFeed 
                vulnerabilities={getFilteredVulnerabilities()}
                onSelect={handleSelectVulnerability}
                filter={filter}
              />
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Last scan: {new Date(scanData.scan_timestamp).toLocaleString()} | 
          Repository: {scanData.repository}
        </p>
      </footer>
    </div>
  );
}

export default App;

// Made with Bob

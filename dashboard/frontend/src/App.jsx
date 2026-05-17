import { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import VulnerabilityFeed from './components/VulnerabilityFeed';
import CodeDiffViewer from './components/CodeDiffViewer';
import HealthScore from './components/HealthScore';
import FolderBrowser from './components/FolderBrowser';
import FirewallPanel from './components/FirewallPanel';
import API_BASE from './api';
import './App.css';

function App() {
  const [scanData, setScanData] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ severity: '', category: '' });
  const [scanDir, setScanDir] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showBrowser, setShowBrowser] = useState(false);

  const fetchScanResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/scan-results`);
      if (!response.ok) throw new Error('No scan results found. Run a scan first.');
      const data = await response.json();
      setScanData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScanResults(); }, [fetchScanResults]);

  const runScan = async () => {
    try {
      setScanning(true);
      setScanLog('Starting scan...\n');
      setShowLog(true);
      setActiveTab('log');
      const body = scanDir ? { directory: scanDir } : {};
      const response = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        setScanLog(data.log || 'Scan completed successfully.');
        setScanData(data.results);
        setError(null);
      } else {
        setScanLog(`Error: ${data.message}\n${data.log || ''}`);
      }
    } catch (err) {
      setScanLog(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const getFilteredVulnerabilities = () => {
    if (!scanData) return [];
    let filtered = scanData.vulnerabilities;
    if (filter.severity) filtered = filtered.filter(v => v.severity === filter.severity);
    if (filter.category) filtered = filtered.filter(v => v.category === filter.category);
    return filtered;
  };

  const severityCounts = scanData ? {
    CRITICAL: scanData.summary?.critical || 0,
    HIGH: scanData.summary?.high || 0,
    MEDIUM: scanData.summary?.medium || 0,
    LOW: scanData.summary?.low || 0,
  } : {};

  if (selectedVuln) {
    return (
      <div className="app">
        <CodeDiffViewer vulnerability={selectedVuln} onBack={() => setSelectedVuln(null)} />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <div className="brand-icon">S</div>
            <div>
              <div className="brand-name">Bob Sentinel</div>
              <div className="brand-sub">Security Scanner</div>
            </div>
          </div>
        </div>
        <div className="topbar-center">
          <div className="scan-bar">
            <button className="browse-btn" onClick={() => setShowBrowser(!showBrowser)} title="Browse folders">
              {showBrowser ? '✕' : '📁'}
            </button>
            <input
              type="text"
              className="scan-input"
              placeholder="Directory to scan (leave empty for sample app)..."
              value={scanDir}
              onChange={e => setScanDir(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !scanning && runScan()}
            />
            <button className="scan-btn" onClick={runScan} disabled={scanning}>
              {scanning ? 'Scanning...' : 'Run Scan'}
            </button>
          </div>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" onClick={fetchScanResults} title="Refresh results">
            Refresh
          </button>
          <a href={`${API_BASE}/export?format=json`} download className="icon-btn" title="Export JSON">
            Export
          </a>
        </div>
      </header>

      <div className="layout">
        {showBrowser && (
          <FolderBrowser
            onSelect={(dir) => { setScanDir(dir); setShowBrowser(false); }}
            onClose={() => setShowBrowser(false)}
          />
        )}
        {/* Sidebar */}
        <aside className="sidebar">
          {scanData && <HealthScore data={scanData} />}

          {scanData && (
            <div className="sidebar-card">
              <div className="card-title">Quick Stats</div>
              <div className="stat-row"><span>Files Scanned</span><span className="stat-num">{scanData.total_files_scanned}</span></div>
              <div className="stat-row"><span>Total Issues</span><span className="stat-num">{scanData.summary.total}</span></div>
              <div className="stat-row"><span>Files Affected</span><span className="stat-num">{scanData.summary.files_with_issues}</span></div>
              <div className="stat-row"><span>Scan Time</span><span className="stat-num">{scanData.scan_duration_ms}ms</span></div>
            </div>
          )}

          {scanData?.firewall && (
            <div className={`sidebar-card firewall-status ${scanData.firewall.status}`}>
              <div className="card-title">Firewall</div>
              <div className="firewall-side-action">{scanData.firewall.action}</div>
              <div className="firewall-side-text">{scanData.firewall.reasons[0] || 'All checks passed'}</div>
            </div>
          )}

          <div className="sidebar-card">
            <div className="card-title">Filters</div>
            <label className="filter-label">Severity</label>
            <div className="filter-pills">
              {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
                <button key={s} className={`pill ${s.toLowerCase()} ${filter.severity === s ? 'active' : ''}`}
                  onClick={() => setFilter({...filter, severity: filter.severity === s ? '' : s})}>
                  {s} {severityCounts[s] !== undefined ? `(${severityCounts[s]})` : ''}
                </button>
              ))}
            </div>
            <label className="filter-label" style={{marginTop: 12}}>Category</label>
            <select className="filter-select" value={filter.category}
              onChange={e => setFilter({...filter, category: e.target.value})}>
              <option value="">All Categories</option>
              <option value="secrets">Secrets</option>
              <option value="injection">Injection</option>
              <option value="auth">Authentication</option>
              <option value="config">Configuration</option>
              <option value="crypto">Cryptography</option>
            </select>
            {(filter.severity || filter.category) && (
              <button className="clear-btn" onClick={() => setFilter({severity:'',category:''})}>Clear Filters</button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`tab ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>
              Issues {scanData ? `(${scanData.summary.total})` : ''}
            </button>
            <button className={`tab ${activeTab === 'firewall' ? 'active' : ''}`} onClick={() => setActiveTab('firewall')}>
              Firewall {scanData?.firewall ? `(${scanData.firewall.action})` : ''}
            </button>
            <button className={`tab ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>
              Scan Log {scanLog ? '*' : ''}
            </button>
          </div>

          {loading && !scanData ? (
            <div className="empty-state">
              <div className="spinner"></div>
              <p>Loading scan results...</p>
            </div>
          ) : error && !scanData ? (
            <div className="empty-state">
              <div className="empty-icon">!</div>
              <h3>No Scan Results</h3>
              <p>{error}</p>
              <p style={{color:'var(--text-muted)', marginTop: 8}}>Click "Run Scan" above to scan the sample vulnerable app, or enter a directory path.</p>
              <button className="action-btn" onClick={runScan} style={{marginTop: 16}}>Run First Scan</button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && scanData && <Dashboard data={scanData} />}
              {activeTab === 'issues' && scanData && (
                <VulnerabilityFeed
                  vulnerabilities={getFilteredVulnerabilities()}
                  onSelect={setSelectedVuln}
                  filter={filter}
                />
              )}
              {activeTab === 'firewall' && (
                <FirewallPanel data={scanData} onRescan={runScan} scanning={scanning} />
              )}
              {activeTab === 'log' && (
                <div className="log-panel">
                  <div className="log-header">
                    <span>Scan Output</span>
                    <div>
                      <button className="action-btn small" onClick={runScan} disabled={scanning}>
                        {scanning ? 'Scanning...' : 'Rescan'}
                      </button>
                      <button className="action-btn small secondary" onClick={() => setScanLog('')} style={{marginLeft: 8}}>Clear</button>
                    </div>
                  </div>
                  <pre className="log-output">{scanLog || 'No scan log yet. Click "Run Scan" to start.'}</pre>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {scanData && (
        <footer className="app-footer">
          Last scan: {new Date(scanData.scan_timestamp).toLocaleString()} | {scanData.repository}
        </footer>
      )}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import './FolderBrowser.css';

function FolderBrowser({ onSelect, onClose }) {
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:3000/api';

  const browse = async (dir) => {
    setLoading(true);
    setError('');
    try {
      const url = dir ? `${API_BASE}/browse?dir=${encodeURIComponent(dir)}` : `${API_BASE}/browse`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        setError(data.message || data.error);
      } else {
        setFolders(data.folders || []);
        setCurrentPath(data.current || '');
        setParentPath(data.parent || '');
      }
    } catch (e) {
      setError('Failed to browse: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { browse(); }, []);

  return (
    <div className="folder-browser-overlay">
      <div className="folder-browser">
        <div className="fb-header">
          <h3>Select Folder to Scan</h3>
          <button className="fb-close" onClick={onClose}>&times;</button>
        </div>

        <div className="fb-path">
          <span className="fb-path-label">Current:</span>
          <span className="fb-path-value">{currentPath}</span>
        </div>

        <div className="fb-actions">
          <button className="fb-btn" onClick={() => browse(parentPath)} disabled={!parentPath || parentPath === currentPath}>
            ⬆ Parent
          </button>
          <button className="fb-btn primary" onClick={() => onSelect(currentPath)}>
            ✓ Scan This Folder
          </button>
        </div>

        {error && <div className="fb-error">{error}</div>}

        <div className="fb-list">
          {loading ? (
            <div className="fb-loading">Loading...</div>
          ) : folders.length === 0 ? (
            <div className="fb-empty">No subfolders</div>
          ) : (
            folders.map(f => (
              <div key={f.path} className="fb-item" onClick={() => browse(f.path)}>
                <span className="fb-icon">📁</span>
                <span className="fb-name">{f.name}</span>
                <button className="fb-scan-btn" onClick={e => { e.stopPropagation(); onSelect(f.path); }}>
                  Scan
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FolderBrowser;

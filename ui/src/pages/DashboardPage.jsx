import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiListDocuments, apiUploadDocument, removeToken } from '../api';
import './DashboardPage.css';

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const fetchDocs = async () => {
    try {
      const docs = await apiListDocuments();
      setDocuments(docs);
    } catch (err) {
      if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
        removeToken();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.');
      return;
    }
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);
    try {
      const res = await apiUploadDocument(file);
      setUploadSuccess(`"${file.name}" uploaded — ${res.chunks} chunks indexed.`);
      await fetchDocs();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const logout = () => { removeToken(); navigate('/login'); };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">DocMind</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </div>
        </nav>
        <button id="logout-btn" className="btn btn-ghost sidebar-logout" onClick={logout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log out
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>My Documents</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
              {loading ? 'Loading…' : `${documents.length} document${documents.length !== 1 ? 's' : ''} in your library`}
            </p>
          </div>
          <button id="open-file-picker" className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading
              ? <><span className="spinner" />Uploading…</>
              : <><UploadIcon />Upload PDF</>
            }
          </button>
          <input
            ref={fileRef}
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </header>

        {/* Upload feedback */}
        {uploadError   && <div className="error-msg" style={{ marginBottom: 16 }}><span>⚠</span>{uploadError}</div>}
        {uploadSuccess && <div className="success-msg" style={{ marginBottom: 16 }}>✓ {uploadSuccess}</div>}

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="drop-zone-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className="drop-zone-text">
            <strong>Click or drag &amp; drop</strong> a PDF here
          </p>
          <span className="badge badge-accent">PDF only</span>
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="docs-loading">
            {[1,2,3].map(i => <div key={i} className="doc-skeleton" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="docs-empty">
            <div className="docs-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p>No documents yet. Upload your first PDF to get started.</p>
          </div>
        ) : (
          <div className="docs-grid">
            {documents.map((doc) => (
              <button
                key={doc.document_id}
                id={`doc-${doc.document_id}`}
                className="doc-card"
                onClick={() => navigate(`/chat/${doc.document_id}`, { state: { filename: doc.filename } })}
              >
                <div className="doc-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div className="doc-card-body">
                  <span className="doc-card-name">{doc.filename}</span>
                  <span className="doc-card-meta">ID #{doc.document_id} · {formatDate(doc.created_at)}</span>
                </div>
                <div className="doc-card-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function formatDate(str) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return str; }
}

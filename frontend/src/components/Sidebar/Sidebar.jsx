import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bot, 
  UploadCloud, 
  FileText, 
  Trash2, 
  LogOut, 
  PlusCircle, 
  FolderArchive, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  X
} from 'lucide-react';

export default function Sidebar({
  documents = [],
  loadingDocs = false,
  onUpload,
  onDeleteDocument,
  onNewChat,
  sessions = [],
  loadingSessions = false,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const { email, logout } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus({ type: 'error', message: 'Only PDF documents are supported.' });
      setTimeout(() => setUploadStatus(null), 4000);
      return;
    }

    try {
      setUploading(true);
      setUploadStatus(null);
      await onUpload(file);
      setUploadStatus({ type: 'success', message: `${file.name} indexed successfully!` });
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={22} />
            </div>
            <div>
              <div className="brand-title">Knowledge AI</div>
              <div className="brand-subtitle">Hybrid RAG Assistant</div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              className="sidebar-mobile-close-btn"
              onClick={onCloseMobile}
              title="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Main Sidebar Actions & Content */}
        <div className="sidebar-content">
          <button
            className="new-chat-btn"
            onClick={onNewChat}
          >
            <PlusCircle size={18} />
            <span>New Chat Session</span>
          </button>

          {/* Chat History Section */}
          <div className="sidebar-section">
            <div className="section-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} />
                Recent Chats ({sessions.length})
              </span>
              {loadingSessions && (
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              )}
            </div>

            <div className="session-list">
              {loadingSessions && sessions.length === 0 ? (
                <div className="empty-docs">
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 4px auto' }} />
                  Loading history...
                </div>
              ) : sessions.length === 0 ? (
                <div className="empty-docs" style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                  No previous chats yet. Ask a question to start!
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.session_id}
                    className={`session-item ${sess.session_id === currentSessionId ? 'active' : ''}`}
                    onClick={() => onSelectSession && onSelectSession(sess.session_id)}
                    title={sess.title}
                  >
                    <div className="session-info">
                      <MessageSquare size={14} className="session-icon" />
                      <span className="session-title">{sess.title || 'Untitled Chat'}</span>
                    </div>
                    {onDeleteSession && (
                      <button
                        className="delete-session-btn"
                        title="Delete chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete this chat: "${sess.title}"?`)) {
                            onDeleteSession(sess.session_id);
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div>
            <div className="section-label">
              <span>Upload Document</span>
              {uploading && <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
            </div>

            <div
              className={`dropzone ${isDragging ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              />
              {uploading ? (
                <>
                  <Loader2 size={24} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                  <span className="dropzone-text">Embedding & Indexing PDF...</span>
                  <span className="dropzone-subtext">Generating vectors and BM25 tokens</span>
                </>
              ) : (
                <>
                  <UploadCloud size={26} className="dropzone-icon" />
                  <span className="dropzone-text">Drop PDF here or click</span>
                  <span className="dropzone-subtext">Supports vector & lexical search</span>
                </>
              )}
            </div>

            {uploadStatus && (
              <div
                className={uploadStatus.type === 'error' ? 'error-banner' : 'success-banner'}
                style={{ marginTop: '0.75rem' }}
              >
                {uploadStatus.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                <span style={{ fontSize: '0.78rem' }}>{uploadStatus.message}</span>
              </div>
            )}
          </div>

          {/* Documents Knowledge Base Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="section-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderArchive size={14} />
                Indexed Documents ({documents.length})
              </span>
            </div>

            <div className="doc-list" style={{ overflowY: 'auto', maxHeight: '280px' }}>
              {loadingDocs ? (
                <div className="empty-docs">
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto' }} />
                  Loading indexed files...
                </div>
              ) : documents.length === 0 ? (
                <div className="empty-docs">
                  No documents uploaded yet. Upload a PDF above to ask questions.
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div key={idx} className="doc-item">
                    <div className="doc-info" title={doc}>
                      <FileText size={16} className="doc-icon" />
                      <span className="doc-name">{doc}</span>
                    </div>
                    <button
                      className="delete-doc-btn"
                      title={`Delete ${doc}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete ${doc} from knowledge base?`)) {
                          onDeleteDocument(doc);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">
              {email ? email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <span className="user-email">{email || 'User'}</span>
              <span className="user-status">
                <span className="status-dot"></span>
                Connected
              </span>
            </div>
          </div>
          <button 
            className="logout-btn" 
            title="Logout" 
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={18} />
          </button>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="confirm-modal-overlay" 
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="confirm-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                color: 'var(--text-dim)',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Cancel"
            >
              <X size={18} />
            </button>

            <div className="confirm-header">
              <div className="confirm-icon-wrapper">
                <AlertTriangle size={22} />
              </div>
              <div className="confirm-title-group">
                <h3>Confirm Log Out</h3>
                <p>
                  Are you sure you want to log out? You will need to sign in again to access your documents and chat session.
                </p>
              </div>
            </div>

            <div className="confirm-actions">
              <button 
                className="confirm-btn-cancel" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn-danger" 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import AuthModal from './components/Auth/AuthModal';
import LandingPage from './components/Landing/LandingPage';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Auth Modal state for unauthenticated visitor triggers
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    mode: 'login',
  });

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Chat state
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fetch chat sessions from backend
  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingSessions(true);
      const res = await api.getSessions();
      if (res && res.sessions) {
        setSessions(res.sessions);
      }
    } catch (err) {
      console.error('Error loading chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, [isAuthenticated]);

  // Fetch documents from backend
  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingDocs(true);
      const res = await api.getDocuments();
      if (res && res.documents) {
        setDocuments(res.documents);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
      fetchSessions();
    }
  }, [isAuthenticated, fetchDocuments, fetchSessions]);

  // Document actions
  const handleUpload = async (file) => {
    await api.uploadDocument(file);
    await fetchDocuments();
  };

  const handleDeleteDocument = async (filename) => {
    try {
      await api.deleteDocument(filename);
      await fetchDocuments();
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  // Select a past conversation session
  const handleSelectSession = async (selSessionId) => {
    if (selSessionId === sessionId) return;
    try {
      setChatLoading(true);
      setSessionId(selSessionId);
      const res = await api.getSessionMessages(selSessionId);
      if (res && res.messages) {
        setMessages(
          res.messages.map((m) => ({
            role: m.role,
            content: m.content,
            sources: m.sources || [],
            timestamp: m.timestamp || new Date().toISOString(),
          }))
        );
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
      alert(`Failed to load chat history: ${err.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  // Delete a chat session
  const handleDeleteSession = async (delSessionId) => {
    try {
      await api.deleteSession(delSessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== delSessionId));
      if (delSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      alert(`Failed to delete chat session: ${err.message}`);
    }
  };

  // Chat actions
  const handleSendMessage = async (text) => {
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const response = await api.askQuestion(text, sessionId);
      const assistantMsg = {
        role: 'assistant',
        content: response.answer || 'No response returned.',
        sources: response.sources || [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Refresh chat sessions list to reflect updated order / new session title
      fetchSessions();
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to get answer from backend.'}`,
        sources: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([]);
  };

  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await api.clearHistory(sessionId);
      } catch (err) {
        console.error('Failed to clear backend history:', err);
      }
    }
    setMessages([]);
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading AI Knowledge Assistant...
      </div>
    );
  }

  // If user is not authenticated, show modern Landing / Home page with top-right Sign In / Register
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage 
          onOpenAuth={(mode = 'login') => setAuthModalConfig({ isOpen: true, mode })} 
        />
        <AuthModal 
          isOpen={authModalConfig.isOpen}
          initialTab={authModalConfig.mode}
          onClose={() => setAuthModalConfig({ isOpen: false, mode: 'login' })}
        />
      </>
    );
  }

  // Authenticated workspace view with light modern SaaS theme
  return (
    <div className="app-container workspace-theme">
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-mobile-backdrop" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Workspace layout */}
      <Sidebar
        documents={documents}
        loadingDocs={loadingDocs}
        onUpload={handleUpload}
        onDeleteDocument={handleDeleteDocument}
        onNewChat={() => {
          handleNewChat();
          setMobileSidebarOpen(false);
        }}
        sessions={sessions}
        loadingSessions={loadingSessions}
        currentSessionId={sessionId}
        onSelectSession={(id) => {
          handleSelectSession(id);
          setMobileSidebarOpen(false);
        }}
        onDeleteSession={handleDeleteSession}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <ChatArea
        messages={messages}
        loading={chatLoading}
        sessionId={sessionId}
        documentCount={documents.length}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />
    </div>
  );
}


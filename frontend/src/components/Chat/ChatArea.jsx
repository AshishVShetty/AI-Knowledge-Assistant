import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { 
  Sparkles, 
  Trash2, 
  Layers, 
  Zap, 
  MessageSquare, 
  BookOpen, 
  HelpCircle,
  FileCheck,
  Menu,
  ArrowRight
} from 'lucide-react';

const STARTER_PROMPTS = [
  {
    title: 'Executive Summary',
    prompt: 'Summarize the key takeaways and core findings of the uploaded document.',
    icon: BookOpen,
  },
  {
    title: 'Topics & Structure',
    prompt: 'What are the main topics, sections, and conclusions mentioned in this document?',
    icon: Layers,
  },
  {
    title: 'Key Action Items',
    prompt: 'List all important dates, deadlines, names, or actionable items.',
    icon: Zap,
  },
  {
    title: 'Concept Breakdown',
    prompt: 'Explain the key technical concepts and definitions in simple terms.',
    icon: HelpCircle,
  },
];

export default function ChatArea({
  messages = [],
  loading = false,
  sessionId,
  documentCount = 0,
  onSendMessage,
  onClearChat,
  onToggleMobileSidebar,
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <main className="main-chat-area">
      {/* Top Header */}
      <header className="chat-header">
        <div className="header-left">
          {onToggleMobileSidebar && (
            <button 
              className="mobile-menu-btn" 
              onClick={onToggleMobileSidebar}
              title="Toggle sidebar menu"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="header-title-group">
            <div className="header-badge">
              <Zap size={14} className="header-badge-icon" />
              <span>Session: {sessionId ? sessionId.slice(0, 14) : 'active'}</span>
            </div>

            <div className="header-doc-status">
              <FileCheck size={14} className={`header-doc-icon ${documentCount > 0 ? 'active' : ''}`} />
              <span>{documentCount} Document{documentCount === 1 ? '' : 's'} Indexed</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {messages.length > 0 && (
            <button className="clear-btn" onClick={onClearChat} title="Clear conversation history">
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Feed */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat-state">
            <div className="welcome-icon-glow">
              <Sparkles size={34} />
            </div>
            <h1 className="welcome-title">Ask your Knowledge Base</h1>
            <p className="welcome-desc">
              Upload PDF documents to query your private knowledge library with high-precision Hybrid RAG (Vector + BM25 + Gemini reranking).
            </p>

            <div className="starter-grid">
              {STARTER_PROMPTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    className="starter-card"
                    onClick={() => onSendMessage(item.prompt)}
                  >
                    <div className="starter-card-header">
                      <div className="starter-card-icon">
                        <IconComponent size={16} />
                      </div>
                      <span className="starter-card-title">{item.title}</span>
                      <ArrowRight size={14} className="starter-card-arrow" />
                    </div>
                    <p className="starter-card-prompt">{item.prompt}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}

            {loading && (
              <div className="message-row assistant">
                <div className="msg-avatar ai-avatar">
                  <Sparkles size={18} />
                </div>
                <div className="msg-bubble-container">
                  <div className="msg-bubble loading-bubble">
                    <div className="thinking-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                    <span className="thinking-text">
                      Searching hybrid vector & BM25 index...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Bottom Input */}
      <ChatInput onSendMessage={onSendMessage} disabled={loading} />
    </main>
  );
}

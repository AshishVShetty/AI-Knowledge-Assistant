import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <form className="chat-input-box" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your uploaded documents..."
          className="chat-textarea"
          disabled={disabled}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={disabled || !input.trim()}
          title="Send question (Enter)"
        >
          <Send size={18} />
        </button>
      </form>
      <div className="chat-input-footer-hint">
        <span>Hybrid Search (Vector + BM25)</span>
        <span>•</span>
        <span>Press <kbd className="input-kbd">Enter ↵</kbd> to send, <kbd className="input-kbd">Shift + Enter</kbd> for new line</span>
      </div>
    </div>
  );
}

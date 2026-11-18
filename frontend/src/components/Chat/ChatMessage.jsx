import React from 'react';
import { Bot, User } from 'lucide-react';
import SourceBadges from './SourceBadges';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`msg-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="msg-bubble-container">
        <div className="msg-sender-info">
          <span className="msg-sender-name">{isUser ? 'You' : 'Knowledge Assistant'}</span>
        </div>
        <div className="msg-bubble">
          {isUser ? (
            <p className="user-msg-text">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceBadges sources={message.sources} />
        )}
      </div>
    </div>
  );
}

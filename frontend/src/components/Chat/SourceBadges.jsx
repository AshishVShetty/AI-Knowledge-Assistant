import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function SourceBadges({ sources = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-card">
      <div className="sources-toggle" onClick={() => setExpanded(!expanded)}>
        <BookOpen size={14} />
        <span>
          Retrieved from {sources.length} document chunk{sources.length > 1 ? 's' : ''}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {expanded && (
        <div className="sources-list">
          {sources.map((source, index) => {
            const scorePercent = source.score ? Math.round(source.score * 100) : null;
            return (
              <div key={index} className="source-badge" title={`Chunk: ${source.chunk}`}>
                <FileText size={12} />
                <span>{source.file} (Chunk {source.chunk})</span>
                {scorePercent !== null && (
                  <span className="source-score" title="Relevance Score">
                    {scorePercent}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

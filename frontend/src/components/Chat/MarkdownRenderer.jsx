import React from 'react';

/**
 * Parses inline formatting:
 * - Bold: **text** or __text__
 * - Bold+Italic: ***text***
 * - Italic: *text* or _text_
 * - Inline Code: `code`
 * - Handles malformed asterisks like *Text:** gracefully
 */
function renderInlineFormatting(text) {
  if (!text) return null;

  // Clean up common malformed LLM patterns like "*Title:**" or "**Title:*" -> "**Title:**"
  let sanitized = text
    .replace(/^\*\s*\*\*/, '**')
    .replace(/^\*([A-Za-z0-9\s]+):\*\*/, '**$1:**')
    .replace(/^\*\*([A-Za-z0-9\s]+):\*/, '**$1:**');

  // Tokenize string for code, bold, italic
  const tokens = [];
  let remaining = sanitized;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Check for inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code key={`code-${keyIdx++}`} className="inline-code">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Check for bold-italic: ***text***
    const boldItalicMatch = remaining.match(/^\*\*\*([^\*]+)\*\*\*/);
    if (boldItalicMatch) {
      tokens.push(
        <strong key={`bi-${keyIdx++}`}>
          <em>{boldItalicMatch[1]}</em>
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Check for bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)([^\*\n_]+)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={`bold-${keyIdx++}`} className="bold-text">
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^\*\n_]+)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={`italic-${keyIdx++}`}>
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Plain text up to next special char (` or * or _)
    const nextSpecial = remaining.search(/[`*_]/);
    if (nextSpecial === -1) {
      // If any lingering isolated asterisk exists, remove it cleanly if it looks like a bullet or typo
      const cleanPlain = remaining.replace(/^\*\s*/, '');
      tokens.push(cleanPlain);
      break;
    } else if (nextSpecial === 0) {
      // Single orphan special character - consume it safely without rendering stray asterisk
      const char = remaining[0];
      if (char !== '*' && char !== '_') {
        tokens.push(char);
      }
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

/**
 * Parses block-level markdown:
 * - Headings (#, ##, ###, ####)
 * - Code blocks (```lang ... ```)
 * - Unordered lists (*, -, +)
 * - Ordered lists (1., 2.)
 * - Standalone headers like **Heading:**
 * - Paragraphs
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split into lines
  const rawLines = content.split('\n');
  const blocks = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }
  let currentCodeBlock = null; // { language: '', lines: [] }
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push({
          type: 'p',
          content: text,
        });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  const flushCodeBlock = () => {
    if (currentCodeBlock) {
      blocks.push(currentCodeBlock);
      currentCodeBlock = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Code blocks: ```
    if (trimmed.startsWith('```')) {
      if (currentCodeBlock) {
        flushCodeBlock();
      } else {
        flushParagraph();
        flushList();
        const lang = trimmed.slice(3).trim();
        currentCodeBlock = { type: 'codeblock', language: lang, lines: [] };
      }
      continue;
    }

    if (currentCodeBlock) {
      currentCodeBlock.lines.push(line);
      continue;
    }

    // 2. Empty line -> block separator
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // 3. Headings: ### Heading, ## Heading, # Heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      blocks.push({
        type: 'heading',
        level: level,
        content: headingMatch[2],
      });
      continue;
    }

    // 4. Standalone bold header line (e.g. "**Main Topics:**" or "*Main Topics:**" or "### **Title**")
    const boldHeaderMatch = trimmed.match(/^(\*{1,2}|__)(.+?)(:\*{1,2}|__\*?|\*{1,2})$/);
    if (boldHeaderMatch && !trimmed.startsWith('* ') && !trimmed.startsWith('- ')) {
      flushParagraph();
      flushList();
      const headerTitle = boldHeaderMatch[2].replace(/:$/, '').trim();
      blocks.push({
        type: 'section_header',
        content: headerTitle + (boldHeaderMatch[3].includes(':') ? ':' : ''),
      });
      continue;
    }

    // 5. Unordered List Items: * item, - item, + item, * **Title:** item
    const ulMatch = trimmed.match(/^[\*\-\+]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // 6. Ordered List Items: 1. item, 2. item
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // 7. Regular text line
    if (currentList) {
      // If line is indented or continues list item
      if (line.startsWith('  ') || line.startsWith('\t')) {
        const lastIdx = currentList.items.length - 1;
        if (lastIdx >= 0) {
          currentList.items[lastIdx] += ' ' + trimmed;
          continue;
        }
      }
      flushList();
    }

    currentParagraph.push(trimmed);
  }

  // Final flush
  flushParagraph();
  flushList();
  flushCodeBlock();

  return (
    <div className="markdown-content">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          const Tag = `h${Math.min(block.level + 2, 6)}`;
          return (
            <Tag key={idx} className={`md-heading md-h${block.level}`}>
              {renderInlineFormatting(block.content)}
            </Tag>
          );
        }

        if (block.type === 'section_header') {
          return (
            <div key={idx} className="md-section-header">
              {renderInlineFormatting(block.content)}
            </div>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={idx} className="md-ul">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="md-li">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx} className="md-ol">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="md-li">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'codeblock') {
          return (
            <pre key={idx} className="md-pre">
              <code className="md-code-block">{block.lines.join('\n')}</code>
            </pre>
          );
        }

        if (block.type === 'p') {
          return (
            <p key={idx} className="md-p">
              {renderInlineFormatting(block.content)}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}

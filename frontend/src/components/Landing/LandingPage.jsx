import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  FileText, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Database, 
  Layers, 
  CheckCircle,
  MessageSquare,
  BookOpen
} from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  return (
    <div className="landing-page-container">
      {/* Background ambient lighting */}
      <div className="ambient-glow">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      {/* Top Navbar */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-icon">
              <Bot size={22} />
            </div>
            <div>
              <div className="brand-title">Knowledge AI</div>
              <div className="brand-subtitle">Hybrid RAG Assistant</div>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#architecture" className="nav-link">Architecture</a>
          </nav>

          <div className="landing-auth-buttons">
            <button 
              className="landing-signin-btn"
              onClick={() => onOpenAuth('login')}
            >
              Sign In
            </button>
            <button 
              className="landing-register-btn"
              onClick={() => onOpenAuth('register')}
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">
          <Sparkles size={14} className="hero-badge-icon" />
          <span>Next-Generation Hybrid Retrieval-Augmented Generation</span>
        </div>

        <h1 className="hero-title">
          Chat with your documents using <br />
          <span className="gradient-text">Intelligent Hybrid AI</span>
        </h1>

        <p className="hero-subtitle">
          Upload PDFs, index them with dual dense vector embeddings and BM25 lexical search, 
          and receive factual, cited responses in real-time.
        </p>

        <div className="hero-cta-group">
          <button 
            className="hero-primary-btn"
            onClick={() => onOpenAuth('register')}
          >
            <span>Create Free Account</span>
            <ArrowRight size={18} />
          </button>
          <button 
            className="hero-secondary-btn"
            onClick={() => onOpenAuth('login')}
          >
            <span>Sign In to Workspace</span>
          </button>
        </div>

        {/* Visual Mockup / Interactive Preview */}
        <div className="hero-preview-wrapper">
          <div className="preview-glow"></div>
          <div className="preview-card">
            {/* Window bar */}
            <div className="preview-card-header">
              <div className="window-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="preview-header-title">
                <Bot size={14} />
                <span>Knowledge AI Workspace — Hybrid Search Active</span>
              </div>
              <div style={{ width: '48px' }}></div>
            </div>

            {/* Chat preview body */}
            <div className="preview-body">
              {/* User message */}
              <div className="preview-msg user">
                <div className="preview-avatar user-av">You</div>
                <div className="preview-bubble user-bubble">
                  What are the primary performance advantages of combining BM25 lexical search with dense vector embeddings?
                </div>
              </div>

              {/* Assistant message */}
              <div className="preview-msg assistant">
                <div className="preview-avatar ai-av">AI</div>
                <div className="preview-bubble ai-bubble">
                  <p>
                    Combining <strong>BM25 lexical search</strong> with <strong>dense semantic embeddings</strong> provides two major advantages:
                  </p>
                  <ul className="preview-list">
                    <li><strong>Exact Keyword & Code Recall:</strong> BM25 accurately matches specific acronyms, identifiers, and technical terminology without vector distortion.</li>
                    <li><strong>Deep Conceptual Understanding:</strong> Vector embeddings capture synonyms, contextual nuance, and semantic intent even when phrasing differs.</li>
                  </ul>
                  <div className="preview-sources">
                    <span className="preview-source-pill">
                      <FileText size={12} /> RAG_Architecture_Overview.pdf (p. 4)
                    </span>
                    <span className="preview-source-pill">
                      <FileText size={12} /> Hybrid_Search_Benchmark.pdf (p. 12)
                    </span>
                    <span className="preview-match-pill">98.4% Match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-section">
        <div className="section-header-center">
          <span className="section-tag">CAPABILITIES</span>
          <h2 className="section-heading">Designed for precision, speed, and accuracy</h2>
          <p className="section-description">Everything you need to extract verified answers from complex PDF documents.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box primary">
              <Zap size={22} />
            </div>
            <h3>Hybrid RAG Retrieval</h3>
            <p>Combines Reciprocal Rank Fusion (RRF) with dense neural embeddings and lexical BM25 token matching.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box accent">
              <FileText size={22} />
            </div>
            <h3>Instant PDF Ingestion</h3>
            <p>Drag and drop multi-page PDFs. Our backend chunks, generates semantic tokens, and indexes within seconds.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box success">
              <CheckCircle size={22} />
            </div>
            <h3>Verifiable Source Citations</h3>
            <p>Every claim is backed by traceable source references, document names, and relevancy confidence scores.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box purple">
              <ShieldCheck size={22} />
            </div>
            <h3>Private & Isolated Sessions</h3>
            <p>Secure JWT authentication ensures your uploaded documents and conversations remain strictly private.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="landing-section">
        <div className="section-header-center">
          <span className="section-tag">SIMPLE WORKFLOW</span>
          <h2 className="section-heading">How Knowledge AI Works</h2>
          <p className="section-description">Go from raw documentation to instant answers in three simple steps.</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">
              <Database size={24} />
            </div>
            <h4>Upload PDF Documents</h4>
            <p>Drop your research papers, manuals, or financial statements into your secure library.</p>
          </div>

          <div className="step-divider">
            <ArrowRight size={20} />
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">
              <Layers size={24} />
            </div>
            <h4>Automatic Vector Indexing</h4>
            <p>Documents are split into optimal text chunks and embedded into high-dimensional vector spaces.</p>
          </div>

          <div className="step-divider">
            <ArrowRight size={20} />
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">
              <MessageSquare size={24} />
            </div>
            <h4>Ask & Discover</h4>
            <p>Prompt the assistant naturally and receive grounded summaries with precise source citations.</p>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="landing-section">
        <div className="section-header-center">
          <span className="section-tag">SYSTEM ARCHITECTURE</span>
          <h2 className="section-heading">Production-Grade Hybrid RAG Architecture</h2>
          <p className="section-description">
            A multi-stage pipeline combining neural semantic understanding with lexical precision,
            cross-encoder reranking, and grounded generative AI.
          </p>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="arch-pipeline-banner">
          <div className="pipeline-node">
            <span className="node-step">Input Layer</span>
            <span className="node-title">PDF Ingestion & OCR</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-node highlight">
            <span className="node-step">Dual Retrieval</span>
            <span className="node-title">ChromaDB + BM25</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-node">
            <span className="node-step">Refinement</span>
            <span className="node-title">Cross-Encoder Reranker</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-node accent">
            <span className="node-step">Synthesis</span>
            <span className="node-title">Gemini 2.5 Flash</span>
          </div>
        </div>

        {/* Architecture Grid */}
        <div className="architecture-grid">
          {/* Card 1 */}
          <div className="arch-card">
            <div className="arch-card-header">
              <div className="arch-icon-box blue">
                <FileText size={20} />
              </div>
              <div>
                <span className="arch-layer-label">Layer 01</span>
                <h3>Document Ingestion & OCR</h3>
              </div>
            </div>
            <p className="arch-card-desc">
              High-speed text extraction powered by PyMuPDF, with automatic OCR fallback via Tesseract for scanned PDFs, chunked with context-preserving overlaps.
            </p>
            <div className="arch-tags">
              <span className="arch-tag">PyMuPDF</span>
              <span className="arch-tag">Tesseract OCR</span>
              <span className="arch-tag">1000-char Chunks</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="arch-card">
            <div className="arch-card-header">
              <div className="arch-icon-box cyan">
                <Database size={20} />
              </div>
              <div>
                <span className="arch-layer-label">Layer 02</span>
                <h3>Dense Vector Embeddings</h3>
              </div>
            </div>
            <p className="arch-card-desc">
              Embeds text chunks into 384-dimensional dense semantic vectors using SentenceTransformer (all-MiniLM-L6-v2) stored in persistent ChromaDB collections.
            </p>
            <div className="arch-tags">
              <span className="arch-tag">ChromaDB</span>
              <span className="arch-tag">all-MiniLM-L6-v2</span>
              <span className="arch-tag">Cosine Similarity</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="arch-card">
            <div className="arch-card-header">
              <div className="arch-icon-box purple">
                <Search size={20} />
              </div>
              <div>
                <span className="arch-layer-label">Layer 03</span>
                <h3>Lexical BM25 Search</h3>
              </div>
            </div>
            <p className="arch-card-desc">
              Sparse probabilistic keyword matching via BM25Okapi, ensuring exact match precision for acronyms, technical IDs, and rare proper nouns.
            </p>
            <div className="arch-tags">
              <span className="arch-tag">BM25Okapi</span>
              <span className="arch-tag">TF-IDF Weighting</span>
              <span className="arch-tag">Per-User Isolation</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="arch-card">
            <div className="arch-card-header">
              <div className="arch-icon-box amber">
                <Layers size={20} />
              </div>
              <div>
                <span className="arch-layer-label">Layer 04</span>
                <h3>Cross-Encoder Reranker</h3>
              </div>
            </div>
            <p className="arch-card-desc">
              Fuses vector and keyword candidate results, scoring joint query-document interactions to filter out irrelevant chunks and rank true evidence at the top.
            </p>
            <div className="arch-tags">
              <span className="arch-tag">Cross-Encoder</span>
              <span className="arch-tag">Neural Scoring</span>
              <span className="arch-tag">Top-K Selection</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="arch-card">
            <div className="arch-card-header">
              <div className="arch-icon-box green">
                <Bot size={20} />
              </div>
              <div>
                <span className="arch-layer-label">Layer 05</span>
                <h3>Gemini 2.5 Flash Generation</h3>
              </div>
            </div>
            <p className="arch-card-desc">
              Synthesizes grounded responses with strict factuality guardrails, multi-turn conversation condensation, and verifiable citations back to the source chunks.
            </p>
            <div className="arch-tags">
              <span className="arch-tag">Gemini 2.5 Flash</span>
              <span className="arch-tag">Query Condensation</span>
              <span className="arch-tag">Source Attribution</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="arch-card">
            <div className="arch-card-header">
              <div className="arch-icon-box indigo">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="arch-layer-label">Layer 06</span>
                <h3>Security & Persistence</h3>
              </div>
            </div>
            <p className="arch-card-desc">
              Stateless JWT authentication, isolated multi-tenant namespaces, and ACID-compliant SQLite storage for chat sessions, messages, and users.
            </p>
            <div className="arch-tags">
              <span className="arch-tag">FastAPI</span>
              <span className="arch-tag">SQLite</span>
              <span className="arch-tag">JWT Auth</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-card">
          <div className="cta-content">
            <h2>Ready to transform how you read documents?</h2>
            <p>Sign in now or create an account to start indexing your PDF documents with AI.</p>
          </div>
          <div className="cta-actions">
            <button 
              className="landing-register-btn cta-btn-large"
              onClick={() => onOpenAuth('register')}
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </button>
            <button 
              className="landing-signin-btn"
              onClick={() => onOpenAuth('login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon" style={{ width: '28px', height: '28px' }}>
              <Bot size={16} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Knowledge AI Assistant</span>
          </div>
          <p className="footer-text">
            © {new Date().getFullYear()} AI Knowledge Assistant. Built with FastAPI, SQLite, and React.
          </p>
          <div className="footer-links">
            <button 
              onClick={() => onOpenAuth('login')} 
              style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => onOpenAuth('register')} 
              style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            >
              Register
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

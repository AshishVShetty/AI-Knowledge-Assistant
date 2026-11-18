# AI Knowledge Assistant (Hybrid RAG SaaS)

A production-grade, full-stack **Hybrid Retrieval-Augmented Generation (RAG)** application for querying and interacting with private PDF document libraries in real-time. Built with a **FastAPI** backend, **ChromaDB** vector database, **BM25** lexical indexing, **Google Gemini**, and a modern **React 19 + Vite** frontend.

---

## 🌟 Key Features

- **Hybrid RAG Pipeline**: Combines dense vector retrieval (`SentenceTransformers all-MiniLM-L6-v2`) with sparse keyword retrieval (`BM25Okapi`) for industry-standard precision and recall.
- **Context-Aware LLM Synthesis**: Powered by Google Gemini with conversational memory, source grounding, and fallback resilience.
- **Fine-Grained Source Citations**: Every answer includes document chunk badges, page metadata, and relevance percentage scores.
- **Robust PDF Processing**: Automatic text extraction via `pypdf`, chunk splitting with token overlap, and OCR readiness.
- **Persistent Chat Sessions**: Database-backed multi-session conversation history with seamless switching and session management.
- **Multi-User Security & JWT**: Complete authentication workflow (Registration, Login, JWT tokens with 7-day expiration, password visibility toggles, and multi-user data isolation).
- **Hybrid Design System**:
  - **Landing Page**: Futuristic dark theme with navy surfaces, glow effects, live interactive mockup, and interactive architecture explorer.
  - **Auth Modals & AI Workspace**: Clean, light SaaS workspace inspired by Linear, Notion, and ChatGPT with responsive mobile drawer navigation.

---

## 🏗️ Architecture & RAG Pipeline

```
[ User PDF Upload ] 
       │
       ▼
[ Text Extraction & Chunking ]
       ├─────────────────────────────────┐
       ▼                                 ▼
[ Dense Embeddings (ChromaDB) ]   [ Sparse Index (BM25) ]
       └────────────────┬────────────────┘
                        ▼
            [ Hybrid Search Retrieval ]
                        │
                        ▼
          [ Top Chunks & Context Window ]
                        │
                        ▼
          [ Gemini 1.5 Flash / Pro LLM ]
                        │
                        ▼
      [ Cited Answer + Source Badges + Score ]
```

---

## 💻 Tech Stack

### Backend
- **FastAPI**: Modern, high-performance web framework.
- **ChromaDB**: Embedded vector database for semantic similarity search.
- **Sentence-Transformers**: `all-MiniLM-L6-v2` dense vector embeddings.
- **Rank-BM25**: BM25Okapi lexical keyword search.
- **Google Generative AI**: Gemini LLM response synthesis.
- **SQLAlchemy & SQLite**: User accounts, sessions, and chat history.
- **JWT & Passlib**: Secure password hashing and token authentication.

### Frontend
- **React 19 & Vite**: Ultra-fast component rendering and HMR.
- **Lucide React**: Clean icons throughout the interface.
- **Custom CSS System**: Pure, responsive CSS design with no bloated framework dependencies.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- A [Google Gemini API Key](https://aistudio.google.com/)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and insert your GEMINI_API_KEY

# Run backend server
uvicorn main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` (Docs available at `http://localhost:8000/docs`).

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Frontend will be running at `http://localhost:5173`.

---

## 🔒 Environment Configuration (`backend/.env`)

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Database URL (Default SQLite)
DATABASE_URL=sqlite:///./knowledge_assistant.db
```

---

## 👤 Author

- **Ashish V Shetty** - [GitHub Profile](https://github.com/AshishVShetty)
- Email: [vshettyashish@gmail.com](mailto:vshettyashish@gmail.com)

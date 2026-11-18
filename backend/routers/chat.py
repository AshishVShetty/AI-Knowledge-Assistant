import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.chat_schema import ChatRequest

from services.vector_service import search, get_documents
from services.jwt_service import get_current_user
from models.user import User
from models.chat import ChatSession, ChatMessage
from config.db_session import get_db
from services.bm25_service import search as bm25_search
from services.reranker_service import rerank
from services.gemini_service import (
    generate_answer,
    condense_query
)
from services.memory_service import (
    add_message,
    get_history,
    clear_history
)

router = APIRouter()


@router.get("/sessions")
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all chat sessions belonging to the current user,
    ordered by most recently updated.
    """
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )

    return {
        "sessions": [
            {
                "session_id": s.session_id,
                "title": s.title,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in sessions
        ]
    }


@router.get("/sessions/{session_id}")
def get_session_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get message history for a specific session.
    """
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.session_id == session_id,
            ChatSession.user_id == current_user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = []
    for msg in session.messages:
        sources_list = []
        if msg.sources:
            try:
                sources_list = json.loads(msg.sources)
            except Exception:
                sources_list = []

        messages.append({
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "sources": sources_list,
            "timestamp": msg.created_at.isoformat() if msg.created_at else None,
        })

    return {
        "session_id": session.session_id,
        "title": session.title,
        "messages": messages
    }


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a chat session and all its messages.
    """
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.session_id == session_id,
            ChatSession.user_id == current_user.id
        )
        .first()
    )

    if session:
        db.delete(session)
        db.commit()

    clear_history(session_id)

    return {
        "message": f"Session {session_id} deleted successfully.",
        "session_id": session_id
    }


def _persist_turn(
    db: Session,
    user_id: int,
    session_id: str,
    question: str,
    answer: str,
    sources: list
):
    """
    Persist user question and assistant answer both to in-memory history
    and to SQLite database records.
    """
    add_message(session_id, "User", question)
    add_message(session_id, "Assistant", answer)

    try:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.session_id == session_id,
                ChatSession.user_id == user_id
            )
            .first()
        )

        if not session:
            clean_title = question.strip().replace("\n", " ")
            if len(clean_title) > 40:
                clean_title = clean_title[:37] + "..."
            session = ChatSession(
                session_id=session_id,
                user_id=user_id,
                title=clean_title or "New Chat",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(session)
            db.flush()

        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=question,
            sources="[]",
            created_at=datetime.utcnow()
        )
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=answer,
            sources=json.dumps(sources),
            created_at=datetime.utcnow()
        )
        session.updated_at = datetime.utcnow()
        db.add(user_msg)
        db.add(assistant_msg)
        db.commit()
    except Exception as db_err:
        db.rollback()
        print(f"[Warning] Failed to persist chat history to DB: {db_err}")


@router.post("/ask")
def ask_question(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ----------------------------------------------------
    # 1. Check if user has any active/uploaded documents
    # ----------------------------------------------------
    active_docs = get_documents(user_id=current_user.id)
    if not active_docs:
        no_doc_msg = (
            "You don't have any active documents in your knowledge base right now. "
            "Please upload a PDF document so I can answer questions based on its content."
        )
        _persist_turn(db, current_user.id, data.session_id, data.question, no_doc_msg, [])
        return {
            "question": data.question,
            "answer": no_doc_msg,
            "sources": []
        }

    # ----------------------------------------------------
    # 2. Conversation History
    # ----------------------------------------------------
    db_history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == data.session_id)
        .order_by(ChatMessage.id.desc())
        .limit(10)
        .all()
    )
    db_history.reverse()

    history = [
        {"role": "User" if m.role == "user" else "Assistant", "message": m.content}
        for m in db_history
    ]
    if not history:
        history = get_history(data.session_id)

    # ----------------------------------------------------
    # 3. Query Condensation / Contextualization
    # ----------------------------------------------------
    search_query = condense_query(data.question, history) if history else data.question

    print("\n===== QUERY PROCESSING =====")
    print(f"Original Question: {data.question}")
    print(f"Condensed Search Query: {search_query}")
    print(f"Session ID: {data.session_id}")
    print(f"Active Documents ({len(active_docs)}): {active_docs}")
    print(f"History Length: {len(history)} turns\n")

    # ----------------------------------------------------
    # 4. Search Active Documents (Vector + BM25)
    # ----------------------------------------------------
    vector_results = search(
        search_query,
        current_user.id,
        k=10
    )

    bm25_results = bm25_search(
        search_query,
        current_user.id,
        k=10
    )

    # If contextual query differs, also fetch chunks with original query to maximize recall
    if search_query.strip().lower() != data.question.strip().lower():
        extra_vector = search(data.question, current_user.id, k=5)
        extra_bm25 = bm25_search(data.question, current_user.id, k=5)
        vector_results = vector_results + extra_vector
        bm25_results = bm25_results + extra_bm25

    # Merge Results & Remove Duplicates
    results = vector_results + bm25_results
    unique_results = []
    seen = set()

    for chunk in results:
        key = (
            chunk.get("filename"),
            chunk.get("chunk")
        )
        if key not in seen:
            seen.add(key)
            unique_results.append(chunk)

    results = unique_results

    # ----------------------------------------------------
    # 5. Re-rank Results
    # ----------------------------------------------------
    results = rerank(
        search_query,
        results,
        top_k=5
    )

    # ----------------------------------------------------
    # 6. Check if Relevant Chunks Found in Documents
    # ----------------------------------------------------
    if not results:
        doc_names = ", ".join(active_docs)
        not_found_msg = (
            f"I couldn't find enough relevant information in your uploaded document(s) "
            f"({doc_names}) to answer this question."
        )
        _persist_turn(db, current_user.id, data.session_id, data.question, not_found_msg, [])
        return {
            "question": data.question,
            "answer": not_found_msg,
            "sources": []
        }

    # ----------------------------------------------------
    # 7. Build Context & Generate Answer
    # ----------------------------------------------------
    context = "\n\n".join(
        chunk["text"]
        for chunk in results
    )

    answer = generate_answer(
        data.question,
        context,
        history=history
    )

    # ----------------------------------------------------
    # 8. Collect Sources
    # ----------------------------------------------------
    sources = []
    added = set()

    for chunk in results:
        key = (
            chunk["filename"],
            chunk["chunk"]
        )
        if key not in added:
            added.add(key)
            sources.append(
                {
                    "file": chunk["filename"],
                    "chunk": chunk["chunk"],
                    "score": round(chunk.get("score", 0.0), 4)
                }
            )

    # ----------------------------------------------------
    # 9. Save Conversation to Memory & Database
    # ----------------------------------------------------
    _persist_turn(db, current_user.id, data.session_id, data.question, answer, sources)

    return {
        "question": data.question,
        "answer": answer,
        "sources": sources
    }


@router.delete("/history/{session_id}")
def clear_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Warning] Failed to delete chat messages from DB: {e}")

    clear_history(session_id)
    return {
        "message": f"Conversation history cleared for session {session_id}.",
        "session_id": session_id
    }
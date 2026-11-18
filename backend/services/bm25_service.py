import re
from rank_bm25 import BM25Okapi

# Store all chunks with metadata
documents = []

# Tokenized version
tokenized_documents = []

# BM25 model
bm25 = None


def _build_model():
    """
    Safely initialize BM25Okapi from current documents.
    """
    global bm25, tokenized_documents

    tokenized_documents = []
    for doc in documents:
        tokens = re.findall(r"\w+", doc.get("text", "").lower())
        # Ensure every document has at least one token to avoid ZeroDivisionError in rank_bm25
        if not tokens:
            tokens = ["empty"]
        tokenized_documents.append(tokens)

    if tokenized_documents and len(documents) > 0:
        try:
            bm25 = BM25Okapi(tokenized_documents)
        except Exception as e:
            print(f"[Warning] Failed to build BM25 model: {e}")
            bm25 = None
    else:
        bm25 = None


def add_documents(chunks):
    """
    Add newly uploaded chunks into BM25.
    """
    global documents

    # Clean existing chunks for this file & user to avoid duplicates on re-upload
    if chunks and len(chunks) > 0:
        fn = chunks[0].get("filename")
        uid = chunks[0].get("user_id")
        if fn and uid is not None:
            documents = [
                d for d in documents
                if not (d.get("filename") == fn and str(d.get("user_id")) == str(uid))
            ]

    documents.extend(
        doc
        for doc in chunks
        if "user_id" in doc
    )

    _build_model()


def search(query, user_id, k=5):
    """
    Search using BM25.
    Returns dictionaries containing:
    text, filename and chunk.
    """
    if bm25 is None or not documents:
        return []

    try:
        query_tokens = re.findall(r"\w+", query.lower())
        if not query_tokens:
            return []

        scores = bm25.get_scores(query_tokens)

        user_docs_scores = [
            (doc, score)
            for doc, score in zip(documents, scores)
            if str(doc.get("user_id")) == str(user_id) and score > 0
        ]

        user_docs_scores.sort(key=lambda x: x[1], reverse=True)

        return [
            {
                "text": doc["text"],
                "filename": doc["filename"],
                "chunk": doc["chunk"]
            }
            for doc, score in user_docs_scores[:k]
        ]
    except Exception as e:
        print(f"[Warning] BM25 search failed: {e}")
        return []


def delete_documents(filename, user_id):
    """
    Remove chunks belonging to a deleted file for a user
    and re-index the BM25 model.
    """
    global documents

    documents = [
        doc for doc in documents
        if not (doc.get("filename") == filename and str(doc.get("user_id")) == str(user_id))
    ]

    _build_model()


def rebuild_index(chunks):
    """
    Rebuild BM25 from all existing
    ChromaDB chunks at server startup.
    """
    global documents

    documents.clear()

    documents.extend(
        doc
        for doc in chunks
        if "user_id" in doc
    )

    _build_model()

    print(f"\nBM25 rebuilt with {len(documents)} chunks.\n")
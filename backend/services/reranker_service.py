# Global lazy-loaded CrossEncoder model
_reranker = None


def get_reranker():
    """
    Lazy-load CrossEncoder only when reranking is executed.
    This saves ~150MB of RAM during startup and ensures Render free tier
    does not hit OOM before opening its HTTP port.
    """
    global _reranker
    if _reranker is None:
        try:
            import torch
            torch.set_num_threads(1)
        except Exception:
            pass
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _reranker


class _LazyRerankerProxy:
    def predict(self, *args, **kwargs):
        return get_reranker().predict(*args, **kwargs)


reranker = _LazyRerankerProxy()


def rerank(
    question,
    chunks,
    top_k=5,
    min_score=-10.0
):
    """
    Re-rank retrieved chunks using a CrossEncoder.

    Parameters:
        question: User's question.
        chunks: Retrieved chunks from vector + BM25 search.
        top_k: Maximum number of chunks to return.
        min_score: Minimum CrossEncoder relevance score.

    Returns:
        Relevant chunks sorted from highest to lowest score.
    """

    if not chunks:
        return []

    try:
        # Create question-chunk pairs
        pairs = [
            (question, chunk["text"])
            for chunk in chunks
        ]

        # Predict CrossEncoder relevance scores
        scores = reranker.predict(pairs)

        ranked_chunks = []
        for chunk, score in zip(chunks, scores):
            chunk_with_score = chunk.copy()
            chunk_with_score["score"] = float(score)
            ranked_chunks.append(chunk_with_score)

        # Sort by highest relevance score
        ranked_chunks.sort(
            key=lambda x: x["score"],
            reverse=True
        )

        # Remove weakly relevant chunks
        filtered_chunks = [
            chunk
            for chunk in ranked_chunks
            if chunk["score"] >= min_score
        ]

        # Return only the best remaining chunks
        return filtered_chunks[:top_k] if filtered_chunks else ranked_chunks[:top_k]
    except Exception as e:
        print(f"[Warning] CrossEncoder reranking skipped or low-memory ({e}). Falling back to hybrid retrieval order.")
        return chunks[:top_k]
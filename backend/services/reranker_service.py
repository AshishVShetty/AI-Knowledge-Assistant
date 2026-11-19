# Global lazy-loaded CrossEncoder model
_reranker = None


def get_reranker():
    """
    Lazy-load CrossEncoder only when reranking is executed and PyTorch is present.
    """
    global _reranker
    if _reranker is None:
        try:
            import torch
            torch.set_num_threads(1)
            from sentence_transformers import CrossEncoder
            _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        except Exception as e:
            print(f"[Reranker] CrossEncoder not available or failed to load ({e}).")
            _reranker = False
    return _reranker if _reranker is not False else None


def _hybrid_fusion(chunks, top_k=5):
    """
    Fast, memory-safe hybrid fusion ranking.
    Combines dense vector proximity and sparse BM25 relevance score
    without requiring heavy PyTorch neural networks in RAM.
    """
    scored_chunks = []
    for chunk in chunks:
        c = chunk.copy()
        # ChromaDB cosine distance: 0 = identical, 1 = orthogonal, 2 = opposite
        dist = c.get("distance", 1.0)
        vector_sim = max(0.0, 1.0 - (dist / 2.0))
        bm25_score = c.get("bm25_score", 0.0)
        # Combined score with balanced weighting
        c["score"] = vector_sim + (0.05 * min(bm25_score, 10.0))
        scored_chunks.append(c)

    scored_chunks.sort(key=lambda x: x.get("score", 0.0), reverse=True)
    return scored_chunks[:top_k]


def rerank(
    question,
    chunks,
    top_k=5,
    min_score=-10.0
):
    """
    Re-rank retrieved chunks using CrossEncoder if available,
    or high-speed hybrid fusion if memory is constrained.
    """
    if not chunks:
        return []

    try:
        model = get_reranker()
        if model is not None:
            # Create question-chunk pairs
            pairs = [
                (question, chunk["text"])
                for chunk in chunks
            ]

            # Predict CrossEncoder relevance scores
            scores = model.predict(pairs)

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

            return filtered_chunks[:top_k] if filtered_chunks else ranked_chunks[:top_k]
    except Exception as e:
        print(f"[Warning] CrossEncoder reranking skipped ({e}). Using hybrid fusion.")

    return _hybrid_fusion(chunks, top_k)
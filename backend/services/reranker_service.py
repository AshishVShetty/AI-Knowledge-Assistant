from sentence_transformers import CrossEncoder


# Load the CrossEncoder model only once
reranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)


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

    # --------------------------------------------------
    # Create question-chunk pairs
    # --------------------------------------------------

    pairs = [
        (question, chunk["text"])
        for chunk in chunks
    ]

    # --------------------------------------------------
    # Predict CrossEncoder relevance scores
    # --------------------------------------------------

    scores = reranker.predict(pairs)

    # --------------------------------------------------
    # Attach scores to chunk dictionaries
    # --------------------------------------------------

    ranked_chunks = []

    for chunk, score in zip(chunks, scores):

        chunk_with_score = chunk.copy()

        chunk_with_score["score"] = float(score)

        ranked_chunks.append(
            chunk_with_score
        )

    # --------------------------------------------------
    # Sort by highest relevance score
    # --------------------------------------------------

    ranked_chunks.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    # --------------------------------------------------
    # Remove weakly relevant chunks
    # --------------------------------------------------

    filtered_chunks = [
        chunk
        for chunk in ranked_chunks
        if chunk["score"] >= min_score
    ]

    # --------------------------------------------------
    # Return only the best remaining chunks
    # --------------------------------------------------

    return filtered_chunks[:top_k]
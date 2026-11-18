from pathlib import Path
import uuid
import chromadb

# Global lazy-loaded embedding model to minimize RAM on server startup
_model = None


def get_embedding_model():
    """
    Lazy-load SentenceTransformer only when first needed.
    Keeps startup RSS memory low (<100MB) so cloud services
    (like Render 512MB free tier) bind the port and pass health checks instantly.
    """
    global _model
    if _model is None:
        try:
            import torch
            torch.set_num_threads(1)
        except Exception:
            pass
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


class _LazyModelProxy:
    """Proxy object so legacy model.encode(...) calls continue to work seamlessly."""
    def encode(self, *args, **kwargs):
        return get_embedding_model().encode(*args, **kwargs)


model = _LazyModelProxy()

# Create persistent ChromaDB client using absolute path inside backend
BASE_DIR = Path(__file__).resolve().parent.parent
CHROMA_DIR = (BASE_DIR / "chroma_db").as_posix()
client = chromadb.PersistentClient(path=CHROMA_DIR)

# Create or load collection
collection = client.get_or_create_collection(
    name="knowledge_base"
)


def create_embeddings(chunks, filename, user_id):

    if len(chunks) == 0:
        return False

    # Clean up any existing chunks of this file for this user first (handles re-upload cleanly)
    delete_document(filename, user_id=user_id)

    # Create embeddings
    embeddings = model.encode(chunks).tolist()

    # Generate unique IDs
    ids = [str(uuid.uuid4()) for _ in chunks]

    # Store in ChromaDB
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=[
            {
                "filename": filename,
                "user_id": user_id,
                "chunk": i + 1
            }
            for i in range(len(chunks))
        ]
    )

    return True


def search(query, user_id, k=5):

    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=k,
        where={"user_id": user_id},
        include=[
            "documents",
            "metadatas",
            "distances"
        ]
    )

    output = []

    if not results or not results["documents"] or len(results["documents"][0]) == 0:
        return []

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    for doc, meta, distance in zip(
        docs,
        metas,
        distances
    ):

        output.append(
            {
                "text": doc,
                "filename": meta["filename"],
                "chunk": meta["chunk"],
                "distance": distance
            }
        )

    return output


def get_documents(user_id=None):
    try:
        if user_id is not None:
            results = collection.get(
                where={"user_id": user_id},
                include=["metadatas"]
            )
        else:
            results = collection.get(
                include=["metadatas"]
            )

        filenames = set()

        if results and results.get("metadatas"):
            for metadata in results["metadatas"]:
                if metadata and "filename" in metadata:
                    filenames.add(metadata["filename"])

        return sorted(list(filenames))
    except Exception as e:
        print(f"Error getting documents: {e}")
        return []


def delete_document(filename, user_id=None):
    try:
        if user_id is not None:
            existing = collection.get(
                where={"user_id": user_id},
                include=["metadatas"]
            )
            if not existing or not existing.get("ids"):
                return False

            ids_to_delete = [
                id_
                for id_, meta in zip(existing["ids"], existing["metadatas"])
                if meta and meta.get("filename") == filename
            ]

            if len(ids_to_delete) == 0:
                return False

            collection.delete(ids=ids_to_delete)
            return True
        else:
            existing = collection.get(
                where={"filename": filename},
                include=["metadatas"]
            )
            if existing and existing.get("ids") and len(existing["ids"]) > 0:
                collection.delete(ids=existing["ids"])
                return True
            return False
    except Exception as e:
        print(f"Error deleting document {filename} from Chroma: {e}")
        return False


def get_all_chunks():

    results = collection.get(
        include=[
            "documents",
            "metadatas"
        ]
    )

    output = []

    if not results or not results.get("documents"):
        return []

    for doc, meta in zip(
        results["documents"],
        results["metadatas"]
    ):

        output.append(
            {
                "text": doc,
                "filename": meta.get("filename", "unknown"),
                "chunk": meta.get("chunk", 1),
                "user_id": meta.get("user_id")
            }
        )

    return output
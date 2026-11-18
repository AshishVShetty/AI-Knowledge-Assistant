import os
from pathlib import Path
from fastapi import APIRouter, Depends
from services.vector_service import (
    get_documents,
    delete_document
)
from services.bm25_service import delete_documents as delete_bm25_documents
from services.jwt_service import get_current_user
from models.user import User

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_FOLDER = os.path.join(str(BASE_DIR), "uploads")


@router.get("/documents")
def list_documents(current_user: User = Depends(get_current_user)):

    docs = get_documents(user_id=current_user.id)

    return {
        "documents": docs,
        "total_documents": len(docs)
    }


@router.delete("/documents/{filename}")
def remove_document(
    filename: str,
    current_user: User = Depends(get_current_user)
):

    # Try to delete user's vectors from ChromaDB
    deleted_from_chroma = delete_document(filename, user_id=current_user.id)

    # Clean from BM25 index
    delete_bm25_documents(filename, user_id=current_user.id)

    # Check physical file
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file_exists = os.path.exists(file_path)

    # Check if any other user is using this physical file
    all_users_docs = get_documents()
    is_shared = filename in all_users_docs

    if file_exists and not is_shared:
        os.remove(file_path)

    if deleted_from_chroma:
        return {
            "message": f"{filename} deleted successfully.",
            "status": "success"
        }
    else:
        return {
            "message": f"Document {filename} not found in user library.",
            "status": "not_found"
        }
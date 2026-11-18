from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from services.pdf_service import extract_text, split_text
from services.vector_service import create_embeddings
from services.bm25_service import add_documents
from services.jwt_service import get_current_user
from models.user import User
import shutil
import os
from pathlib import Path

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_FOLDER = os.path.join(str(BASE_DIR), "uploads")

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):

    # Check if uploaded file is a PDF
    if not file.filename.endswith(".pdf"):
        return {
            "message": "Only PDF files are allowed."
        }

    # Save PDF
    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Extract text
        text = extract_text(file_path)

        print("\n========== PDF CONTENT ==========\n")
        print(text)
        print("\n================================\n")

        # Split into chunks
        chunks = split_text(text)

        if len(chunks) == 0:
            os.remove(file_path)
            return {
                "message": "No readable text found in this PDF. It may be a scanned document.",
                "ocr_required": True
            }

        print("\n=========== CHUNKS ===========\n")

        for i, chunk in enumerate(chunks):
            print(f"\nChunk {i + 1}\n")
            print(chunk)
            print("-" * 60)

        # Store embeddings
        stored = create_embeddings(
            chunks,
            file.filename,
            current_user.id
        )
        if stored:
            bm25_documents = [
                {
                    "text": chunk,
                    "filename": file.filename,
                    "chunk": i + 1,
                    "user_id": current_user.id
                }
                for i, chunk in enumerate(chunks)
            ]
            add_documents(bm25_documents)
        # Duplicate PDF
        if not stored:
            os.remove(file_path)
            return {
                "message": "This PDF has already been uploaded."
            }

        return {
            "message": "PDF uploaded successfully!",
            "filename": file.filename,
            "total_chunks": len(chunks),
            "stored_embeddings": stored,
            "first_chunk": chunks[0]
        }

    except Exception as e:
        # Delete uploaded file if anything fails
        if os.path.exists(file_path):
            os.remove(file_path)

        error_msg = str(e)
        print(f"[Upload Error] {error_msg}")

        # Return a JSON error (not raise) so CORS headers are always present
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {error_msg}"
        )
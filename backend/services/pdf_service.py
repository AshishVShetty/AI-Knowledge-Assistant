import os
import sys
import fitz
import pytesseract

from pdf2image import convert_from_path
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Tell Python where Tesseract is if running on Windows and path exists
if sys.platform == "win32":
    win_tesseract = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(win_tesseract):
        pytesseract.pytesseract.tesseract_cmd = win_tesseract

    win_poppler = r"C:\Users\vshet\Downloads\Release-26.02.0-0\poppler-26.02.0\Library\bin"
    POPPLER_PATH = win_poppler if os.path.exists(win_poppler) else None
else:
    POPPLER_PATH = None


def extract_text(pdf_path):

    doc = fitz.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()

    # If selectable text exists, return it
    if text.strip():
        return text

    print("No embedded text found. Running OCR...")

    try:
        convert_kwargs = {}
        if POPPLER_PATH:
            convert_kwargs["poppler_path"] = POPPLER_PATH

        images = convert_from_path(pdf_path, **convert_kwargs)

        ocr_text = ""
        for image in images:
            ocr_text += pytesseract.image_to_string(image, lang="eng")

        return ocr_text
    except Exception as e:
        print(f"[Warning] OCR extraction skipped: {e}")
        return ""


def split_text(text):
    """
    Split document text into clean, context-preserving chunks.
    Chunk size 1000 with 200 overlap preserves full paragraphs,
    lists, skills, and sentences intact for high-accuracy retrieval.
    """
    if not text or not text.strip():
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", "; ", ", ", " ", ""],
        strip_whitespace=True,
        length_function=len
    )

    chunks = splitter.split_text(text.strip())
    return [chunk.strip() for chunk in chunks if chunk.strip()]
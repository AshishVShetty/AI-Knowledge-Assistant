import fitz
import pytesseract

from pdf2image import convert_from_path
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Tell Python where Tesseract is
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

# Path to Poppler
POPPLER_PATH = (
    r"C:\Users\vshet\Downloads\Release-26.02.0-0\poppler-26.02.0\Library\bin"
)


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

    images = convert_from_path(
        pdf_path,
        poppler_path=POPPLER_PATH
    )

    ocr_text = ""

    for image in images:
        ocr_text += pytesseract.image_to_string(
    image,
    lang="eng"
)

    return ocr_text


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
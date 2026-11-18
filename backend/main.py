import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException, RequestValidationError
from sqlalchemy.exc import OperationalError

from routers.auth import router as auth_router
from routers.upload import router as upload_router
from routers.chat import router as chat_router
from routers.documents import router as documents_router
from services.jwt_service import get_current_user
from services.vector_service import get_all_chunks
from services.bm25_service import rebuild_index
from models.user import Base
import models.chat
from config.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables verified.")
    except Exception as e:
        print(f"[Warning] Database table initialization skipped: {e}")

    print("\nLoading BM25 Index...")
    try:
        chunks = get_all_chunks()
        if len(chunks) > 0:
            rebuild_index(chunks)
    except Exception as e:
        print(f"[Warning] BM25 Index load skipped: {e}")
    print("Server Ready.\n")
    yield


app = FastAPI(lifespan=lifespan)

# CORS middleware configuration
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Allow custom frontend URL from environment variable
custom_frontend = os.getenv("FRONTEND_URL")
if custom_frontend:
    for url in custom_frontend.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^https://.*\.netlify\.app$|^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(OperationalError)
async def db_operational_exception_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database connection error. The database appears to be unavailable. Please try again or restart the server."
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Don't intercept HTTPException — let FastAPI handle it normally (with CORS)
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

app.include_router(auth_router)
app.include_router(
    upload_router,
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    chat_router,
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    documents_router,
    dependencies=[Depends(get_current_user)]
)


@app.get("/")
def home():
    return {
        "message": "AI Knowledge Assistant Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

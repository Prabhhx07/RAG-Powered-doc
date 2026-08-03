from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
from app.routers import auth_routes
from app.routers import documents
from app.routers import query
from app.database import get_connection

app = FastAPI(title="RAG-Powered Doc Q&A")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://rag-powered-doc.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(query.router, prefix="/query", tags=["query"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/db")
def health_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1")
    cur.fetchone()
    cur.close()
    conn.close()
    return {"status": "ok", "db": "connected"}
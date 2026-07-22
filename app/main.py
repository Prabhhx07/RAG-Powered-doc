from fastapi import FastAPI
from app.routers import auth_routes
from app.routers import documents
from app.routers import query


app = FastAPI(title="RAG-Powered Doc Q&A")
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(query.router, prefix="/query", tags=["query"])

@app.get("/health")
def health():
    return {"status": "ok"}
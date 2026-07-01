from fastapi import FastAPI
from app.routers import auth_routes

app = FastAPI(title="RAG-powered-doc")
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])

@app.get("/health")
def health():
    return {"status": "ok"}
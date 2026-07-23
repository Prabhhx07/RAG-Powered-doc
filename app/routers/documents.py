from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.auth import get_current_user
from app.database import get_connection
from app.utils.pdf_parser import extract_text_from_pdf
from app.utils.embeddings import get_embedding
import shutil
import os

router = APIRouter()

@router.get("/list")
def list_documents(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    user_id = current_user["sub"]
    cur.execute(
        "SELECT id, filename, created_at FROM documents WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {"document_id": row[0], "filename": row[1], "created_at": str(row[2])}
        for row in rows
    ]

def chunk_text(text: str, chunk_size: int = 500) -> list:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    # save file temporarily
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # extract text
    text = extract_text_from_pdf(temp_path)
    os.remove(temp_path)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    # save to DB
    conn = get_connection()
    cur = conn.cursor()

    user_id = current_user["sub"]

    cur.execute(
        "INSERT INTO documents (user_id, filename) VALUES (%s, %s) RETURNING id",
        (user_id, file.filename)
    )
    document_id = cur.fetchone()[0]

    # chunk and embed
    chunks = chunk_text(text)
    for chunk in chunks:
        embedding = get_embedding(chunk)
        cur.execute(
            "INSERT INTO chunks (document_id, content, embedding) VALUES (%s, %s, %s)",
            (document_id, chunk, str(embedding))
        )

    conn.commit()
    cur.close()
    conn.close()

    return {
        "message": "Document uploaded successfully",
        "document_id": document_id,
        "chunks": len(chunks)
    }
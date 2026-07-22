from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user
from app.database import get_connection
from app.utils.embeddings import get_embedding
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    document_id: int

@router.post("/ask")
def ask_question(request: QueryRequest, current_user: dict = Depends(get_current_user)):

    question_embedding = get_embedding(request.question)


    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT content FROM chunks
        WHERE document_id = %s
        ORDER BY embedding <=> %s::vector
        LIMIT 5
    """, (request.document_id, str(question_embedding)))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="No chunks found for this document")


    context = "\n\n".join([row[0] for row in rows])


    prompt = f"""Answer the question based only on the following context. 
If the answer is not in the context, say "I don't know based on the provided document."

Context:
{context}

Question: {request.question}
"""

   # TODO: replace with real LLM call when quota available
    return {
        "answer": f"Based on your document, here is the relevant information: {context[:500]}",
        "chunks_used": len(rows)
    }

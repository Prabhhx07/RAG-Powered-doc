from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from app.auth import get_current_user
from app.database import get_connection
from app.utils.embeddings import get_embedding
from app.limiter import limiter
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
router = APIRouter()

class Exchange(BaseModel):
    question: str
    answer: str

class QueryRequest(BaseModel):
    question: str
    document_id: int
    history: Optional[List[Exchange]] = []

@router.post("/ask")
@limiter.limit("10/minute")
def ask_question(request: Request, body: QueryRequest, current_user: dict = Depends(get_current_user)):

    question_embedding = get_embedding(body.question)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT content FROM chunks
        WHERE document_id = %s
        ORDER BY embedding <=> %s::vector
        LIMIT 5
    """, (body.document_id, str(question_embedding)))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="No chunks found for this document")

    context = "\n\n".join([row[0] for row in rows])

    history_text = ""
    if body.history:
        for exchange in body.history[-3:]:
            history_text += f"Previous question: {exchange.question}\nPrevious answer: {exchange.answer}\n\n"

    prompt = f"""Answer the question based only on the following context.
If the answer is not in the context, say "I don't know based on the provided document."

Context:
{context}

{history_text}Question: {body.question}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response.choices[0].message.content
    except Exception as e:
        print(f"Groq call failed, falling back to mock: {e}")
        answer = f"[MOCK - Groq unavailable] Based on your document: {context[:500]}"

    return {
        "answer": answer,
        "chunks_used": len(rows)
    }
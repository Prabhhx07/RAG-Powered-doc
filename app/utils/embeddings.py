from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_embedding(text: str) -> list:
    result = client.models.embed_content(
    model="models/gemini-embedding-2",
    contents=text
)
    return result.embeddings[0].values
# RAG-Powered Document Q&A

Upload a PDF, ask questions about it, and get grounded answers pulled directly from the document — with conversation memory so follow-up questions actually work.

## Live Demo

<!-- 🔗 Add your deployed link here once live, e.g. https://docmind.vercel.app -->

**[Try it live →]()**


## What It Does

DocMind lets you upload a PDF and have a real conversation with it. Under the hood, it's a full **Retrieval-Augmented Generation (RAG)** pipeline:

1. You upload a PDF
2. The text is extracted, split into chunks, and converted into vector embeddings
3. Those embeddings are stored in Postgres using `pgvector`
4. When you ask a question, it's embedded the same way, and the most semantically similar chunks are retrieved via vector similarity search
5. Those chunks — plus your recent conversation history — are handed to an LLM, which answers **grounded only in what's actually in the document**

If the answer isn't in the document, the model says so instead of making something up.

## Features

- 🔐 **JWT-based authentication** — signup/login, protected routes
- 📄 **PDF upload & processing** — text extraction, chunking, and embedding on upload
- 🔍 **Semantic search** — pgvector-backed similarity search over document chunks
- 💬 **Conversational Q&A** — grounded answers with multi-turn memory (follow-up questions understand prior context)
- 🗑️ **Document management** — delete documents (with cascading chunk cleanup)
- 🚦 **Rate limiting** — per-user request limits on the query endpoint
- 🎨 **Modern React UI** — dark theme, drag-and-drop upload, real-time chat interface



## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                  │  HTTP   │                  │  SQL    │                 │
│  React Frontend  │ ──────> │  FastAPI Backend │ ──────> │  PostgreSQL     │
│  (Vite)          │ <────── │                  │ <────── │  + pgvector     │
│                  │  JSON   │                  │         │                 │
└─────────────────┘         └────────┬─────────┘         └─────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                        │
                    ┌─────▼─────┐          ┌───────▼──────┐
                    │  Gemini   │          │     Groq      │
                    │ (embeddings) │       │ (LLM answers) │
                    └───────────┘          └───────────────┘
```


**Request flow for a question:**

```
User asks question
      │
      ▼
Embed question (Gemini)
      │
      ▼
Vector similarity search in pgvector ──> top 5 relevant chunks
      │
      ▼
Build prompt: chunks + last 3 exchanges + question
      │
      ▼
Send to Groq (Llama 3.3 70B) ──> grounded answer
      │
      ▼
Return answer + chunks_used to frontend
```

## Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Frontend      | React, Vite, React Router                      |
| Backend       | FastAPI (Python)                               |
| Database      | PostgreSQL 17 + `pgvector` extension           |
| Auth          | JWT (`python-jose`), bcrypt password hashing   |
| Embeddings    | Google Gemini (`gemini-embedding-2`, 3072-dim) |
| LLM (Answers) | Groq (`llama-3.3-70b-versatile`)               |
| PDF Parsing   | PyMuPDF (`fitz`)                               |
| Rate Limiting | `slowapi`                                      |

## Why Two AI Providers?

Gemini handles embeddings and Groq handles answer generation. This wasn't accidental — Groq doesn't offer an embeddings API, and splitting responsibilities this way keeps the pipeline provider-agnostic: swapping either piece later (e.g. to a self-hosted model) only touches one isolated function, not the whole system.

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 17 with the `pgvector` extension
- A [Google Gemini API key](https://ai.google.dev/) (free tier)
- A [Groq API key](https://console.groq.com/) (free tier)

### 1. Clone the repo

```bash
git clone https://github.com/Prabhhx07/RAG-Powered-doc.git
cd RAG-Powered-doc
```

### 2. Backend setup

```bash
# Create and activate a virtual environment
python3 -m venv venv

# Install dependencies
venv/bin/pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=RAG-powered
DB_PASSWORD=your_db_password
DB_PORT=5433
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Database setup

Create the database, then enable `pgvector` and create the tables:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    filename TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    content TEXT NOT NULL,
    embedding vector(3072),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Run the backend

```bash
venv/bin/python -m uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`.

### 5. Frontend setup

```bash
cd ui
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 6. Try it out

Open `http://localhost:5173`, sign up, upload a PDF, and start asking questions.

## API Endpoints

| Method | Endpoint            | Description                      | Auth Required              |
| ------ | ------------------- | -------------------------------- | -------------------------- |
| POST   | `/auth/signup`      | Create a new account             | No                         |
| POST   | `/auth/login`       | Log in, returns JWT              | No                         |
| GET    | `/documents/list`   | List your uploaded documents     | Yes                        |
| POST   | `/documents/upload` | Upload and process a PDF         | Yes                        |
| DELETE | `/documents/{id}`   | Delete a document and its chunks | Yes                        |
| POST   | `/query/ask`        | Ask a question about a document  | Yes (rate limited: 10/min) |
| GET    | `/health`           | Health check                     | No                         |

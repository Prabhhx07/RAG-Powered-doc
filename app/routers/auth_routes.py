from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_connection
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter()

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(request: SignupRequest):
    conn = get_connection()
    cur = conn.cursor()
    
    
    cur.execute("SELECT id FROM users WHERE email = %s", (request.email,))
    existing = cur.fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    
    hashed = hash_password(request.password)
    cur.execute(
        "INSERT INTO users (email, password) VALUES (%s, %s)",
        (request.email, hashed)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "User created successfully"}

@router.post("/login")
def login(request: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, password FROM users WHERE email = %s", (request.email,))
    user = cur.fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id, user_email, user_password = user  # unpack the tuple
    
    if not verify_password(request.password, user_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user_id)})
    
    cur.close()
    conn.close()
    
    return {"access_token": token, "token_type": "bearer"}
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import requests, HTTPException, status, Request
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY= os.getenv("SECRET_KEY")

ALGORITHM = os.getenv("ALGORITHM")

ACESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACESS_TOKEN_EXPIRE_MINUTES")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_senha(senha:str):
    return pwd_context.hash(senha)

def verificar_senha(senha:str, senha_hash:str):
    return pwd_context.verify(senha, senha_hash)

def criar_token(data:dict):
    payload = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(minutes=ACESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expira})

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decodificar_token(token:str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload

def get_usuario_logado(request: Request):
    token = request.cookies.get("acces_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado"
        )
    try:
        payload = decodificar_token(token)
        email = payload.get("sub")

        if email in None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token Inválido"
            )
        return payload
    except JWTError:
        raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token Inválido ou expirado"
            )
    
def get_usuario_opcional(request: Request):
    try: 
        return get_usuario_logado(request)
    except HTTPException:
        return None
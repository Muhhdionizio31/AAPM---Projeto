from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request
from dotenv import load_dotenv
import os       

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = (os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


#CryptContext - Configura o bcrypt como o algoritmo de hashing para senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#Teste de hash
senha = "1234"
senha_hash = pwd_context.hash(senha)
print(f"Hash: {senha_hash}")

senha_atual = "1234"
verificar_senha = pwd_context.verify(senha_atual, senha_hash)
print(verificar_senha)

# Funçôes de senha
def hash_senha(senha: str):
    return pwd_context.hash(senha)


def verificar_senha(senha: str, senha_hash: str):
    return pwd_context.verify(senha, senha_hash)


# Funções de token - JWT
def criar_token(data: dict):
    payload = data.copy()
    # Define o tempo de expiração do token
    expira = datetime.now(timezone.utc) + timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    payload.update({"exp": expira})
    # Gera o token JWT
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def decodificar_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload
    
# Dependencias do FastAPI
def get_usuario_logado(request: Request):
    
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não Autenticado"
        )

    try:
        payload = decodificar_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
def get_usuario_opcional(request: Request):
    try:
        return get_usuario_logado(request)
    except HTTPException:
            return None
     
# Quando o usuario é Administrador
def get_admin(request: Request):
    usuario = get_usuario_logado(request)

    if usuario.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso apenas para administradores"
        )
    return usuario
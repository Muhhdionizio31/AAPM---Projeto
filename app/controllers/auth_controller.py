from fastapi import APIRouter, Depends, Request, Form, status
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.auth import hash_senha, verificar_senha, criar_token

#APIROUTER - Agrupa as rotas de autenticação do arquivo com o prefixo "/auth"
router = APIRouter(prefix="/auth", tags=["Autenticação"])

#Configuta para renderizar os templates HTML
templates = Jinja2Templates(directory="app/templates")

# Rota para a tela de cadastro
@router.get("/cadastro")
def tela_cadastro(request: Request):
    return templates.TemplateResponse(
        request,
        "auth/cadastro.html",
        {"request": request}
    )

# Rota para a tela de login
@router.get("/login")
def tela_login(request: Request):
    return templates.TemplateResponse(
        request,
        "auth/login.html",
        {"request": request}
    )

# Rota para criar um usuario no banco de dados
@router.post("/cadastro")
def fazer_usuario(
    request: Request,
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    db: Session = Depends(get_db)
):
    # Verificar se o usuário já existe
    usuario_existente = db.query(Usuario).filter_by(email=email).first()
    if usuario_existente:
        return templates.TemplateResponse(
            request,
            "auth/cadastro.html",
            {"request": request, "erro": "Este email já está cadastrado."}
        )

    # Criar o novo usuário
    nova_senha = hash_senha(senha)
    novo_usuario = Usuario(nome=nome, email=email, senha_hash=nova_senha)
    db.add(novo_usuario)
    db.commit()

    # Redirecionar para a tela de login
    return RedirectResponse(url="/auth/login?cadastro=successo", status_code=302)

#Rota de login 
@router.post("/login")
def login(
    request: Request,
    email: str = Form(...),
    senha: str = Form(...),
    db: Session = Depends(get_db)
):
    # Busca o usuário no banco pelo email
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    # Verifica usuário E senha em passos separados para evitar
    senha_correta = (
        usuario is not None and
        verificar_senha(senha, usuario.senha_hash)
    )

    if not senha_correta:
        return templates.TemplateResponse(
            request,
            "auth/login.html",
            {
                "request": request,
                "erro": "E-mail ou senha incorretos."
            },
            status_code=401
        )

    if not usuario.ativo:
        return templates.TemplateResponse(
            request,
            "auth/login.html",
            {
                "request": request,
                "erro": "Usuário inativo. Contate o administrador."
            },
            status_code=403
        )

    # Dados que ficarão no payload do JWT
    token_data = {
        "sub": usuario.email,
        "nome": usuario.nome,
        "role": usuario.role,
        "id": usuario.id
    }

    token = criar_token(token_data)

    # Cria a resposta de redirecionamento
    response = RedirectResponse(url="/", status_code=302)
    # Define o cookie com o token JWT
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600,
        samesite="lax",
        secure=True
    )
    return response

#Rota para Sair/logout - remove o cookie do token JWT
@router.get("/logout")
def sair():
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie(key="access_token")
    return response
from fastapi import APIRouter, Depends, Request, Form, status
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import secrets
from typing import Optional

from app.database import get_db
from app.models.usuario import Usuario
from app.auth import hash_senha, verificar_senha, criar_token
from app.models.reset_token import ResetToken
from app.services.email_service import enviar_email_redefinicao


TOKEN_VALIDADE_MINUTOS = 15

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

# ROTA DE LOGIN
@router.post("/login")
def login(
    request: Request,
    email: str = Form(...),
    senha: str = Form(...),
    lembrar: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Busca o usuário no banco pelo email
    usuario = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    # Verifica usuário e senha
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

    # Verifica se o usuário está ativo
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

    # Cria o token
    token = criar_token(
        token_data,
        lembrar=(lembrar == "true")
    )

    response = RedirectResponse(
        url="/painel",
        status_code=302
    )

    if lembrar == "true":
        max_age = 60 * 60 * 24 * 30  # 30 dias
    else:
        max_age = 60 * 60            # 1 hora

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=max_age,
        samesite="lax",
        secure=True
    )

    return response




#ROTA DE ESQUECI A SENHA 
@router.get("/esqueci-senha")
def tela_esqueci_senha(request: Request):
    return templates.TemplateResponse(
        request,
        "auth/esqueci_senha.html",
        {"request": request}
    )


# Rota - processa o pedido de redefinição
@router.post("/esqueci-senha")
def esqueci_senha(
    request: Request,
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.email == email,
        Usuario.role == "admin"
    ).first()

    # Mensagem genérica sempre, para não revelar quais e-mails são de admin
    mensagem_sucesso = (
        "Se este e-mail estiver cadastrado como administrador, "
        "você receberá um link de redefinição em instantes."
    )

    if usuario:
        token = secrets.token_urlsafe(32)
        expira_em = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_VALIDADE_MINUTOS)

        novo_token = ResetToken(
            token=token,
            usuario_id=usuario.id,
            expira_em=expira_em
        )
        db.add(novo_token)
        db.commit()

        link = f"{request.base_url}auth/redefinir-senha/{token}"
        enviar_email_redefinicao(usuario.email, link)

    return templates.TemplateResponse(
        request,
        "auth/esqueci_senha.html",
        {"request": request, "sucesso": mensagem_sucesso}
    )


# Rota - tela para definir a nova senha
@router.get("/redefinir-senha/{token}")
def tela_redefinir_senha(token: str, request: Request, db: Session = Depends(get_db)):
    reset_token = _validar_token(token, db)

    if not reset_token:
        return templates.TemplateResponse(
            request,
            "auth/redefinir_senha.html",
            {"request": request, "erro": "Link inválido ou expirado.", "token_invalido": True}
        )

    return templates.TemplateResponse(
        request,
        "auth/redefinir_senha.html",
        {"request": request, "token": token}
    )


# Rota - processa a nova senha
@router.post("/redefinir-senha/{token}")
def redefinir_senha(
    token: str,
    request: Request,
    senha: str = Form(...),
    confirmar_senha: str = Form(...),
    db: Session = Depends(get_db)
):
    reset_token = _validar_token(token, db)

    if not reset_token:
        return templates.TemplateResponse(
            request,
            "auth/redefinir_senha.html",
            {"request": request, "erro": "Link inválido ou expirado.", "token_invalido": True}
        )

    if senha != confirmar_senha:
        return templates.TemplateResponse(
            request,
            "auth/redefinir_senha.html",
            {"request": request, "erro": "As senhas não coincidem.", "token": token}
        )

    usuario = db.query(Usuario).filter_by(id=reset_token.usuario_id).first()
    usuario.senha_hash = hash_senha(senha)

    # Marca o token como usado para não poder ser reaproveitado
    reset_token.usado = True
    db.commit()

    return RedirectResponse(url="/auth/login?redefinida=sucesso", status_code=302)


def _validar_token(token: str, db: Session):
    """Retorna o ResetToken válido (existe, não foi usado e não expirou) ou None."""
    reset_token = db.query(ResetToken).filter_by(token=token, usado=False).first()

    if not reset_token:
        return None

    agora = datetime.now(timezone.utc)
    expira_em = reset_token.expira_em
    if expira_em.tzinfo is None:
        expira_em = expira_em.replace(tzinfo=timezone.utc)

    if expira_em < agora:
        return None

    return reset_token


#Rota para Sair/logout - remove o cookie do token JWT
@router.get("/logout")
def sair():
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie(key="access_token")
    return response
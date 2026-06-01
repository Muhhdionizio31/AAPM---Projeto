from fastapi import FastAPI, Form, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from app.auth import get_usuario_opcional

from app.controllers import auth_controller
from app.controllers import admin_controller
from app.controllers import categoria_controller
from app.controllers import produto_controller

from dotenv import load_dotenv
import os
from app.database import get_db
from sqlalchemy.orm import Session


load_dotenv()

app = FastAPI(title="AAPM - Senai")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(categoria_controller.router)
app.include_router(produto_controller.router)

#Rota para a página inicial
@app.get("/")
def home(
    request: Request,
    usuario = Depends(get_usuario_opcional)
):
    return templates.TemplateResponse(
        request,
        "index.html",
        {"request": request, "usuario": usuario}
    )

# Rota para o horário de atendimento
@app.get("/horario")
def horario(
    request: Request,
    usuario = Depends(get_usuario_opcional)
):
    return templates.TemplateResponse(
        request,
        "horario.html",
        {"request": request, "usuario": usuario}
    )


# Rota para o catálogo de produtos
@app.get("/catalogo")
def catalogo(
    request: Request,
    usuario = Depends(get_usuario_opcional)
):
    return templates.TemplateResponse(
        request,
        "catalogo.html",
        {"request": request, "usuario": usuario}
    )

@app.get("/login")
def login(
    request: Request,
    usuario = Depends(get_usuario_opcional)
):
    return templates.TemplateResponse(
        request,
        "auth/login.html",
        {"request": request, "usuario": usuario}
    )

# Rota para a política de privacidade 
@app.get("/politica")
def politica(
    request: Request,
    usuario = Depends(get_usuario_opcional)
):
    return templates.TemplateResponse(
        request,
        "politica.html",
        {"request": request, "usuario": usuario}
    )

# Rota para acesso não autenticado
@app.get("/categorias")
def listar_categorias(
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_opcional)
):
    
    if usuario is None:
        return RedirectResponse(
            url="/auth/login",
            status_code=302
        )

    return templates.TemplateResponse(
        request,
        "categorias/index.html",
        {
            "request": request,
            "usuario": usuario,
        }
    )

@app.get("/produtos")
def listar_produtos(
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_opcional)
):

    if usuario is None:
        return RedirectResponse(
            url="/auth/login",
            status_code=302
        )

    return templates.TemplateResponse(
        request,
        "produtos/index.html",
        {
            "request": request,
            "usuario": usuario,
        }
    )

@app.get("/usuarios")
def listar_usuarios(
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_opcional)
):

    if usuario is None:
        return RedirectResponse(
            url="/auth/login",
            status_code=302
        )

    return templates.TemplateResponse(
        request,
        "usuarios/index.html",
        {
            "request": request,
            "usuario": usuario,
        }
    )
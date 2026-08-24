from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import math

from app.database import get_db
from app.models.cliente import Cliente
from app.auth import get_admin

router = APIRouter(prefix="/clientes", tags=["Clientes"])
templates = Jinja2Templates(directory="app/templates")


# ============================================================
# LISTAGEM DE CLIENTES / ASSOCIADOS COM MÉTRICAS E BUSCA
# ============================================================

@router.get("/")
def listar_clientes(
    request: Request,
    busca: str = "",
    tipo: str = "",
    page: int = 1,
    per_page: int = 12,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    query = db.query(Cliente)

    if busca:
        busca_termo = f"%{busca.strip()}%"
        query = query.filter(
            Cliente.nome.ilike(busca_termo) |
            Cliente.matricula.ilike(busca_termo) |
            Cliente.telefone.ilike(busca_termo)
        )

    if tipo == "associados":
        query = query.filter(Cliente.is_associado == True, Cliente.ativo == True)
    elif tipo == "comuns":
        query = query.filter(Cliente.is_associado == False, Cliente.ativo == True)
    elif tipo == "inativos":
        query = query.filter(Cliente.ativo == False)

    todos = db.query(Cliente).all()
    total_clientes = len(todos)
    total_associados = sum(1 for c in todos if c.is_associado and c.ativo)
    total_comuns = sum(1 for c in todos if not c.is_associado and c.ativo)
    total_inativos = sum(1 for c in todos if not c.ativo)

    total_filtrados = query.count()
    page = max(page, 1)
    per_page = max(per_page, 1)
    total_pages = math.ceil(total_filtrados / per_page) if total_filtrados else 1
    page = min(page, total_pages)

    clientes = (
        query.order_by(Cliente.nome)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return templates.TemplateResponse(
        request,
        "clientes/index.html",
        {
            "request":          request,
            "usuario":          admin,
            "clientes":         clientes,
            "busca":            busca,
            "tipo":             tipo,
            "total_clientes":   total_clientes,
            "total_associados": total_associados,
            "total_comuns":     total_comuns,
            "total_inativos":   total_inativos,
            "total_filtrados":  total_filtrados,
            "page":             page,
            "per_page":         per_page,
            "total_pages":      total_pages,
        }
    )


# ============================================================
# CRIAR NOVO CLIENTE / ASSOCIADO
# ============================================================

@router.post("/novo")
def criar(
    request: Request,
    nome: str          = Form(...),
    matricula: str     = Form(""),
    telefone: str      = Form(""),
    is_associado: bool = Form(False),
    db: Session        = Depends(get_db),
    admin              = Depends(get_admin)
):
    matricula_limpa = matricula.strip() or None
    if matricula_limpa:
        existente = db.query(Cliente).filter(
            Cliente.matricula == matricula_limpa
        ).first()

        if existente:
            return RedirectResponse(url="/clientes?erro=matricula_duplicada", status_code=302)

    db.add(Cliente(
        nome         = nome.strip(),
        matricula    = matricula_limpa,
        telefone     = telefone.strip() or None,
        is_associado = is_associado,
        ativo        = True
    ))
    db.commit()

    return RedirectResponse(url="/clientes?criado=ok", status_code=302)


# ============================================================
# EDITAR CLIENTE / ASSOCIADO
# ============================================================

@router.post("/{cliente_id}/editar")
def editar(
    cliente_id: int,
    nome: str          = Form(...),
    matricula: str     = Form(""),
    telefone: str      = Form(""),
    is_associado: bool = Form(False),
    db: Session        = Depends(get_db),
    admin              = Depends(get_admin)
):
    editando = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not editando:
        return RedirectResponse(url="/clientes?erro=nao_encontrado", status_code=302)

    matricula_limpa = matricula.strip() or None
    if matricula_limpa:
        conflito = db.query(Cliente).filter(
            Cliente.matricula == matricula_limpa,
            Cliente.id != cliente_id
        ).first()
        if conflito:
            return RedirectResponse(url="/clientes?erro=matricula_duplicada", status_code=302)

    editando.nome         = nome.strip()
    editando.matricula    = matricula_limpa
    editando.telefone     = telefone.strip() or None
    editando.is_associado = is_associado
    db.commit()

    return RedirectResponse(url="/clientes?editado=ok", status_code=302)


# ============================================================
# TOGGLE ATIVO / DESATIVAR / REATIVAR
# ============================================================

@router.post("/{cliente_id}/toggle-ativo")
def toggle_ativo(
    cliente_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        return RedirectResponse(url="/clientes?erro=nao_encontrado", status_code=302)

    cliente.ativo = not cliente.ativo
    db.commit()
    param = "reativado=ok" if cliente.ativo else "desativado=ok"
    return RedirectResponse(url=f"/clientes?{param}", status_code=302)


# ============================================================
# EXCLUIR CLIENTE DEFINITIVAMENTE
# ============================================================

@router.post("/{cliente_id}/excluir")
def excluir_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        return RedirectResponse(url="/clientes?erro=nao_encontrado", status_code=302)

    if cliente.vendas and len(cliente.vendas) > 0:
        return RedirectResponse(url="/clientes?erro=possui_vendas", status_code=302)

    db.delete(cliente)
    db.commit()
    return RedirectResponse(url="/clientes?excluido=ok", status_code=302)
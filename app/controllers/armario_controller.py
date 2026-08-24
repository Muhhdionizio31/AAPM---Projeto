# ============================================================
# controllers/armario_controller.py
# ============================================================
# Admin: gerencia tudo (criar, alugar, liberar, editar, desativar, excluir).
# Qualquer logado: visualiza o mapa e listagem de armários.
# ============================================================

from datetime import datetime, timezone
import math
from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.armario import Armario, StatusArmario
from app.models.cliente import Cliente
from app.auth import get_usuario_logado, get_admin

router = APIRouter(prefix="/armarios", tags=["Armários"])

templates = Jinja2Templates(directory="app/templates")


<<<<<<< HEAD
def _contexto_index(db: Session, usuario, status: str = "", localizacao: str = "", page: int = 1, per_page: int = 15):
=======
# ============================================================
# HELPER — monta o contexto da página index (reaproveitado
# tanto pelo GET / quanto pelos POSTs que precisam reabrir
# um modal com erro, já que agora tudo vive no index.html)
# ============================================================

def _contexto_index(db: Session, usuario, status: str = "", localizacao: str = ""):
>>>>>>> e63ee734cac6ae5c57e5fe934f78a2d9ae3ba3cd
    query = db.query(Armario).filter(Armario.ativo == True)

    if status in ("disponivel", "alugado", "inativo"):
        query = query.filter(Armario.status == status)

    if localizacao:
        query = query.filter(Armario.localizacao.ilike(f"%{localizacao}%"))

    total_armarios = query.count()
    page = max(page, 1)
    per_page = max(per_page, 1)
    total_pages = math.ceil(total_armarios / per_page) if total_armarios else 1
    page = min(page, total_pages)
    armarios = (
        query.order_by(Armario.numero)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    todos = db.query(Armario).filter(Armario.ativo == True).all()
    disponiveis = sum(1 for a in todos if a.status == StatusArmario.DISPONIVEL)
    alugados = sum(1 for a in todos if a.status == StatusArmario.ALUGADO)

    localizacoes = sorted(set(a.localizacao for a in todos if a.localizacao))
    clientes = db.query(Cliente).filter(Cliente.ativo == True).order_by(Cliente.nome).all()

    return {
        "usuario":      usuario,
        "armarios":     armarios,
        "disponiveis":  disponiveis,
        "alugados":     alugados,
        "total":        len(todos),
        "status":       status,
        "localizacao":  localizacao,
        "localizacoes": localizacoes,
        "StatusArmario": StatusArmario,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "total_armarios": total_armarios,
        "clientes": clientes,
    }


# ============================================================
# LISTAGEM DE ARMÁRIOS (Página Principal)
# ============================================================

@router.get("/")
def listar_armarios(
    request: Request,
    status: str = "",
    localizacao: str = "",
    page: int = 1,
    per_page: int = 15,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    contexto = _contexto_index(db, usuario, status, localizacao, page, per_page)
    contexto.update({"request": request})
    return templates.TemplateResponse(request, "armarios/index.html", contexto)


# ============================================================
# CADASTRO DE NOVO ARMÁRIO — somente admin
# ============================================================

@router.post("/novo")
def criar_armario(
    request: Request,
    numero: str      = Form(...),
    localizacao: str = Form(""),
    observacao: str  = Form(""),
    db: Session      = Depends(get_db),
    admin            = Depends(get_admin)
):
    numero_limpo = numero.strip().upper()
    existente = db.query(Armario).filter(
        Armario.numero == numero_limpo
    ).first()

    if existente:
        return RedirectResponse(url="/armarios?erro=ja_existe", status_code=302)

    db.add(Armario(
        numero      = numero_limpo,
        localizacao = localizacao.strip() or None,
        observacao  = observacao.strip() or None,
        status      = StatusArmario.DISPONIVEL,
        ativo       = True
    ))
    db.commit()

    return RedirectResponse(url="/armarios?criado=ok", status_code=302)


# ============================================================
# EDITAR DADOS DO ARMÁRIO — somente admin
# ============================================================

@router.post("/{armario_id}/editar")
def editar_armario(
    armario_id: int,
    request: Request,
    numero: str      = Form(...),
    localizacao: str = Form(""),
    observacao: str  = Form(""),
    db: Session      = Depends(get_db),
    admin            = Depends(get_admin)
):
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios?erro=nao_encontrado", status_code=302)

    numero_limpo = numero.strip().upper()
    conflito = db.query(Armario).filter(
        Armario.numero == numero_limpo,
        Armario.id != armario_id
    ).first()

    if conflito:
        return RedirectResponse(url="/armarios?erro=numero_duplicado", status_code=302)

    armario.numero      = numero_limpo
    armario.localizacao = localizacao.strip() or None
    armario.observacao  = observacao.strip() or None
    db.commit()

    return RedirectResponse(url="/armarios?editado=ok", status_code=302)


# ============================================================
# ALUGAR ARMÁRIO — somente admin
# ============================================================

@router.post("/{armario_id}/alugar")
def alugar(
    request: Request,
    armario_id: int,
    locatario_nome: str = Form(""),
    nome: str            = Form(""),
    semestre: str        = Form(""),
    periodo: str         = Form(""),
    observacao: str      = Form(""),
    db: Session          = Depends(get_db),
    admin                = Depends(get_admin)
):
    nome_final = (locatario_nome or nome).strip()
    semestre_final = (semestre or periodo).strip()
    observacao_final = observacao.strip()

    if not nome_final or not semestre_final:
        return RedirectResponse(url="/armarios?erro=dados_invalidos", status_code=302)

    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios?erro=nao_encontrado", status_code=302)

    if armario.status != StatusArmario.DISPONIVEL:
        return RedirectResponse(url="/armarios?erro=ja_alugado", status_code=302)

    try:
        armario.status = StatusArmario.ALUGADO
        armario.locatario_nome = nome_final
        armario.semestre = semestre_final
        if observacao_final:
            armario.observacao = observacao_final
        armario.alugado_em = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        db.rollback()
        return RedirectResponse(url="/armarios?erro=falha_aluguel", status_code=302)

    return RedirectResponse(url="/armarios?alugado=ok", status_code=302)


# ============================================================
# LIBERAR ARMÁRIO — somente admin
# ============================================================

@router.post("/{armario_id}/liberar")
def liberar(
    armario_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios?erro=nao_encontrado", status_code=302)

    armario.status         = StatusArmario.DISPONIVEL
    armario.locatario_nome = None
    armario.semestre       = None
    armario.alugado_em     = None

    db.commit()

    return RedirectResponse(url="/armarios?liberado=ok", status_code=302)


# ============================================================
# TOGGLE ATIVO / DESATIVAR / REATIVAR — somente admin
# ============================================================

@router.post("/{armario_id}/toggle-ativo")
def toggle_ativo(
    armario_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios?erro=nao_encontrado", status_code=302)

    if armario.status == StatusArmario.ALUGADO:
        return RedirectResponse(url="/armarios?erro=desativar_alugado", status_code=302)

    if armario.status == StatusArmario.INATIVO:
        armario.status = StatusArmario.DISPONIVEL
        armario.ativo = True
        db.commit()
        return RedirectResponse(url="/armarios?reativado=ok", status_code=302)
    else:
        armario.status = StatusArmario.INATIVO
        armario.ativo = True
        db.commit()
        return RedirectResponse(url="/armarios?desativado=ok", status_code=302)


# ============================================================
# EXCLUIR ARMÁRIO — somente admin
# ============================================================

@router.post("/{armario_id}/excluir")
def excluir_armario(
    armario_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios?erro=nao_encontrado", status_code=302)

    if armario.status == StatusArmario.ALUGADO:
        return RedirectResponse(url="/armarios?erro=excluir_alugado", status_code=302)

    db.delete(armario)
    db.commit()

    return RedirectResponse(url="/armarios?excluido=ok", status_code=302)


# ============================================================
# DETALHE DO ARMÁRIO — redireciona para a página principal
# ============================================================

@router.get("/{armario_id}")
def detalhe_armario(
    armario_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    return RedirectResponse(url="/armarios", status_code=302)
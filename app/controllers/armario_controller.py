# ============================================================
# controllers/armario_controller.py
# ============================================================
# Admin: gerencia tudo (criar, alugar, liberar, desativar).
# Qualquer logado: visualiza o mapa de disponibilidade.
# ============================================================

from datetime import datetime, timezone
import math
from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.armario import Armario, StatusArmario
from app.auth import get_usuario_logado, get_admin

router = APIRouter(prefix="/armarios", tags=["Armários"])

templates = Jinja2Templates(directory="app/templates")


# ============================================================
# HELPER — monta o contexto da página index (reaproveitado
# tanto pelo GET / quanto pelos POSTs que precisam reabrir
# um modal com erro, já que agora tudo vive no index.html)
# ============================================================

def _contexto_index(db: Session, usuario, status: str = "", localizacao: str = ""):
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

    return {
        "usuario": usuario,
        "armarios": armarios,
        "disponiveis": disponiveis,
        "alugados": alugados,
        "total": len(todos),
        "status": status,
        "localizacao": localizacao,
        "localizacoes": localizacoes,
        "StatusArmario": StatusArmario,
    }


# ============================================================
# MAPA DE ARMÁRIOS — visível para todos os logados
# ============================================================

@router.get("/")
def listar_armarios(
    request: Request,
    status: str = "",
    localizacao: str = "",
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    contexto = _contexto_index(db, usuario, status, localizacao)
    return templates.TemplateResponse(request, "armarios/index.html", contexto)


# ============================================================
# CADASTRO DE ARMÁRIO — somente admin (agora via modal no index)
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
    existente = db.query(Armario).filter(
        Armario.numero == numero.strip().upper()
    ).first()

    if existente:
        contexto = _contexto_index(db, admin)
        contexto.update({
            "abrir_novo": True,
            "erro_novo": f"Armário {numero.strip().upper()} já está cadastrado.",
            "valores_novo": {
                "numero": numero,
                "localizacao": localizacao,
                "observacao": observacao,
            },
        })
        return templates.TemplateResponse(
            request, "armarios/index.html", contexto, status_code=400
        )

    db.add(Armario(
        numero      = numero.strip().upper(),
        localizacao = localizacao.strip() or None,
        observacao  = observacao.strip() or None,
    ))
    db.commit()

    return RedirectResponse(url="/armarios?criado=ok", status_code=302)


# ============================================================
# DETALHE DO ARMÁRIO
# ============================================================

@router.get("/{armario_id}")
def detalhe_armario(
    armario_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios", status_code=302)

    return templates.TemplateResponse(
        request,
        "armarios/detalhe.html",
        {
            "usuario": usuario,
            "armario": armario,
        }
    )


# ============================================================
# EDITAR DADOS DO ARMÁRIO (número, localização) — admin
# (continua em página própria, não foi pedido pra virar modal)
# ============================================================

@router.get("/{armario_id}/editar")
def form_editar_armario(
    armario_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    editando = db.query(Armario).filter(Armario.id == armario_id).first()

    if not editando:
        return RedirectResponse(url="/armarios", status_code=302)

    return templates.TemplateResponse(
        request,
        "armarios/form.html",
        {
            "usuario":  admin,
            "editando": editando,
        }
    )


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
    editando = db.query(Armario).filter(Armario.id == armario_id).first()

    if not editando:
        return RedirectResponse(url="/armarios", status_code=302)

    conflito = db.query(Armario).filter(
        Armario.numero == numero.strip().upper(),
        Armario.id != armario_id
    ).first()

    if conflito:
        return templates.TemplateResponse(
            request,
            "armarios/form.html",
            {
                "usuario":  admin,
                "editando": editando,
                "erro":     f"Armário {numero.upper()} já existe.",
            },
            status_code=400
        )

    editando.numero      = numero.strip().upper()
    editando.localizacao = localizacao.strip() or None
    editando.observacao  = observacao.strip() or None
    db.commit()

    return RedirectResponse(url=f"/armarios/{armario_id}?editado=ok", status_code=302)


# ============================================================
# ALUGAR ARMÁRIO — agora via modal no index (admin)
# ============================================================

@router.post("/{armario_id}/alugar")
def alugar(
    request: Request,
    armario_id: int,
    # Aceita os nomes usados pelo modal atual e também nomes curtos,
    # evitando erro 422 quando o HTML estiver usando nome/periodo.
    locatario_nome: str = Form(""),
    nome: str            = Form(""),
    semestre: str        = Form(""),
    periodo: str         = Form(""),
    observacao: str      = Form(""),
    db: Session          = Depends(get_db),
    admin                = Depends(get_admin)
):
    """Aluga um armário disponível para o locatário informado."""

    nome_final = (locatario_nome or nome).strip()
    semestre_final = (semestre or periodo).strip()
    observacao = observacao.strip()

    # Valida antes de alterar o registro para retornar o modal com a mensagem.
    if not nome_final or not semestre_final:
        contexto = _contexto_index(db, admin)
        armario = db.query(Armario).filter(Armario.id == armario_id).first()
        contexto.update({
            "abrir_alugar_id": armario_id,
            "abrir_alugar_numero": armario.numero if armario else "",
            "abrir_alugar_localizacao": (armario.localizacao if armario else "") or "Localização não informada",
            "erro_alugar": "Informe o nome do locatário e o semestre.",
            "valores_alugar": {
                "locatario_nome": nome_final,
                "semestre": semestre_final,
                "observacao": observacao,
            },
        })
        return templates.TemplateResponse(
            request, "armarios/index.html", contexto, status_code=400
        )

    # Não usa with_for_update(): ele não é suportado de forma consistente
    # em SQLite e pode fazer o aluguel falhar mesmo com o armário disponível.
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        contexto = _contexto_index(db, admin)
        contexto.update({
            "abrir_alugar_id": armario_id,
            "erro_alugar": "Armário não encontrado.",
            "valores_alugar": {
                "locatario_nome": nome_final,
                "semestre": semestre_final,
                "observacao": observacao,
            },
        })
        return templates.TemplateResponse(
            request, "armarios/index.html", contexto, status_code=404
        )

    if armario.status != StatusArmario.DISPONIVEL:
        contexto = _contexto_index(db, admin)
        contexto.update({
            "abrir_alugar_id": armario_id,
            "abrir_alugar_numero": armario.numero,
            "abrir_alugar_localizacao": armario.localizacao or "Localização não informada",
            "erro_alugar": "Este armário não está disponível. Escolha outro armário disponível.",
            "valores_alugar": {
                "locatario_nome": nome_final,
                "semestre": semestre_final,
                "observacao": observacao,
            },
        })
        return templates.TemplateResponse(
            request, "armarios/index.html", contexto, status_code=400
        )

    try:
        armario.status = StatusArmario.ALUGADO
        armario.locatario_nome = nome_final
        armario.semestre = semestre_final
        armario.observacao = observacao or armario.observacao
        armario.alugado_em = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        db.rollback()
        contexto = _contexto_index(db, admin)
        contexto.update({
            "abrir_alugar_id": armario_id,
            "abrir_alugar_numero": armario.numero,
            "abrir_alugar_localizacao": armario.localizacao or "Localização não informada",
            "erro_alugar": "Não foi possível concluir o aluguel. Verifique os dados e tente novamente.",
            "valores_alugar": {
                "locatario_nome": nome_final,
                "semestre": semestre_final,
                "observacao": observacao,
            },
        })
        return templates.TemplateResponse(
            request, "armarios/index.html", contexto, status_code=500
        )

    return RedirectResponse(
        url=f"/armarios/{armario_id}?alugado=ok",
        status_code=303
    )


# ============================================================
# LIBERAR ARMÁRIO — remove o locatário e volta a disponível
# ============================================================

@router.post("/{armario_id}/liberar")
def liberar(
    armario_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios", status_code=302)

    armario.status         = StatusArmario.DISPONIVEL
    armario.locatario_nome = None
    armario.semestre       = None
    armario.alugado_em     = None

    db.commit()

    return RedirectResponse(
        url=f"/armarios/{armario_id}?liberado=ok",
        status_code=302
    )


# ============================================================
# TOGGLE ATIVO — ativa ou desativa o armário
# ============================================================

@router.post("/{armario_id}/toggle-ativo")
def toggle_ativo(
    armario_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    armario = db.query(Armario).filter(Armario.id == armario_id).first()

    if not armario:
        return RedirectResponse(url="/armarios", status_code=302)

    if armario.status == StatusArmario.ALUGADO:
        return RedirectResponse(
            url="/armarios?erro=desativar_alugado",
            status_code=302
        )

    armario.ativo = not armario.ativo
    if armario.ativo:
        armario.status = StatusArmario.DISPONIVEL

    db.commit()

    return RedirectResponse(url="/armarios", status_code=302)

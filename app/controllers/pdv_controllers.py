from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import String, cast, func
from sqlalchemy.orm import Session
from datetime import datetime
import math
import json

from app.database import get_db
from app.models.venda import Venda, ItemVenda
from app.models.produto import Produto
from app.models.cliente import Cliente
from app.auth import get_usuario_logado


router = APIRouter(prefix="/pdv", tags=["PDV"])

templates = Jinja2Templates(directory="app/templates")

DESCONTO_ASSOCIADO = 10.0


@router.get("/")
def tela_pdv(
    request: Request,
    page: int = 1,
    per_page: int = 10,
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_logado)
):
    produtos = (
        db.query(Produto)
        .filter(
            Produto.ativa == True,
            Produto.estoque_atual > 0
        )
        .order_by(Produto.nome)
        .all()
    )

    clientes = (
        db.query(Cliente)
        .filter(Cliente.ativo == True)
        .order_by(Cliente.nome)
        .all()
    )

    mes_selecionado = (
        request.query_params.get("mes")
        or datetime.now().strftime("%Y-%m")
    )

    busca = (
        request.query_params.get("busca")
        or ""
    ).strip()

    try:
        inicio = datetime.strptime(
            f"{mes_selecionado}-01",
            "%Y-%m-%d"
        )

        if inicio.month == 12:
            fim = inicio.replace(
                year=inicio.year + 1,
                month=1
            )
        else:
            fim = inicio.replace(
                month=inicio.month + 1
            )

    except ValueError:
        mes_selecionado = datetime.now().strftime("%Y-%m")

        inicio = datetime.strptime(
            f"{mes_selecionado}-01",
            "%Y-%m-%d"
        )

        if inicio.month == 12:
            fim = inicio.replace(
                year=inicio.year + 1,
                month=1
            )
        else:
            fim = inicio.replace(
                month=inicio.month + 1
            )

    vendas_query = (
        db.query(Venda)
        .outerjoin(Cliente)
        .filter(
            Venda.criado_em >= inicio,
            Venda.criado_em < fim
        )
    )

    if busca:
        vendas_query = vendas_query.filter(
            (Cliente.nome.ilike(f"%{busca}%")) |
            (cast(Venda.id, String).ilike(f"%{busca}%"))
        )

    total_vendas = vendas_query.count()
    page = max(page, 1)
    per_page = max(per_page, 1)
    total_pages = math.ceil(total_vendas / per_page) if total_vendas else 1
    page = min(page, total_pages)

    vendas_filtradas = (
        vendas_query
        .order_by(Venda.criado_em.desc())
        .all()
    )

    faturamento_total = sum(
        float(v.total_liquido or 0)
        for v in vendas_filtradas
    )

    clientes_atendidos = len({
        v.cliente_id
        for v in vendas_filtradas
        if v.cliente_id is not None
    })

    resumos = {
        "faturamento_total": faturamento_total,
        "vendas_concluidas": total_vendas,
        "clientes_atendidos": clientes_atendidos,
    }

    vendas = (
        vendas_query
        .order_by(Venda.criado_em.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    top_produtos = (
        db.query(
            ItemVenda.produto_nome,
            func.sum(
                ItemVenda.quantidade
            ).label("total_vendido")
        )
        .join(Venda)
        .filter(
            Venda.criado_em >= inicio,
            Venda.criado_em < fim
        )
        .group_by(ItemVenda.produto_nome)
        .order_by(
            func.sum(
                ItemVenda.quantidade
            ).desc()
        )
        .limit(5)
        .all()
    )

    produtos_pdv = [
        {
            "id": produto.id,
            "nome": produto.nome,
            "preco": float(produto.preco or 0),
            "estoque": int(produto.estoque_atual or 0),
        }
        for produto in produtos
    ]

    venda_criada = request.query_params.get("venda_id")

    return templates.TemplateResponse(
        request,
        "pdv/index.html",
        {
            "request": request,
            "usuario": usuario,
            "produtos": produtos,
            "clientes": clientes,
            "desconto_associado": DESCONTO_ASSOCIADO,
            "vendas": vendas,
            "resumos": resumos,
            "top_produtos": top_produtos,
            "mes_selecionado": mes_selecionado,
            "busca": busca,
            "produtos_pdv": produtos_pdv,
            "venda_criada": venda_criada,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "total_vendas": total_vendas,
        }
    )


@router.post("/finalizar")
def finalizar_venda(
    request: Request,
    carrinho_json: str = Form(...),
    cliente_id: int = Form(0),
    observacao: str = Form(""),
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_logado)
):
    try:
        itens = json.loads(carrinho_json)
    except (json.JSONDecodeError, ValueError):
        return RedirectResponse(
            url="/pdv/?erro=json",
            status_code=302
        )

    if not isinstance(itens, list) or not itens:
        return RedirectResponse(
            url="/pdv/?erro=vazio",
            status_code=302
        )

    cliente = None
    desconto_percentual = 0.0

    if cliente_id:
        cliente = (
            db.query(Cliente)
            .filter(
                Cliente.id == cliente_id,
                Cliente.ativo == True
            )
            .first()
        )

        if cliente and cliente.is_associado:
            desconto_percentual = DESCONTO_ASSOCIADO

    total_bruto = 0.0
    itens_validados = []

    try:

        for item in itens:

            produto_id = int(item["produto_id"])
            quantidade = int(item["quantidade"])

            produto = (
                db.query(Produto)
                .filter(
                    Produto.id == produto_id,
                    Produto.ativa == True
                )
                .with_for_update()
                .first()
            )

            if not produto:
                return RedirectResponse(
                    url=f"/pdv/?erro=produto_inexistente&id={produto_id}",
                    status_code=302
                )

            if quantidade <= 0:
                return RedirectResponse(
                    url="/pdv/?erro=quantidade",
                    status_code=302
                )

            if produto.estoque_atual < quantidade:
                return RedirectResponse(
                    url=f"/pdv/?erro=estoque&produto={produto.nome}",
                    status_code=302
                )

            preco = float(produto.preco or 0)

            subtotal = preco * quantidade

            total_bruto += subtotal

            itens_validados.append({
                "produto": produto,
                "quantidade": quantidade,
                "preco": preco,
                "produto_nome": produto.nome,
            })

        desconto_valor = (
            total_bruto *
            (desconto_percentual / 100)
        )

        total_liquido = (
            total_bruto -
            desconto_valor
        )

        usuario_id = None

        if isinstance(usuario, dict):
            usuario_id = usuario.get("id")

        elif hasattr(usuario, "id"):
            usuario_id = usuario.id

        venda = Venda(
            cliente_id=cliente_id or None,
            usuario_id=usuario_id,
            desconto_percentual=desconto_percentual,
            total_bruto=round(total_bruto, 2),
            total_liquido=round(total_liquido, 2),
            observacao=observacao or None,
        )

        db.add(venda)

        # Gera o ID da venda
        db.flush()

        for item in itens_validados:

            item_venda = ItemVenda(
                venda_id=venda.id,
                produto_id=item["produto"].id,
                produto_nome=item["produto_nome"],
                quantidade=item["quantidade"],
                preco_unitario=item["preco"],
            )

            db.add(item_venda)

            item["produto"].estoque_atual -= item["quantidade"]

        db.commit()

        venda_id = venda.id

        return RedirectResponse(
            url=f"/pdv/?criado=ok&venda_id={venda_id}",
            status_code=302
        )

    except Exception as e:

        db.rollback()

        print("ERRO AO FINALIZAR VENDA:")
        print(e)

        return RedirectResponse(
            url="/pdv/?erro=interno",
            status_code=302
        )


# ============================================================
# COMPROVANTE EM JSON
# ============================================================

@router.get("/venda/{venda_id}/json")
def detalhe_venda_json(
    venda_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_logado)
):

    try:

        venda = (
            db.query(Venda)
            .filter(Venda.id == venda_id)
            .first()
        )

        if not venda:
            return JSONResponse(
                status_code=404,
                content={
                    "erro": True,
                    "mensagem": "Venda não encontrada."
                }
            )

        # ----------------------------
        # CLIENTE
        # ----------------------------

        if venda.cliente:
            nome_cliente = venda.cliente.nome
        else:
            nome_cliente = "Cliente Balcão"

        # ----------------------------
        # OPERADOR
        # ----------------------------

        if venda.usuario:
            nome_operador = venda.usuario.nome
        else:
            nome_operador = "-"

        # ----------------------------
        # ITENS
        # ----------------------------

        itens = []

        for item in venda.itens:

            preco = float(
                item.preco_unitario or 0
            )

            quantidade = int(
                item.quantidade or 0
            )

            subtotal = preco * quantidade

            itens.append({
                "produto_nome": item.produto_nome,
                "quantidade": quantidade,
                "preco_unitario": round(preco, 2),
                "subtotal": round(subtotal, 2)
            })

        # ----------------------------
        # RESPOSTA
        # ----------------------------

        return {
            "id": venda.id,

            "cliente": nome_cliente,

            "operador": nome_operador,

            "data": (
                venda.criado_em.strftime(
                    "%d/%m/%Y %H:%M"
                )
                if venda.criado_em
                else "-"
            ),

            "observacao": (
                venda.observacao
                or ""
            ),

            "total_bruto": float(
                venda.total_bruto or 0
            ),

            "desconto_percentual": float(
                venda.desconto_percentual or 0
            ),

            "total_liquido": float(
                venda.total_liquido or 0
            ),

            "itens": itens
        }

    except Exception as e:

        print("ERRO AO CARREGAR COMPROVANTE:")
        print(e)

        return JSONResponse(
            status_code=500,
            content={
                "erro": True,
                "mensagem": "Erro interno ao carregar comprovante."
            }
        )

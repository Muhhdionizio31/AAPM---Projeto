from fastapi import FastAPI, Form, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from app.auth import get_usuario_logado, get_usuario_opcional
from sqlalchemy import func
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware

from app.controllers import auth_controller
from app.controllers import admin_controller
from app.controllers import categoria_controller
from app.controllers import produto_controller
from app.controllers import variacao_controller
from app.controllers import movimentacao_controller
from app.controllers import cliente_controller
from app.controllers import pdv_controllers


from dotenv import load_dotenv
import os
from app.database import get_db
from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.models.produto import Produto
from app.models.venda import Venda, ItemVenda


load_dotenv()

app = FastAPI(title="AAPM - Senai")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(categoria_controller.router)
app.include_router(produto_controller.router)
app.include_router(variacao_controller.router)
app.include_router(movimentacao_controller.router)
app.include_router(cliente_controller.router)
app.include_router(pdv_controllers.router)



#Rota para a página inicial
@app.get("/")
def home(
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_opcional)
    ):
    
    #Não logado
    if usuario is None:
        return templates.TemplateResponse(
            request,
            "site/index.html",
            {"request": request}       
        )
    
    total_produtos = db.query(func.count(Produto.estoque_atual)).scalar() or 0
    estoque_critico = db.query(Produto).filter(Produto.estoque_atual <= 7).count()
    produtos_recentes = db.query(Produto).order_by(Produto.id.desc()).limit(5).all()
    receita_total = db.query(func.sum(Produto.estoque_atual * Produto.preco)).scalar() or 0

    mes_atual = datetime.now().month
    ano_atual = datetime.now().year
    total_vendas_mes = db.query(Venda).filter(
        func.extract('month', Venda.criado_em) == mes_atual,
        func.extract('year', Venda.criado_em) == ano_atual
    ).count()
    
    ultimas_vendas = (db.query(ItemVenda).join(Venda).order_by(Venda.criado_em.desc()).limit(5).all())

    # ── 4. GRÁFICO: VENDAS POR MÊS ──
    vendas_por_mes_dados = db.query(func.extract('month', Venda.criado_em).label('mes'),
        func.count(Venda.id).label('total')).filter(func.extract('year', Venda.criado_em) == ano_atual).group_by('mes').all()

    vendas_mensais_lista = [0] * 12
    for dado in vendas_por_mes_dados:
        if dado.mes:
            vendas_mensais_lista[int(dado.mes) - 1] = dado.total
    
    # GRÁFICO DE ROSCA: CATEGORIAS MAIS VENDIDAS
    try:
        dados_categorias = db.query(Produto.categoria,func.count(Produto.id)).group_by(Produto.categoria).all()
        # Vamos organizar os dados para o formato que o Chart.js espera:
        categorias_labels = []
        categorias_valores = []

        for cat, qtd in dados_categorias:
            if cat is True or cat == "True" or cat == "true":
                nome_cat = "Material Escolar" 
            elif cat is False or cat == "False" or cat == "false" or not cat:
                nome_cat = "Outros"
            else:
                nome_cat = str(cat)
            categorias_labels.append(nome_cat)
            categorias_valores.append(qtd)

    except Exception as e:
        print(f"Erro ao computar categorias: {e}")
        categorias_labels = ["Sem dados"]
        categorias_valores = [1]

          # Se o banco estiver totalmente vazio, colocamos um valor padrão para o gráfico não quebrar
    if not categorias_labels or not categorias_valores:
            categorias_labels = ["Sem Itens"]
            categorias_valores = [1]

    return templates.TemplateResponse(
        request,
        "painel/index.html",
        {
            "request": request, 
            "usuario": usuario,
            "produtos_em_estoque": total_produtos,
            "estoque_critico": estoque_critico,
            "produtos_recentes": produtos_recentes,
            "receita_total": receita_total,
            "total_vendas_mes": total_vendas_mes,
            "ultimas_vendas": ultimas_vendas,
            "vendas_mensais_lista": vendas_mensais_lista,
            "categorias_labels": categorias_labels,
            "categorias_valores": categorias_valores,
        }       
    )

# Rota para o horário de atendimento
@app.get("/horario")
def horario(
    request: Request,
    usuario = Depends(get_usuario_opcional)
):
    return templates.TemplateResponse(
        request,
        "site/horario.html",
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
        "site/catalogo.html",
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
        "site/politica.html",
        {"request": request, "usuario": usuario}
    )

# Rota para acesso não autenticado
ROTAS_PUBLICAS = ["/auth/login","/static", "politica", "horario", "catalogo"]

@app.middleware("http")
async def verificar_login_middleware(request: Request, call_next):
    path = request.url.path

    if path == "/" or any(path.startswith(rota) for rota in ROTAS_PUBLICAS):
        return await call_next(request)
    
    usuario_logado = request.cookies.get("access_token")

    if not usuario_logado:
        return RedirectResponse(url="/auth/login", status_code=302)

    response = await call_next(request)
    return response
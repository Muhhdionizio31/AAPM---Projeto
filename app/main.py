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
from sqlalchemy.orm import Session, joinedload

from app.models.categoria import Categoria
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
    usuario = Depends(get_usuario_opcional)
):
    return templates.TemplateResponse(
        request,
        "painel/index.html",
        {"request": request, 
         "usuario": usuario
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
    usuario = Depends(get_usuario_opcional),
    db: Session = Depends(get_db) 
):
    categorias = db.query(Categoria).all()
    produtos = (db.query(Produto).filter(Produto.ativa == True).options(joinedload(Produto.categoria)).all())

    return templates.TemplateResponse(
        request,
        "site/catalogo.html",
        {
            "request": request, 
            "usuario": usuario,
            "produtos": produtos,
            "categorias": categorias
        }
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
ROTAS_PUBLICAS = ["/auth/login","/static", "/politica", "/horario", "/catalogo"]

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



@app.get("/painel")
def visualizar_painel(
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_opcional)
):

    # ── 2. CARDS DE MÉTRICAS EM TEMPO REAL ──
    total_produtos = db.query(func.count(Produto.id)).scalar() or 0
    estoque_critico = db.query(Produto).filter(Produto.estoque_atual <= 7).count()
    produtos_recentes = db.query(Produto).order_by(Produto.id.desc()).limit(5).all()
    receita_total = db.query(func.sum(Produto.estoque_atual * Produto.preco)).scalar() or 0.0

    agora = datetime.now()
    mes_atual = agora.month
    ano_atual = agora.year
    
    total_vendas_mes = db.query(Venda).filter(
        func.extract('month', Venda.criado_em) == mes_atual,
        func.extract('year', Venda.criado_em) == ano_atual
    ).count()
    
    # Últimas 5 vendas para a tabela
    ultimas_vendas = db.query(ItemVenda).join(Venda).order_by(Venda.criado_em.desc()).limit(5).all()

    # ── 3. GRÁFICO DE VENDAS MENSAIS (BARRAS) ──
    vendas_por_mes_dados = db.query(
        func.extract('month', Venda.criado_em).label('mes'),
        func.count(Venda.id).label('total')
    ).filter(
        func.extract('year', Venda.criado_em) == ano_atual
    ).group_by('mes').all()

    vendas_mensais_lista = [0] * 12
    for dado in vendas_por_mes_dados:
        if dado.mes is not None:
            try:
                index_mes = int(float(dado.mes)) - 1
                if 0 <= index_mes < 12:
                    vendas_mensais_lista[index_mes] = dado.total
            except (ValueError, TypeError):
                continue
    
    # ── 4. GRÁFICO DE RECEITA DOS ÚLTIMOS 6 MESES (LINHA) ──
    receita_mensal_lista = [0.0] * 6
    meses_labels = []
    nomes_meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    for i in range(5, -1, -1):
        ano_alvo = ano_atual
        mes_alvo = mes_atual - i
        if mes_alvo <= 0:
            mes_alvo += 12
            ano_alvo -= 1
            
        meses_labels.append(nomes_meses[mes_alvo - 1])
        
        faturamento_mes = db.query(
            func.sum(ItemVenda.preco_unitario * ItemVenda.quantidade)
        ).join(Venda).filter(
            func.extract('month', Venda.criado_em) == mes_alvo,
            func.extract('year', Venda.criado_em) == ano_alvo
        ).scalar() or 0.0
        
        receita_mensal_lista[5 - i] = float(faturamento_mes)

    # ── 5. SEPARADO POR QUANTIDADE DE CATEGORIAS CADASTRADAS (ROSCA) ──
    try:
        # 1. Buscamos a partir da tabela Categoria para garantir que TODAS apareçam
        # 2. Fazemos um LEFT JOIN com Produto para contar quantos pertencem a cada uma
        # (Ajuste o nome do seu model 'Categoria' se ele for diferente)
        dados_categorias = db.query(
            Categoria.nome.label('categoria_nome'), 
            func.count(Produto.id).label('total_produtos')
        ).select_from(Categoria)\
         .outerjoin(Produto, Produto.categoria_id == Categoria.id)\
         .group_by(Categoria.id, Categoria.nome).all()
        
        categorias_labels = []
        categorias_valores = []

        for item in dados_categorias:
            # Pega o nome da categoria cadastrada
            nome_cat = str(item.categoria_nome).strip() if item.categoria_nome else "Sem Nome"
            # Pega a quantidade real de produtos nela (retorna 0 se não houver nenhum)
            qtd_produtos = item.total_produtos or 0
            
            categorias_labels.append(nome_cat)
            categorias_valores.append(qtd_produtos)

    except Exception as e:
        print(f"Erro ao mapear estrutura de categorias: {e}")
        # Caso suas tabelas não tenham relacionamento direto por ID ainda,
        # este fallback mantém o agrupamento antigo por texto para o sistema não travar:
        dados_fallback = db.query(Produto.categoria, func.count(Produto.id)).group_by(Produto.categoria).all()
        categorias_labels = [str(c).strip() if c else "Outros" for c, _ in dados_fallback]
        categorias_valores = [q for _, q in dados_fallback]

    # Prevenção padrão caso o banco de categorias esteja totalmente vazio
    if not categorias_labels:
        categorias_labels = ["Nenhuma Categoria Cadastrada"]
        categorias_valores = [0]

    # ── 6. RETORNO DO CONTEXTO ──
    return templates.TemplateResponse(
        request=request,
        name="painel/index.html",
        context={
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
            "receita_mensal_lista": receita_mensal_lista,
            "meses_labels": meses_labels
        }       
    )

# ─── EXTRA: ROTAS API (Para atualizar os gráficos via JS/Fetch se necessário) ───

@app.get("/api/vendas-mensais")
def api_vendas_mensais(db: Session = Depends(get_db)):
    ano_atual = datetime.now().year
    dados = db.query(
        func.extract('month', Venda.criado_em).label('mes'),
        func.count(Venda.id).label('total')
    ).filter(func.extract('year', Venda.criado_em) == ano_atual).group_by('mes').all()
    
    lista = [0] * 12
    for d in dados:
        if d.mes:
            lista[int(float(d.mes)) - 1] = d.total
    return {"vendas": lista}
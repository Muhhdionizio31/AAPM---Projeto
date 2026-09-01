import os
import math
import shutil
import uuid
import json

from typing import Optional
from fastapi import APIRouter, Depends, Request, Form, UploadFile, File, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi import APIRouter, Depends, HTTPException, Request, Form, UploadFile, File, status
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produto import Produto
from app.models.categoria import Categoria
from app.auth import get_usuario_logado, get_admin
from app.models.produto_variacao import ProdutoVariacao
from app.services.estoque_service import recalcular_estoque_produto

router = APIRouter(prefix="/produtos", tags=["Produtos"])

templates = Jinja2Templates(directory="app/templates")

# Pasta onde as imagens serão salvas dentro de /static
UPLOAD_DIR = "app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================================================
# LISTAGEM
# ============================================================

@router.get("")
def listar_produtos(
    request: Request,
    busca: str = "",
    categoria_id: int = 0,
    status: str = "ativos",
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 15,
    usuario = Depends(get_usuario_logado)
):
    query = db.query(Produto)

    if status == "inativos":
        query = query.filter(Produto.ativa == False)
    elif status == "ativos":
        query = query.filter(Produto.ativa == True)
    else:
        status = "todos"

    if busca:
        query = query.filter(Produto.nome.ilike(f"%{busca}%"))

    if categoria_id:
        query = query.filter(Produto.categoria_id == categoria_id)


    total_produtos = query.count()
    page = max(page, 1)
    per_page = max(per_page, 1)
    total_pages = math.ceil(total_produtos / per_page) if total_produtos else 1
    page = min(page, total_pages)
    offset = (page - 1) * per_page
    produtos    = query.offset(offset).limit(per_page).all()
    categorias  = db.query(Categoria).filter(Categoria.ativa == True).all()

    return templates.TemplateResponse(
        request,
        "produtos/index.html",
        {
            "request":      request,
            "usuario":      usuario,
            "produtos":     produtos,
            "categorias":   categorias,
            "busca":        busca,
            "categoria_id": categoria_id,
            "status_atual": status,
            "page":         page,
            "per_page":     per_page,
            "total_pages":  total_pages,
            "total_produtos": total_produtos
        }
    )


# ============================================================
# CADASTRO
# ============================================================

@router.get("/novo")
def form_novo_produto(
    request: Request,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    categorias = db.query(Categoria).filter(Categoria.ativa == True).all()

    return templates.TemplateResponse(
        request,
        "produtos/form.html",
        {
            "request":    request,
            "usuario":    admin,
            "editando":   None,
            "categorias": categorias
        }
    )


@router.post("/novo")
async def criar_produto(
    nome: str = Form(...),
    categoria_id: int = Form(...),
    preco: float = Form(...),
    estoque_atual: int = Form(...),
    descricao: Optional[str] = Form(""),
    variacoes_json: Optional[str] = Form(None), 
    imagem: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # 1. Processa a imagem usando a sua função auxiliar
    # Se nenhuma imagem foi enviada, nome_imagem será None (já que não é obrigatória)
    nome_imagem = await _salvar_imagem(imagem)
    
    # 2. Cria e salva o produto pai usando a coluna real 'imagem_path'
    novo_produto = Produto(
        nome=nome,
        categoria_id=categoria_id,
        preco=preco,
        estoque_atual=estoque_atual,
        descricao=descricao,
        ativa=True,
        imagem_path=nome_imagem  # Grava None ou o caminho relativo correto ("uploads/nome_unico.png")
    )
    db.add(novo_produto)
    db.flush() 

    # 3. Salva variações se enviadas (disponível para todas as categorias)
    if variacoes_json:
        try:
            lista_variacoes = json.loads(variacoes_json)
            if lista_variacoes:
                total_grade = 0
                for item in lista_variacoes:
                    tam = str(item.get("tamanho", "")).strip()
                    qtd = int(item.get("estoque_atual", 0))
                    if tam:
                        nova_var = ProdutoVariacao(
                            produto_id=novo_produto.id,
                            tamanho=tam,
                            estoque_atual=qtd,
                            ativa=True
                        )
                        db.add(nova_var)
                        total_grade += qtd
                db.flush()
                novo_produto.estoque_atual = total_grade
                recalcular_estoque_produto(db, novo_produto.id)
        except Exception as e:
            db.rollback()
            return JSONResponse(
                content={"status": "erro", "detalhe": f"Erro nas variações: {str(e)}"}, 
                status_code=400
            )

    db.commit()
    
    # Retorna uma resposta JSON de sucesso para o Fetch do JS atualizar a página
    return JSONResponse(
        content={"status": "sucesso", "mensagem": "Produto criado com sucesso!"}, 
        status_code=201
    )


# ============================================================
# VARIAÇÕES DO PRODUTO (JSON)
# ============================================================
@router.get("/{produto_id}/variacoes")
def obter_variacoes_produto(
    produto_id: int,
    db: Session = Depends(get_db)
):
    variacoes = db.query(ProdutoVariacao).filter(
        ProdutoVariacao.produto_id == produto_id,
        ProdutoVariacao.ativa == True
    ).all()
    return [
        {
            "id": v.id,
            "tamanho": v.tamanho,
            "estoque_atual": v.estoque_atual
        }
        for v in variacoes
    ]


# DETALHE
@router.get("/{produto_id}")
def detalhe_produto(
    produto_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    produto = db.query(Produto).filter(
        Produto.id == produto_id,
        Produto.ativa == True
    ).first()

    if not produto:
        return RedirectResponse(url="/produtos", status_code=302)

    return templates.TemplateResponse(
        request,
        "produtos/detalhe.html",
        {"request": request, "usuario": usuario, "produto": produto}
    )



# EDIÇÃO
@router.get("/{produto_id}/editar")
def form_editar_produto(
    produto_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    editando   = db.query(Produto).filter(Produto.id == produto_id).first()
    categorias = db.query(Categoria).filter(Categoria.ativa == True).all()

    if not editando:
        return RedirectResponse(url="/produtos", status_code=302)

    return templates.TemplateResponse(
        request,
        "produtos/form.html",
        {
            "request":    request,
            "usuario":    admin,
            "editando":   editando,
            "categorias": categorias
        }
    )


@router.post("/{produto_id}/editar")
async def editar_produto(
    produto_id: int,
    nome: str = Form(...),
    categoria_id: int = Form(...),
    preco: float = Form(...),
    estoque_atual: int = Form(0), 
    variacoes_json: Optional[str] = Form(None),
    imagem: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    # =========================================================
    # 1. ATUALIZAÇÃO GERAL (Roda para TODOS os produtos)
    # =========================================================
    produto.nome = nome
    produto.categoria_id = categoria_id
    produto.preco = preco

    if imagem and imagem.filename:
        nova_img = await _salvar_imagem(imagem)
        if nova_img:
            _remover_imagem(produto.imagem_path)
            produto.imagem_path = nova_img

    # =========================================================
    # 2. LOGICA DE VARIÁÇÕES (Disponível para TODAS as categorias)
    # =========================================================
    if variacoes_json:
        try:
            lista_variacoes = json.loads(variacoes_json)
            tamanhos_enviados = [str(item.get("tamanho")).strip() for item in lista_variacoes if str(item.get("tamanho", "")).strip()]

            # Desativamos apenas os tamanhos que o usuário removeu da tela
            if tamanhos_enviados:
                db.query(ProdutoVariacao).filter(
                    ProdutoVariacao.produto_id == produto_id,
                    ProdutoVariacao.ativa == True,
                    ~ProdutoVariacao.tamanho.in_(tamanhos_enviados)
                ).update({"ativa": False}, synchronize_session=False)

            from sqlalchemy import func
            total_grade = 0
            for item in lista_variacoes:
                tamanho_nome = str(item.get("tamanho")).strip()
                if not tamanho_nome:
                    continue
                qtd = int(item.get("estoque_atual", 0))
                total_grade += qtd
                
                var_existente = db.query(ProdutoVariacao).filter(
                    ProdutoVariacao.produto_id == produto_id, 
                    func.trim(ProdutoVariacao.tamanho) == tamanho_nome
                ).first()
                
                if var_existente:
                    var_existente.estoque_atual = qtd
                    var_existente.ativa = True  
                else:
                    nova_var = ProdutoVariacao(
                        produto_id=produto_id,
                        tamanho=tamanho_nome,
                        estoque_atual=qtd,
                        ativa=True
                    )
                    db.add(nova_var)
            
            db.flush()
            
            if lista_variacoes:
                produto.estoque_atual = total_grade
            
            try:
                recalcular_estoque_produto(db, produto_id)
            except Exception:
                pass 

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Erro na edição da grade: {str(e)}")
    elif estoque_atual is not None:
        produto.estoque_atual = estoque_atual

    # =========================================================
    # 3. SALVAMENTO DEFINITIVO (Fora dos blocos, salva qualquer caso)
    # =========================================================
    db.commit() 
    return JSONResponse(
        content={"status": "sucesso", "mensagem": "Produto atualizado com sucesso!"}, 
        status_code=200
    )
# ============================================================
# DESATIVAR
# ============================================================

@router.post("/{produto_id}/desativar")
def desativar_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()

    if produto:
        produto.ativa = False
        db.commit()

    return RedirectResponse(url="/produtos?desativado=ok", status_code=302)

@router.post("/{produto_id}/ativar")
def ativar_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()

    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    produto.ativa = True  # Altera para True para reativar o produto
    db.commit()

    # Redireciona com um parâmetro indicando que foi ativado com sucesso
    return RedirectResponse(url="/produtos?ativado=ok", status_code=status.HTTP_302_FOUND)

@router.post("/{produto_id}/excluir")
def excluir_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()

    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    db.delete(produto)  # Remove o registro fisicamente do banco de dados
    db.commit()

    # Redireciona com um parâmetro indicando que foi excluído com sucesso
    return RedirectResponse(url="/produtos?excluido=ok", status_code=status.HTTP_302_FOUND)


# ============================================================
# FUNÇÕES AUXILIARES DE IMAGEM
# ============================================================

async def _salvar_imagem(imagem: UploadFile | None):
    """
    Salva o arquivo enviado em /static/uploads/ e retorna
    o path relativo para guardar no banco..
    """
    # UploadFile com filename vazio = campo não preenchido
    if not imagem or not imagem.filename:
        return None

    # Valida a extensão — aceita apenas imagens
    extensoes_permitidas = {".jpg", ".jpeg", ".png", ".webp"}
    _, ext = os.path.splitext(imagem.filename.lower())

    if ext not in extensoes_permitidas:
        return None

    # Garante nome de arquivo único usando o nome original
    nome_arquivo = f"{uuid.uuid4()}{ext}"
    caminho_completo = os.path.join(UPLOAD_DIR, nome_arquivo)

    # Salva o arquivo no disco
    with open(caminho_completo, "wb") as buffer:
        shutil.copyfileobj(imagem.file, buffer)

    # Retorna o path relativo ao /static (para montar a URL)
    return f"uploads/{nome_arquivo}"


def _remover_imagem(imagem_path: str | None) -> None:
    """Remove o arquivo de imagem do disco se ele existir."""
    if not imagem_path:
        return

    caminho = os.path.join("app/static", imagem_path)

    if os.path.exists(caminho):
        os.remove(caminho)

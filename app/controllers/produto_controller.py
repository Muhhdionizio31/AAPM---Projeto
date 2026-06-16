import os
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
    usuario = Depends(get_usuario_logado)
):
    query = db.query(Produto)

    if status == "inativos":
        produtos = query.filter(Produto.ativa == False).all()
    else:
        produtos = query.filter(Produto.ativa == True).all()

    if busca:
        query = query.filter(Produto.nome.ilike(f"%{busca}%"))

    if categoria_id:
        query = query.filter(Produto.categoria_id == categoria_id)

    produtos    = query.order_by(Produto.nome).all()
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
            "status_atual": status
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

    # 3. Se for categoria de Uniformes (10), insere as variações associadas
    if categoria_id == 10 and variacoes_json:
        try:
            lista_variacoes = json.loads(variacoes_json)
            for item in lista_variacoes:
                nova_var = ProdutoVariacao(
                    produto_id=novo_produto.id,
                    tamanho=str(item.get("tamanho")).upper(),
                    estoque_atual=int(item.get("estoque_atual", 0)),
                    ativa=True
                )
                db.add(nova_var)
            db.flush()
            
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

    # Se NÃO for vestuário, o estoque vem direto do campo comum do formulário
    if categoria_id != 10:
        produto.estoque_atual = estoque_atual

    # =========================================================
    # 2. LOGICA DE VARIÁÇÕES (Roda APENAS para Vestuário)
    # =========================================================
    if categoria_id == 10 and variacoes_json:
        try:
            lista_variacoes = json.loads(variacoes_json)
            
            # Mapeia os tamanhos que vieram do Front-end nesta edição
            tamanhos_enviados = [str(item.get("tamanho")).upper().strip() for item in lista_variacoes if item.get("tamanho")]

            # Desativamos apenas os tamanhos que o usuário removeu da tela
            if tamanhos_enviados:
                db.query(ProdutoVariacao).filter(
                    ProdutoVariacao.produto_id == produto_id,
                    ProdutoVariacao.ativa == True,
                    ~ProdutoVariacao.tamanho.in_(tamanhos_enviados)
                ).update({"ativa": True}, synchronize_session=False)

            from sqlalchemy import func
            # Atualiza ou Cria as variações enviadas
            for item in lista_variacoes:
                tamanho_nome = str(item.get("tamanho")).upper().strip()
                qtd = int(item.get("estoque_atual", 0))
                
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
            
            # Força a soma manual do estoque para produtos com variação
            variacoes_ativas = db.query(ProdutoVariacao).filter(
                ProdutoVariacao.produto_id == produto_id,
                ProdutoVariacao.ativa == True
            ).all()
            
            produto.estoque_atual = sum(v.estoque_atual for v in variacoes_ativas)
            
            try:
                recalcular_estoque_produto(db, produto_id)
            except Exception:
                pass 

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Erro na edição da grade: {str(e)}")

    # =========================================================
    # 3. SALVAMENTO DEFINITIVO (Fora dos blocos, salva qualquer caso)
    # =========================================================
    db.commit() 
    return RedirectResponse(url="/produtos", status_code=status.HTTP_303_SEE_OTHER)
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
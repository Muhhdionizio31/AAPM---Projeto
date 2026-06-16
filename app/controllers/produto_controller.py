import os
import shutil
import uuid

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
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    query = db.query(Produto).filter(Produto.ativa == True)

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
    imagem: UploadFile = File(None), 
    db: Session = Depends(get_db),
    admin = Depends(get_admin),
    descricao: str = Form(""),
    tamanho: str = Form(None), # Recebe o tamanho enviado pelo JS (pode ser None)
):
    try:
        # 1. Tratar o caminho da imagem se ela existir
        imagem_path = None
        if imagem:
            # Sua lógica atual de salvar a imagem no disco vai aqui
            # Exemplo: imagem_path = f"img/produtos/{imagem.filename}"
            pass

    # Verifica duplicidade de nome
        if db.query(Produto).filter(Produto.nome.ilike(nome)).first():
            return templates.TemplateResponse(
                request,
                "produtos/index.html",
                    {
                    "request": request,
                    "usuario": admin,
                    "editando": None,
                    "categorias": categorias,
                    "erro": "Já existe um produto com este nome.",
                    "valores": {"nome": nome, "preco": preco,
                                "estoque_atual": estoque_atual,
                                "categoria_id": categoria_id}
                },
                status_code=400
            )
    
        # 2. Criar a instância do Produto Principal
        novo_produto = Produto(
            nome=nome,
            categoria_id=categoria_id,
            preco=preco,
            estoque_atual=estoque_atual if categoria_id != 10 else 0, # Se for vestuário, o estoque mestre pode ser 0 ou a soma das variações
            descricao=descricao,
            imagem_path=imagem_path,
            ativa=True
    )

        db.add(novo_produto)
        db.flush() # O flush gera o ID do produto sem fechar a transação no banco!

        # 3. Se a categoria for 10 e o tamanho foi enviado, cria a variação automaticamente
        if categoria_id == 10 and tamanho:
            # Corta a string para no máximo 5 caracteres para não estourar o limite do banco Column(String(5))
            tamanho_higienizado = tamanho.strip()[:5] 
            
            nova_variacao = ProdutoVariacao(
                produto_id=novo_produto.id, # Aqui acontece a mágica do relacionamento automático!
                tamanho=tamanho_higienizado,
                estoque_atual=estoque_atual, # O estoque digitado vai direto para a variação
                ativa=True
            )
            db.add(nova_variacao)

        # 4. Salva tudo definitivamente no banco de dados
        db.commit()
        db.refresh(novo_produto)

        return {"status": "sucesso", "produto_id": novo_produto.id}

    except Exception as e:
        db.rollback() # Desfaz qualquer alteração se der erro
        print(f"Erro ao salvar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_SERVER_ERROR,
            detail=f"Erro interno ao salvar produto: {str(e)}"
        )

    return RedirectResponse(url="/produtos?criado=ok", status_code=302)


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
    request: Request,
    nome: str          = Form(...),
    preco: float       = Form(...),
    estoque_atual: int = Form(...),
    categoria_id: int  = Form(0),
    imagem: UploadFile = File(None),
    db: Session        = Depends(get_db),
    admin              = Depends(get_admin)
):
    editando   = db.query(Produto).filter(Produto.id == produto_id).first()
    categorias = db.query(Categoria).filter(Categoria.ativa == True).all()

    if not editando:
        return RedirectResponse(url="/produtos", status_code=302)

    # Verifica conflito de nome com outro produto
    conflito = db.query(Produto).filter(
        Produto.nome.ilike(nome),
        Produto.id != produto_id
    ).first()

    if conflito:
        return templates.TemplateResponse(
            request,
            "produtos/form.html",
            {
                "request":    request,
                "usuario":    admin,
                "editando":   editando,
                "categorias": categorias,
                "erro":       "Já existe outro produto com este nome.",
            },
            status_code=400
        )

    # Processa nova imagem — só substitui se um arquivo foi enviado
    nova_imagem_path = await _salvar_imagem(imagem)
    if nova_imagem_path:
        # Remove a imagem antiga do disco para não acumular arquivos
        _remover_imagem(editando.imagem_path)
        editando.imagem_path = nova_imagem_path

    editando.nome = nome
    editando.preco = preco
    editando.estoque_atual = estoque_atual
    editando.categoria_id = categoria_id or None

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print("ERRO AO EDITAR:", repr(e))
        raise

    return RedirectResponse(
        url=f"/produtos/{produto_id}?editado=ok",
        status_code=302
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
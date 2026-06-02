from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import Session as SessionLocal
from app.models.produto import Produto
from app.models.produto_variacao import ProdutoVariacao
from app.services.estoque_service import recalcular_estoque_produto

router = APIRouter(
    prefix="/produto-variacoes",
    tags=["Produto Variações"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def criar_variacao(
    produto_id: int,
    tamanho: str,
    estoque_atual: int = 0,
    db: Session = Depends(get_db)
):

    produto = (
        db.query(Produto)
        .filter(Produto.id == produto_id)
        .first()
    )

    if not produto:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    existe = (
        db.query(ProdutoVariacao)
        .filter(
            ProdutoVariacao.produto_id == produto_id,
            ProdutoVariacao.tamanho == tamanho
        )
        .first()
    )

    if existe:
        raise HTTPException(
            status_code=400,
            detail=f"Já existe uma variação {tamanho} para este produto."
        )

    variacao = ProdutoVariacao(
        produto_id=produto_id,
        tamanho=tamanho.upper(),
        estoque_atual=estoque_atual,
        ativa=True
    )

    db.add(variacao)
    db.flush()

    recalcular_estoque_produto(
        db,
        produto_id
    )

    db.commit()
    db.refresh(variacao)

    return variacao


@router.get("/")
def listar_variacoes(
    db: Session = Depends(get_db)
):

    return (
        db.query(ProdutoVariacao)
        .order_by(
            ProdutoVariacao.produto_id,
            ProdutoVariacao.tamanho
        )
        .all()
    )


@router.get("/{variacao_id}")
def buscar_variacao(
    variacao_id: int,
    db: Session = Depends(get_db)
):

    variacao = (
        db.query(ProdutoVariacao)
        .filter(
            ProdutoVariacao.id == variacao_id
        )
        .first()
    )

    if not variacao:
        raise HTTPException(
            status_code=404,
            detail="Variação não encontrada"
        )

    return variacao


@router.get("/produto/{produto_id}")
def listar_variacoes_produto(
    produto_id: int,
    db: Session = Depends(get_db)
):

    produto = (
        db.query(Produto)
        .filter(Produto.id == produto_id)
        .first()
    )

    if not produto:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    return (
        db.query(ProdutoVariacao)
        .filter(
            ProdutoVariacao.produto_id == produto_id
        )
        .order_by(
            ProdutoVariacao.tamanho
        )
        .all()
    )


@router.put("/{variacao_id}")
def atualizar_variacao(
    variacao_id: int,
    tamanho: str | None = None,
    estoque_atual: int | None = None,
    ativa: bool | None = None,
    db: Session = Depends(get_db)
):

    variacao = (
        db.query(ProdutoVariacao)
        .filter(
            ProdutoVariacao.id == variacao_id
        )
        .first()
    )

    if not variacao:
        raise HTTPException(
            status_code=404,
            detail="Variação não encontrada"
        )

    if tamanho is not None:
        variacao.tamanho = tamanho.upper()

    if estoque_atual is not None:
        variacao.estoque_atual = estoque_atual

    if ativa is not None:
        variacao.ativa = ativa

    recalcular_estoque_produto(
        db,
        variacao.produto_id
    )

    db.commit()
    db.refresh(variacao)

    return variacao


@router.put("/{variacao_id}/entrada")
def entrada_estoque(
    variacao_id: int,
    quantidade: int,
    db: Session = Depends(get_db)
):

    variacao = (
        db.query(ProdutoVariacao)
        .filter(
            ProdutoVariacao.id == variacao_id
        )
        .first()
    )

    if not variacao:
        raise HTTPException(
            status_code=404,
            detail="Variação não encontrada"
        )

    variacao.estoque_atual += quantidade

    recalcular_estoque_produto(
        db,
        variacao.produto_id
    )

    db.commit()

    return {
        "mensagem": "Entrada registrada",
        "estoque_variacao": variacao.estoque_atual
    }


@router.put("/{variacao_id}/saida")
def saida_estoque(
    variacao_id: int,
    quantidade: int,
    db: Session = Depends(get_db)
):

    variacao = (
        db.query(ProdutoVariacao)
        .filter(
            ProdutoVariacao.id == variacao_id
        )
        .first()
    )

    if not variacao:
        raise HTTPException(
            status_code=404,
            detail="Variação não encontrada"
        )

    if variacao.estoque_atual < quantidade:
        raise HTTPException(
            status_code=400,
            detail="Estoque insuficiente"
        )

    variacao.estoque_atual -= quantidade

    recalcular_estoque_produto(
        db,
        variacao.produto_id
    )

    db.commit()

    return {
        "mensagem": "Saída registrada",
        "estoque_variacao": variacao.estoque_atual
    }


@router.delete("/{variacao_id}")
def excluir_variacao(
    variacao_id: int,
    db: Session = Depends(get_db)
):

    variacao = (
        db.query(ProdutoVariacao)
        .filter(
            ProdutoVariacao.id == variacao_id
        )
        .first()
    )

    if not variacao:
        raise HTTPException(
            status_code=404,
            detail="Variação não encontrada"
        )

    produto_id = variacao.produto_id

    db.delete(variacao)
    db.flush()

    recalcular_estoque_produto(
        db,
        produto_id
    )

    db.commit()

    return {
        "mensagem": "Variação removida com sucesso"
    }
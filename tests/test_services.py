from app.models.categoria import Categoria
from app.models.produto import Produto
from app.models.produto_variacao import ProdutoVariacao
from app.services.estoque_service import recalcular_estoque_produto


def test_recalcular_estoque_soma_apenas_variacoes_ativas(db_session_test):
    categoria = Categoria(nome="Vestuário")
    db_session_test.add(categoria)
    db_session_test.flush()
    produto = Produto(nome="Camiseta", preco=30, estoque_atual=0, categoria_id=categoria.id)
    db_session_test.add(produto)
    db_session_test.flush()
    db_session_test.add_all([
        ProdutoVariacao(produto_id=produto.id, tamanho="P", estoque_atual=3, ativa=True),
        ProdutoVariacao(produto_id=produto.id, tamanho="M", estoque_atual=5, ativa=True),
        ProdutoVariacao(produto_id=produto.id, tamanho="G", estoque_atual=9, ativa=False),
    ])
    db_session_test.commit()

    recalcular_estoque_produto(db_session_test, produto.id)
    db_session_test.commit()
    db_session_test.refresh(produto)

    assert produto.estoque_atual == 8


def test_recalcular_estoque_ignora_produto_inexistente(db_session_test):
    recalcular_estoque_produto(db_session_test, 999)

    assert db_session_test.query(Produto).count() == 0

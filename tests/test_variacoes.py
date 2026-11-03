from app.models.categoria import Categoria
from app.models.produto import Produto
from app.models.produto_variacao import ProdutoVariacao


def criar_produto(db_session_test):
    categoria = Categoria(nome="Vestuário")
    db_session_test.add(categoria)
    db_session_test.flush()
    produto = Produto(nome="Camiseta", preco=30, estoque_atual=0, categoria_id=categoria.id)
    db_session_test.add(produto)
    db_session_test.commit()
    return produto


def criar_variacao(db_session_test, produto, tamanho="P", estoque=4):
    variacao = ProdutoVariacao(produto_id=produto.id, tamanho=tamanho, estoque_atual=estoque, ativa=True)
    db_session_test.add(variacao)
    db_session_test.commit()
    return variacao


def test_criar_variacao_recalcula_estoque_do_produto(cliente, db_session_test):
    produto = criar_produto(db_session_test)

    resposta = cliente.post("/produto-variacoes/", params={"produto_id": produto.id, "tamanho": "p", "estoque_atual": 5})

    db_session_test.refresh(produto)
    assert resposta.status_code == 200
    assert resposta.json()["tamanho"] == "P"
    assert produto.estoque_atual == 5


def test_criar_variacao_rejeita_produto_inexistente(cliente):
    resposta = cliente.post("/produto-variacoes/", params={"produto_id": 999, "tamanho": "P"})

    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "Produto não encontrado"


def test_criar_variacao_rejeita_tamanho_duplicado(cliente, db_session_test):
    produto = criar_produto(db_session_test)
    criar_variacao(db_session_test, produto)

    resposta = cliente.post("/produto-variacoes/", params={"produto_id": produto.id, "tamanho": "P"})

    assert resposta.status_code == 400


def test_listar_e_atualizar_variacao(cliente, db_session_test):
    produto = criar_produto(db_session_test)
    variacao = criar_variacao(db_session_test, produto)

    resposta_listagem = cliente.get(f"/produto-variacoes/produto/{produto.id}")
    resposta_atualizacao = cliente.put(
        f"/produto-variacoes/{variacao.id}",
        params={"tamanho": "m", "estoque_atual": 7},
    )

    db_session_test.refresh(produto)
    assert resposta_listagem.status_code == 200
    assert resposta_listagem.json()[0]["id"] == variacao.id
    assert resposta_atualizacao.json()["tamanho"] == "M"
    assert produto.estoque_atual == 7


def test_entrada_e_saida_de_variacao_atualizam_estoque(cliente, db_session_test):
    produto = criar_produto(db_session_test)
    variacao = criar_variacao(db_session_test, produto, estoque=4)

    resposta_entrada = cliente.put(f"/produto-variacoes/{variacao.id}/entrada", params={"quantidade": 3})
    resposta_saida = cliente.put(f"/produto-variacoes/{variacao.id}/saida", params={"quantidade": 5})

    db_session_test.refresh(produto)
    assert resposta_entrada.json()["estoque_variacao"] == 7
    assert resposta_saida.json()["estoque_variacao"] == 2
    assert produto.estoque_atual == 2


def test_saida_de_variacao_rejeita_estoque_insuficiente(cliente, db_session_test):
    produto = criar_produto(db_session_test)
    variacao = criar_variacao(db_session_test, produto, estoque=2)

    resposta = cliente.put(f"/produto-variacoes/{variacao.id}/saida", params={"quantidade": 3})

    assert resposta.status_code == 400
    assert resposta.json()["detail"] == "Estoque insuficiente"


def test_excluir_variacao_recalcula_estoque(cliente, db_session_test):
    produto = criar_produto(db_session_test)
    variacao = criar_variacao(db_session_test, produto, estoque=4)

    resposta = cliente.delete(f"/produto-variacoes/{variacao.id}")

    db_session_test.refresh(produto)
    assert resposta.status_code == 200
    assert db_session_test.get(ProdutoVariacao, variacao.id) is None
    assert produto.estoque_atual == 0

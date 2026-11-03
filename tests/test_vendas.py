import json

from app.models.categoria import Categoria
from app.models.cliente import Cliente
from app.models.produto import Produto
from app.models.venda import ItemVenda, Venda


def criar_produto(db_session_test, estoque=10, preco=20.0):
    categoria = Categoria(nome="Vestuário")
    db_session_test.add(categoria)
    db_session_test.flush()
    produto = Produto(nome="Camiseta", preco=preco, estoque_atual=estoque, categoria_id=categoria.id, ativa=True)
    db_session_test.add(produto)
    db_session_test.commit()
    return produto


def finalizar(cliente, produto, **dados):
    data = {
        "carrinho_json": json.dumps([{"produto_id": produto.id, "quantidade": 2}]),
        "forma_pagamento_1": "Dinheiro",
    }
    data.update(dados)
    return cliente.post("/pdv/finalizar", data=data, follow_redirects=False)


def test_finalizar_venda_cria_itens_e_baixa_estoque(cliente, db_session_test):
    produto = criar_produto(db_session_test)

    resposta = finalizar(cliente, produto)

    venda = db_session_test.query(Venda).one()
    item = db_session_test.query(ItemVenda).one()
    db_session_test.refresh(produto)
    assert resposta.headers["location"] == f"/pdv/?criado=ok&venda_id={venda.id}"
    assert venda.total_bruto == 40.0
    assert venda.total_liquido == 40.0
    assert item.quantidade == 2
    assert produto.estoque_atual == 8


def test_finalizar_venda_aplica_desconto_associado_e_calcula_troco(cliente, db_session_test):
    produto = criar_produto(db_session_test, preco=50)
    associado = Cliente(nome="Ana", matricula="2026001", is_associado=True, ativo=True)
    db_session_test.add(associado)
    db_session_test.commit()

    resposta = finalizar(cliente, produto, cliente_id=associado.id, valor_pagamento_1="100")

    venda = db_session_test.query(Venda).one()
    assert resposta.status_code == 302
    assert venda.desconto_percentual == 10.0
    assert venda.total_bruto == 100.0
    assert venda.total_liquido == 90.0
    assert venda.troco == 10.0


def test_finalizar_venda_aceita_pagamento_dividido(cliente, db_session_test):
    produto = criar_produto(db_session_test)

    finalizar(
        cliente,
        produto,
        forma_pagamento_1="Cartão",
        valor_pagamento_1="25",
        forma_pagamento_2="Pix",
        valor_pagamento_2="15",
    )

    venda = db_session_test.query(Venda).one()
    assert venda.forma_pagamento_2 == "Pix"
    assert venda.valor_pagamento_1 == 25.0
    assert venda.valor_pagamento_2 == 15.0
    assert venda.troco == 0.0


def test_finalizar_venda_rejeita_carrinho_invalido_e_estoque_insuficiente(cliente, db_session_test):
    produto = criar_produto(db_session_test, estoque=1)

    resposta_json = cliente.post("/pdv/finalizar", data={"carrinho_json": "invalido"}, follow_redirects=False)
    resposta_estoque = cliente.post(
        "/pdv/finalizar",
        data={"carrinho_json": json.dumps([{"produto_id": produto.id, "quantidade": 2}])},
        follow_redirects=False,
    )

    assert resposta_json.headers["location"] == "/pdv/?erro=json"
    assert resposta_estoque.headers["location"] == f"/pdv/?erro=estoque&produto={produto.nome}"
    assert db_session_test.query(Venda).count() == 0


def test_comprovante_json_retorna_dados_da_venda(cliente, db_session_test):
    produto = criar_produto(db_session_test)
    finalizar(cliente, produto, observacao="Retirar no balcão")
    venda = db_session_test.query(Venda).one()

    resposta = cliente.get(f"/pdv/venda/{venda.id}/json")

    dados = resposta.json()
    assert resposta.status_code == 200
    assert dados["id"] == venda.id
    assert dados["cliente"] == "Cliente Balcão"
    assert dados["observacao"] == "Retirar no balcão"
    assert dados["itens"] == [{"produto_nome": "Camiseta", "quantidade": 2, "preco_unitario": 20.0, "subtotal": 40.0}]

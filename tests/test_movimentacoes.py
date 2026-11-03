from app.models.categoria import Categoria
from app.models.movimentacao import Movimentacao, tipo_de_movimentacao
from app.models.produto import Produto
from fastapi.responses import JSONResponse, PlainTextResponse


def criar_produto(db_session_test, estoque=10):
    categoria = Categoria(nome="Papelaria")
    db_session_test.add(categoria)
    db_session_test.flush()
    produto = Produto(nome="Caderno", preco=15, estoque_atual=estoque, categoria_id=categoria.id, ativa=True)
    db_session_test.add(produto)
    db_session_test.commit()
    return produto


def test_registrar_entrada_atualiza_estoque_e_historico(cliente, db_session_test):
    produto = criar_produto(db_session_test)

    resposta = cliente.post(
        "/movimentacoes/nova",
        data={"produto_id": produto.id, "tipo": "entrada", "quantidade": 5, "preco_unitario": "12.5", "observacao": "Reposição"},
        follow_redirects=False,
    )

    db_session_test.refresh(produto)
    movimentacao = db_session_test.query(Movimentacao).one()
    assert resposta.headers["location"] == f"/produtos/{produto.id}?movimentacao=ok"
    assert produto.estoque_atual == 15
    assert movimentacao.tipo == tipo_de_movimentacao.ENTRADA
    assert movimentacao.observacao == "Reposição"


def test_registrar_saida_atualiza_estoque(cliente, db_session_test):
    produto = criar_produto(db_session_test)

    resposta = cliente.post(
        "/movimentacoes/nova",
        data={"produto_id": produto.id, "tipo": "saida", "quantidade": 3, "preco_unitario": "15"},
        follow_redirects=False,
    )

    db_session_test.refresh(produto)
    assert resposta.status_code == 302
    assert produto.estoque_atual == 7


def test_movimentacao_rejeita_tipo_quantidade_e_estoque_invalidos(cliente, db_session_test, monkeypatch):
    produto = criar_produto(db_session_test, estoque=2)
    monkeypatch.setattr(
        "app.controllers.movimentacao_controller.templates.TemplateResponse",
        lambda request, name, context, **kwargs: PlainTextResponse(context.get("erro", ""), status_code=kwargs.get("status_code", 200)),
    )

    tipo_invalido = cliente.post("/movimentacoes/nova", data={"produto_id": produto.id, "tipo": "ajuste", "quantidade": 1, "preco_unitario": 1})
    quantidade_invalida = cliente.post("/movimentacoes/nova", data={"produto_id": produto.id, "tipo": "entrada", "quantidade": 0, "preco_unitario": 1})
    estoque_insuficiente = cliente.post("/movimentacoes/nova", data={"produto_id": produto.id, "tipo": "saida", "quantidade": 3, "preco_unitario": 1})

    assert tipo_invalido.status_code == 400
    assert "Tipo de movimentação inválido." in tipo_invalido.text
    assert quantidade_invalida.status_code == 400
    assert "A quantidade deve ser maior que zero." in quantidade_invalida.text
    assert estoque_insuficiente.status_code == 400
    assert "Estoque insuficiente." in estoque_insuficiente.text


def test_historico_de_produto_exibe_entradas_e_saidas(cliente, db_session_test, monkeypatch):
    produto = criar_produto(db_session_test)
    db_session_test.add_all([
        Movimentacao(tipo=tipo_de_movimentacao.ENTRADA, quantidade=6, preco_unitario=10, produto_id=produto.id, usuario_id=1),
        Movimentacao(tipo=tipo_de_movimentacao.SAIDA, quantidade=2, preco_unitario=10, produto_id=produto.id, usuario_id=1),
    ])
    db_session_test.commit()
    monkeypatch.setattr(
        "app.controllers.movimentacao_controller.templates.TemplateResponse",
        lambda request, name, context: JSONResponse({"entradas": context["total_entradas"], "saidas": context["total_saidas"]}),
    )

    resposta = cliente.get(f"/movimentacoes/produto/{produto.id}")

    assert resposta.json() == {"entradas": 6, "saidas": 2}

from app.models.categoria import Categoria
from app.models.produto import Produto
from fastapi.responses import PlainTextResponse


def criar_categoria(db_session_test, nome="Uniformes", ativa=True):
    categoria = Categoria(nome=nome, ativa=ativa)
    db_session_test.add(categoria)
    db_session_test.commit()
    return categoria


def test_criar_categoria_com_sucesso(cliente, db_session_test):
    resposta = cliente.post("/categorias/nova", data={"nome": "Papelaria"}, follow_redirects=False)

    assert resposta.headers["location"] == "/categorias?criado=ok"
    assert db_session_test.query(Categoria).filter_by(nome="Papelaria").first() is not None


def test_criar_categoria_rejeita_nome_duplicado(cliente, db_session_test, monkeypatch):
    criar_categoria(db_session_test)
    monkeypatch.setattr(
        "app.controllers.categoria_controller.templates.TemplateResponse",
        lambda request, name, context, **kwargs: PlainTextResponse(context["erro"], status_code=kwargs["status_code"]),
    )

    resposta = cliente.post("/categorias/nova", data={"nome": "uniformes"})

    assert resposta.status_code == 400
    assert "Já existe uma categoria com este nome." in resposta.text


def test_editar_categoria_atualiza_nome(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)

    resposta = cliente.post(f"/categorias/{categoria.id}/editar", data={"nome": "Esportes"}, follow_redirects=False)

    db_session_test.refresh(categoria)
    assert resposta.headers["location"] == "/categorias?editado=ok"
    assert categoria.nome == "Esportes"


def test_editar_categoria_rejeita_nome_em_uso(cliente, db_session_test, monkeypatch):
    categoria = criar_categoria(db_session_test)
    outra = criar_categoria(db_session_test, nome="Papelaria")
    monkeypatch.setattr(
        "app.controllers.categoria_controller.templates.TemplateResponse",
        lambda request, name, context, **kwargs: PlainTextResponse(context["erro"], status_code=kwargs["status_code"]),
    )

    resposta = cliente.post(f"/categorias/{categoria.id}/editar", data={"nome": outra.nome})

    assert resposta.status_code == 400
    assert "Já existe outra categoria com este nome." in resposta.text


def test_nao_exclui_categoria_com_produtos(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    db_session_test.add(Produto(nome="Camiseta", preco=25, estoque_atual=3, categoria_id=categoria.id))
    db_session_test.commit()

    resposta = cliente.post(f"/categorias/{categoria.id}/deletar", follow_redirects=False)

    assert resposta.headers["location"] == "/categorias?erro=possui_produtos"
    assert db_session_test.get(Categoria, categoria.id) is not None


def test_toggle_categoria_bloqueia_desativacao_com_produto_ativo(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    db_session_test.add(Produto(nome="Camiseta", preco=25, estoque_atual=3, categoria_id=categoria.id, ativa=True))
    db_session_test.commit()

    resposta = cliente.post(f"/categorias/{categoria.id}/toggle-ativo", follow_redirects=False)

    assert resposta.headers["location"] == f"/categorias?erro=produtos_vinculados&categoria={categoria.nome}"
    assert categoria.ativa is True


def test_toggle_categoria_altera_status_sem_produtos_ativos(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)

    resposta = cliente.post(f"/categorias/{categoria.id}/toggle-ativo", follow_redirects=False)

    db_session_test.refresh(categoria)
    assert resposta.headers["location"] == "/categorias"
    assert categoria.ativa is False

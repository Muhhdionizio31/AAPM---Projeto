import json

from app.models.categoria import Categoria
from app.models.produto import Produto
from app.models.produto_variacao import ProdutoVariacao


def criar_categoria(db_session_test):
    categoria = Categoria(nome="Vestuário")
    db_session_test.add(categoria)
    db_session_test.commit()
    return categoria


def criar_produto(db_session_test, categoria, nome="Camiseta", estoque=10, ativa=True):
    produto = Produto(nome=nome, preco=30.0, estoque_atual=estoque, categoria_id=categoria.id, ativa=ativa)
    db_session_test.add(produto)
    db_session_test.commit()
    return produto


def test_detalhe_de_produto_inexistente_redireciona_para_listagem(cliente):
    resposta = cliente.get("/produtos/999", follow_redirects=False)

    assert resposta.headers["location"] == "/produtos"


def test_listagem_de_produtos_exibe_registro_ativo(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    produto = criar_produto(db_session_test, categoria)

    resposta = cliente.get("/produtos/")

    assert resposta.status_code == 200
    assert produto.nome in resposta.text


def test_listagem_filtra_produtos_inativos(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    criar_produto(db_session_test, categoria, nome="ProdutoAtivoTeste", ativa=True)
    criar_produto(db_session_test, categoria, nome="ProdutoInativoTeste", ativa=False)

    resposta = cliente.get("/produtos/", params={"status": "inativos"})

    assert "ProdutoInativoTeste" in resposta.text
    assert "ProdutoAtivoTeste" not in resposta.text


def test_editar_produto_atualiza_campos_basicos(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    produto = criar_produto(db_session_test, categoria)

    resposta = cliente.post(
        f"/produtos/{produto.id}/editar",
        data={"nome": "Camiseta Nova", "categoria_id": categoria.id, "preco": "42.50", "estoque_atual": "7"},
    )

    db_session_test.refresh(produto)
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "sucesso"
    assert produto.nome == "Camiseta Nova"
    assert produto.preco == 42.5
    assert produto.estoque_atual == 7


def test_editar_produto_atualiza_grade_e_recalcula_estoque(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    produto = criar_produto(db_session_test, categoria)
    db_session_test.add(ProdutoVariacao(produto_id=produto.id, tamanho="P", estoque_atual=2, ativa=True))
    db_session_test.commit()

    resposta = cliente.post(
        f"/produtos/{produto.id}/editar",
        data={
            "nome": produto.nome,
            "categoria_id": categoria.id,
            "preco": "30",
            "variacoes_json": json.dumps([{"tamanho": "P", "estoque_atual": 4}, {"tamanho": "M", "estoque_atual": 6}]),
        },
    )

    db_session_test.refresh(produto)
    assert resposta.status_code == 200
    assert produto.estoque_atual == 10
    assert {variacao.tamanho for variacao in produto.variacoes} == {"P", "M"}


def test_endpoint_de_variacoes_retorna_apenas_ativas(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    produto = criar_produto(db_session_test, categoria)
    db_session_test.add_all([
        ProdutoVariacao(produto_id=produto.id, tamanho="P", estoque_atual=2, ativa=True),
        ProdutoVariacao(produto_id=produto.id, tamanho="M", estoque_atual=3, ativa=False),
    ])
    db_session_test.commit()

    resposta = cliente.get(f"/produtos/{produto.id}/variacoes")

    assert resposta.json() == [{"id": 1, "tamanho": "P", "estoque_atual": 2}]


def test_desativar_e_ativar_produto_alteram_status(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    produto = criar_produto(db_session_test, categoria)

    resposta_desativar = cliente.post(f"/produtos/{produto.id}/desativar", follow_redirects=False)
    db_session_test.refresh(produto)
    resposta_ativar = cliente.post(f"/produtos/{produto.id}/ativar", follow_redirects=False)
    db_session_test.refresh(produto)

    assert resposta_desativar.headers["location"] == "/produtos?desativado=ok"
    assert resposta_ativar.headers["location"] == "/produtos?ativado=ok"
    assert produto.ativa is True


def test_excluir_produto_remove_registro(cliente, db_session_test):
    categoria = criar_categoria(db_session_test)
    produto = criar_produto(db_session_test, categoria)

    resposta = cliente.post(f"/produtos/{produto.id}/excluir", follow_redirects=False)

    assert resposta.headers["location"] == "/produtos?excluido=ok"
    assert db_session_test.get(Produto, produto.id) is None

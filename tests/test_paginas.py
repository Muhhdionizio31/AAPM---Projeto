from app.models.categoria import Categoria
from app.models.produto import Produto


def test_catalogo_exibe_apenas_produtos_ativos_e_aplica_busca(cliente, db_session_test):
    categoria = Categoria(nome="Papelaria")
    db_session_test.add(categoria)
    db_session_test.flush()
    db_session_test.add_all([
        Produto(nome="Caderno Especial", preco=12, estoque_atual=4, categoria_id=categoria.id, ativa=True),
        Produto(nome="Caderno Inativo", preco=12, estoque_atual=4, categoria_id=categoria.id, ativa=False),
    ])
    db_session_test.commit()

    resposta = cliente.get("/catalogo/", params={"busca": "Especial"})

    assert resposta.status_code == 200
    assert "Caderno Especial" in resposta.text
    assert "Caderno Inativo" not in resposta.text


def test_painel_e_api_de_vendas_mensais_respondem(cliente):
    painel = cliente.get("/painel")
    vendas_mensais = cliente.get("/api/vendas-mensais")

    assert painel.status_code == 200
    assert vendas_mensais.status_code == 200
    assert vendas_mensais.json() == {"vendas": [0] * 12}

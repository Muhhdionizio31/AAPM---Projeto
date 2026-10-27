from app.models.categoria import Categoria
from app.models.produto import Produto

# Teste para validar a tela inicial
def test_validar_tela_inicial_retorma_200(cliente):
    resposta = cliente.get("/")
    assert resposta.status_code == 200

# Tela de listar produtos funcionando
def test_validar_listagem_produtos(cliente):
    resposta = cliente.get("/produtos/")
    assert resposta.status_code == 200

# Teste validar produtos criado com sucesso
def test_pagina_produtos_lista_produtos_criados_com_sucesso(cliente, db_session_test):
    categoria_teste = Categoria(nome="Bonés")
    db_session_test.add(categoria_teste)
    db_session_test.commit()
    # Criar um produto associado à categoria
    produto_teste = Produto(nome="Boné Nike", preco=199.90, estoque_atual=10, categoria_id=categoria_teste.id)
    db_session_test.add(produto_teste)
    db_session_test.commit()

    resposta = cliente.get("/produtos/")
    assert "Boné Nike" in resposta.text

# Teste se a categoria criada aparece no HTML
def test_categoria_criada_aparece_no_html(cliente, db_session_test):
    # Criar uma categoria de teste
    categoria = Categoria(nome="Uniformes")
    db_session_test.add(categoria)
    db_session_test.commit()

    resposta = cliente.get("/categorias/")
    assert "Uniformes" in resposta.text

# Filtrar os dados dos produtos
def test_listar_produtos_com_filtro_de_busca(cliente, db_session_test):
   
    db_session_test.add_all(
        [
            Produto(nome="Camisa Senai", preco=49.90, estoque_atual=10, categoria_id=1),
            Produto(nome="Calça", preco=79.90, estoque_atual=5, categoria_id=1),
            Produto(nome="Tênis", preco=149.90, estoque_atual=8, categoria_id=1)
        ]
    )
    db_session_test.commit()

    #requisição com busca
    resposta = cliente.get("/produtos/?", params={"busca": "Camisa"})

    #teste
    assert "Camisa Senai" in resposta.text
    assert "Calça" not in resposta.text

# Criar um produto
def test_criar_produto_com_sucesso(cliente):
   
    resposta = cliente.post(
        "/produtos/",
        data={
            "nome": "Relógio",
            "preco": "299.90",
            "estoque_atual": "5"},
            follow_redirects=False
            )

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/produtos/?criado=ok"

    resposta_lista = cliente.get("/produtos")
    assert "Relógio" in resposta_lista.text
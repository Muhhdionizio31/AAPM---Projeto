from app.models.armario import Armario, StatusArmario
from app.models.cliente import Cliente
from app.models.movimentacao import Movimentacao, tipo_de_movimentacao
from app.models.produto import Produto
from app.models.venda import ItemVenda, Venda


def test_armario_disponivel_reflete_status_atual():
    armario = Armario(numero="A01", status=StatusArmario.DISPONIVEL)

    assert armario.disponivel is True

    armario.status = StatusArmario.ALUGADO
    assert armario.disponivel is False


def test_representacao_do_armario_exibe_numero_e_status():
    armario = Armario(numero="B02", status=StatusArmario.ALUGADO)

    assert repr(armario) == "<Armario numero=B02 status=StatusArmario.ALUGADO>"


def test_representacao_do_cliente_exibe_dados_principais():
    cliente = Cliente(id=7, nome="Ana Souza", is_associado=True)

    assert repr(cliente) == "<Cliente id=7 nome=Ana Souza associado=True>"


def test_produto_retorna_url_da_imagem_cadastrada():
    produto = Produto(nome="Camiseta", imagem_path="uploads/camiseta.png")

    assert produto.imagem_url == "/static/uploads/camiseta.png"


def test_produto_retorna_imagem_padrao_sem_upload():
    produto = Produto(nome="Camiseta", imagem_path=None)

    assert produto.imagem_url == "https://placehold.co/300x300?text=Sem+Imagem"


def test_movimentacao_calcula_valor_total():
    movimentacao = Movimentacao(
        tipo=tipo_de_movimentacao.ENTRADA,
        quantidade=8,
        preco_unitario=12.5,
    )

    assert movimentacao.valor_total == 100.0


def test_venda_calcula_desconto_e_representacao():
    venda = Venda(id=12, total_bruto=150.0, total_liquido=135.0)

    assert venda.desconto_valor == 15.0
    assert repr(venda) == "<Venda id=12 total=135.0>"


def test_item_venda_calcula_subtotal():
    item = ItemVenda(produto_nome="Caderno", quantidade=3, preco_unitario=8.5)

    assert item.subtotal == 25.5

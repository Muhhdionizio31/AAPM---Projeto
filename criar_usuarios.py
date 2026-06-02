# seed_completo.py

from app.database import Session
from app.models.categoria import Categoria
from app.models.produto import Produto
from app.models.produto_variacao import ProdutoVariacao


DATA = {
    "Papelaria e Escrita": [
        ("Apontador", 4.00),
        ("Borracha Artística", 10.00),
        ("Borracha branca", 2.50),
        ("Borracha Caneta", 13.50),
        ("Caneta Bic", 2.50),
        ("Caneta Mágica fantasminha colorida", 9.00),
        ("Caneta Marca Texto", 7.00),
        ("Caneta para desenho Faber Castell 0.4", 10.00),
        ("Canetinha colorida / 12 cores", 10.00),
        ("Corretivo (Fita Corretiva)", 6.00),
        ("Grafite Faber Castell HB", 6.00),
        ("Grafite Leo&Leo 0.5 / 0.7 / 0.9", 4.00),
        ("Lápis HB nº2 e nº4", 2.00),
        ("Lapiseira 0,7mm", 7.00),
        ("Lapiseira 0,9mm", 7.00),
        ("Lapiseira 2,0mm", 7.00),
    ],

    "Papéis e Impressão": [
        ("Papel Canson", 15.00),
        ("Papel Kraft rolo 10 metros", 18.00),
        ("Papel Kraft folha unitária", 3.00),
        ("Papel Sulfite c/100 folhas", 10.00),
        ("Cópia (Preto e branco) unitário", 3.00),
    ],

    "Desenho Técnico e Medição": [
        ("Compasso", 17.00),
        ("Curva Francesa grande 1119", 23.00),
        ("Curva Francesa pequena 1105", 20.00),
        ("Esquadro", 5.00),
        ("Guia Magnético G20", 5.00),
        ("Régua 15cm", 5.00),
        ("Régua 30cm", 5.00),
        ("Régua 3 em 1", 70.00),
        ("Régua Curvas", 5.00),
        ("Régua mm 30cm", 20.00),
        ("Régua mm 60cm", 30.00),
        ("Fita Métrica", 5.00),
    ],

    "Costura e Modelagem": [
        ("Agulha de máquina nº11", 10.00),
        ("Alfinete c/ cabeça colorida", 3.00),
        ("Alfinete simples", 6.00),
        ("Almofada Alfineteira Tomate", 8.00),
        ("Bobina", 2.00),
        ("Caixa de bobina", 10.00),
        ("Giz para marcar tecido cores", 5.00),
        ("Passador de linha grande", 4.00),
        ("Passador de linha pequeno", 1.50),
        ("Pinça Costura", 7.00),
    ],

    "Ferramentas e Acessórios": [
        ("Abridor de casa", 5.00),
        ("Alicate de Pic", 37.00),
        ("Furador", 6.00),
        ("Vazador 2mm", 16.00),
    ],

    "Corte e Acabamento": [
        ("Estilete Organizador M", 20.00),
        ("Tesoura", 20.00),
        ("Tesoura Arremate", 6.00),
        ("Tesoura de Picotar Profissional", 43.00),
        ("Tesoura Picotar escolar", 14.00),
    ],

    "Colagem e Fixação": [
        ("Cola bastão 10g", 5.00),
        ("Cola Líquida", 5.00),
        ("Clips Nr 3/0", 6.00),
        ("Durex", 4.00),
        ("Fita Crepe rolo 18mm x 10m", 3.00),
        ("Fita Crepe rolo 18mm x 50m", 10.00),
        ("Grampeador pequeno", 10.00),
        ("Grampo para grampeador c/1000un", 3.00),
        ("Percevejos", 8.00),
    ],

    "Eletrônicos e Informática": [
        ("Cabo USB tipo C", 12.00),
        ("Carregador de Celular V8 USB", 16.00),
        ("Calculadora", 18.00),
        ("Fone de Ouvido", 10.00),
    ],

    "Segurança e EPIs": [
        ("Avental", 65.00),
        ("Óculos de sobrepor 3M", 30.00),
        ("Óculos simples 3M", 17.00),
        ("Protetor auricular", 9.00),
        ("Touca protetora (5 un)", 6.00),
    ],

    "Vestuário": [
        ("Camiseta malha Branca", 40.00),
        ("Camiseta malha Preta", 40.00),
        ("Camiseta POLO de malha preta", 60.00),
    ],

    "Organização e Identificação": [
        ("Bolsa SENAI", 42.00),
        ("Cordão para crachá SENAI", 5.00),
        ("Porta crachá", 5.00),
        ("Pasta com aba e elástico", 5.00),
        ("2ª via de crachá", 20.00),
    ],

    "Administração e Serviços": [
        ("Semestralidade AAPM", 100.00),
        ("Armário + Semestralidade", 130.00),
    ],

    "Óptica e Inspeção": [
        ("Lente Conta Fio", 40.00),
    ],

    "Lazer e Diversos": [
        ("Bolinha de Pebolim (un)", 6.00),
        ("Bolinha de Ping Pong (un)", 3.00),
        ("Bolinha de Ping Pong (pacote com 4un)", 10.00),
        ("Esfuminho", 6.50),
    ],
}


def seed():
    db = Session()

    try:

        for categoria_nome, produtos in DATA.items():

            categoria = (
                db.query(Categoria)
                .filter(Categoria.nome == categoria_nome)
                .first()
            )

            if not categoria:
                categoria = Categoria(
                    nome=categoria_nome,
                    ativa=True
                )
                db.add(categoria)
                db.flush()

            for nome_produto, preco in produtos:

                produto = (
                    db.query(Produto)
                    .filter(Produto.nome == nome_produto)
                    .first()
                )

                if not produto:
                    produto = Produto(
                        nome=nome_produto,
                        preco=preco,
                        estoque_atual=10,
                        categoria_id=categoria.id,
                        ativa=True
                    )
                    db.add(produto)
                    db.flush()

                else:
                    produto.preco = preco
                    produto.categoria_id = categoria.id

                if categoria_nome == "Vestuário":

                    produto.estoque_atual = 30

                    for tamanho in ["P", "M", "G"]:

                        variacao = (
                            db.query(ProdutoVariacao)
                            .filter(
                                ProdutoVariacao.produto_id == produto.id,
                                ProdutoVariacao.tamanho == tamanho
                            )
                            .first()
                        )

                        if not variacao:
                            db.add(
                                ProdutoVariacao(
                                    produto_id=produto.id,
                                    tamanho=tamanho,
                                    estoque_atual=10,
                                    ativa=True
                                )
                            )

            db.flush()

        db.commit()

        print("Banco populado com sucesso!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()
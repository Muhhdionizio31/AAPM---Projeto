from app.models.cliente import Cliente
def criar_cliente(db_session_test, nome="Ana Souza", matricula="2026001", telefone="11999990000", is_associado=True, ativo=True):
    cadastrado = Cliente(
        nome=nome,
        matricula=matricula,
        telefone=telefone,
        is_associado=is_associado,
        ativo=ativo,
    )
    db_session_test.add(cadastrado)
    db_session_test.commit()
    return cadastrado


def test_listar_clientes_exibe_registro_cadastrado(cliente, db_session_test):
    criar_cliente(db_session_test)

    resposta = cliente.get("/clientes/")

    assert resposta.status_code == 200
    assert "Ana Souza" in resposta.text


def test_listar_clientes_filtra_por_busca_e_tipo(cliente, db_session_test):
    criar_cliente(db_session_test, nome="Ana Associada", matricula="2026001", is_associado=True)
    criar_cliente(db_session_test, nome="Bruno Comum", matricula="2026002", is_associado=False)

    resposta = cliente.get("/clientes/", params={"busca": "Ana", "tipo": "associados"})

    assert resposta.status_code == 200
    assert "Ana Associada" in resposta.text
    assert "Bruno Comum" not in resposta.text


def test_criar_cliente_com_sucesso_normaliza_campos(cliente, db_session_test):
    resposta = cliente.post(
        "/clientes/novo",
        data={"nome": "  Carlos Lima  ", "matricula": " 2026003 ", "telefone": " 11988887777 ", "is_associado": "true"},
        follow_redirects=False,
    )

    cadastrado = db_session_test.query(Cliente).filter_by(matricula="2026003").first()
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/clientes?criado=ok"
    assert cadastrado.nome == "Carlos Lima"
    assert cadastrado.telefone == "11988887777"
    assert cadastrado.is_associado is True
    assert cadastrado.ativo is True


def test_criar_cliente_rejeita_matricula_duplicada(cliente, db_session_test):
    criar_cliente(db_session_test)

    resposta = cliente.post(
        "/clientes/novo",
        data={"nome": "Outro Cliente", "matricula": "2026001", "telefone": "", "is_associado": "false"},
        follow_redirects=False,
    )

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/clientes?erro=matricula_duplicada"


def test_editar_cliente_atualiza_dados(cliente, db_session_test):
    cadastrado = criar_cliente(db_session_test)

    resposta = cliente.post(
        f"/clientes/{cadastrado.id}/editar",
        data={"nome": "Ana Atualizada", "matricula": "2026010", "telefone": "11888887777", "is_associado": "false"},
        follow_redirects=False,
    )

    db_session_test.refresh(cadastrado)
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/clientes?editado=ok"
    assert cadastrado.nome == "Ana Atualizada"
    assert cadastrado.matricula == "2026010"
    assert cadastrado.is_associado is False


def test_editar_cliente_rejeita_matricula_de_outro_cliente(cliente, db_session_test):
    cadastrado = criar_cliente(db_session_test)
    outro = criar_cliente(db_session_test, nome="Outro", matricula="2026002")

    resposta = cliente.post(
        f"/clientes/{cadastrado.id}/editar",
        data={"nome": cadastrado.nome, "matricula": outro.matricula, "telefone": cadastrado.telefone, "is_associado": "true"},
        follow_redirects=False,
    )

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/clientes?erro=matricula_duplicada"


def test_toggle_ativo_desativa_e_reativa_cliente(cliente, db_session_test):
    cadastrado = criar_cliente(db_session_test)

    primeira_resposta = cliente.post(f"/clientes/{cadastrado.id}/toggle-ativo", follow_redirects=False)
    db_session_test.refresh(cadastrado)
    segunda_resposta = cliente.post(f"/clientes/{cadastrado.id}/toggle-ativo", follow_redirects=False)
    db_session_test.refresh(cadastrado)

    assert primeira_resposta.headers["location"] == "/clientes?desativado=ok"
    assert segunda_resposta.headers["location"] == "/clientes?reativado=ok"
    assert cadastrado.ativo is True


def test_excluir_cliente_remove_registro_sem_vendas(cliente, db_session_test):
    cadastrado = criar_cliente(db_session_test)

    resposta = cliente.post(f"/clientes/{cadastrado.id}/excluir", follow_redirects=False)

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/clientes?excluido=ok"
    assert db_session_test.get(Cliente, cadastrado.id) is None


def test_operacao_com_cliente_inexistente_redireciona_com_erro(cliente):
    resposta = cliente.post("/clientes/999/editar", data={"nome": "Inexistente"}, follow_redirects=False)

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/clientes?erro=nao_encontrado"

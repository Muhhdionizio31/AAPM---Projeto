from app.models.armario import Armario, StatusArmario


def criar_armario(db_session_test, numero="A01", localizacao="Bloco A", status=StatusArmario.DISPONIVEL):
    armario = Armario(
        numero=numero,
        localizacao=localizacao,
        status=status,
        ativo=True,
    )
    db_session_test.add(armario)
    db_session_test.commit()
    return armario


def test_listar_armarios_exibe_armario_cadastrado(cliente, db_session_test):
    criar_armario(db_session_test)

    resposta = cliente.get("/armarios/")

    assert resposta.status_code == 200
    assert "A01" in resposta.text


def test_listar_armarios_filtra_por_status_e_localizacao(cliente, db_session_test):
    criar_armario(db_session_test, numero="DISPONIVEL-TESTE", localizacao="Bloco A")
    criar_armario(db_session_test, numero="ALUGADO-TESTE", localizacao="Bloco B", status=StatusArmario.ALUGADO)

    resposta = cliente.get("/armarios/", params={"status": "alugado", "localizacao": "Bloco B"})

    assert resposta.status_code == 200
    assert "ALUGADO-TESTE" in resposta.text
    assert "DISPONIVEL-TESTE" not in resposta.text


def test_criar_armario_com_sucesso_normaliza_campos(cliente, db_session_test):
    resposta = cliente.post(
        "/armarios/novo",
        data={"numero": " a02 ", "localizacao": " Bloco A ", "observacao": " Chave nova "},
        follow_redirects=False,
    )

    armario = db_session_test.query(Armario).filter_by(numero="A02").first()
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?criado=ok"
    assert armario.localizacao == "Bloco A"
    assert armario.observacao == "Chave nova"
    assert armario.status == StatusArmario.DISPONIVEL


def test_criar_armario_rejeita_numero_duplicado(cliente, db_session_test):
    criar_armario(db_session_test)

    resposta = cliente.post("/armarios/novo", data={"numero": "a01"}, follow_redirects=False)

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?erro=ja_existe"


def test_editar_armario_atualiza_dados(cliente, db_session_test):
    armario = criar_armario(db_session_test)

    resposta = cliente.post(
        f"/armarios/{armario.id}/editar",
        data={"numero": " b04 ", "localizacao": "Bloco B", "observacao": "Perto da entrada"},
        follow_redirects=False,
    )

    db_session_test.refresh(armario)
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?editado=ok"
    assert armario.numero == "B04"
    assert armario.localizacao == "Bloco B"


def test_editar_armario_rejeita_numero_de_outro_registro(cliente, db_session_test):
    armario = criar_armario(db_session_test, numero="A01")
    outro = criar_armario(db_session_test, numero="A02")

    resposta = cliente.post(
        f"/armarios/{armario.id}/editar",
        data={"numero": outro.numero, "localizacao": "", "observacao": ""},
        follow_redirects=False,
    )

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?erro=numero_duplicado"


def test_alugar_armario_registra_locatario(cliente, db_session_test):
    armario = criar_armario(db_session_test)

    resposta = cliente.post(
        f"/armarios/{armario.id}/alugar",
        data={"locatario_nome": "Ana Souza", "semestre": "2026/2", "observacao": "Contrato assinado"},
        follow_redirects=False,
    )

    db_session_test.refresh(armario)
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?alugado=ok"
    assert armario.status == StatusArmario.ALUGADO
    assert armario.locatario_nome == "Ana Souza"
    assert armario.semestre == "2026/2"
    assert armario.alugado_em is not None


def test_alugar_armario_exige_locatario_e_semestre(cliente, db_session_test):
    armario = criar_armario(db_session_test)

    resposta = cliente.post(f"/armarios/{armario.id}/alugar", data={"locatario_nome": "Ana Souza"}, follow_redirects=False)

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?erro=dados_invalidos"


def test_liberar_armario_remove_dados_da_locacao(cliente, db_session_test):
    armario = criar_armario(db_session_test, status=StatusArmario.ALUGADO)
    armario.locatario_nome = "Ana Souza"
    armario.semestre = "2026/2"
    db_session_test.commit()

    resposta = cliente.post(f"/armarios/{armario.id}/liberar", follow_redirects=False)

    db_session_test.refresh(armario)
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?liberado=ok"
    assert armario.status == StatusArmario.DISPONIVEL
    assert armario.locatario_nome is None
    assert armario.semestre is None


def test_toggle_ativo_altera_status_do_armario(cliente, db_session_test):
    armario = criar_armario(db_session_test)

    primeira_resposta = cliente.post(f"/armarios/{armario.id}/toggle-ativo", follow_redirects=False)
    db_session_test.refresh(armario)
    segunda_resposta = cliente.post(f"/armarios/{armario.id}/toggle-ativo", follow_redirects=False)
    db_session_test.refresh(armario)

    assert primeira_resposta.headers["location"] == "/armarios?desativado=ok"
    assert segunda_resposta.headers["location"] == "/armarios?reativado=ok"
    assert armario.status == StatusArmario.DISPONIVEL


def test_nao_permite_desativar_ou_excluir_armario_alugado(cliente, db_session_test):
    armario = criar_armario(db_session_test, status=StatusArmario.ALUGADO)

    resposta_toggle = cliente.post(f"/armarios/{armario.id}/toggle-ativo", follow_redirects=False)
    resposta_excluir = cliente.post(f"/armarios/{armario.id}/excluir", follow_redirects=False)

    assert resposta_toggle.headers["location"] == "/armarios?erro=desativar_alugado"
    assert resposta_excluir.headers["location"] == "/armarios?erro=excluir_alugado"
    assert db_session_test.get(Armario, armario.id) is not None


def test_excluir_armario_disponivel_remove_registro(cliente, db_session_test):
    armario = criar_armario(db_session_test)

    resposta = cliente.post(f"/armarios/{armario.id}/excluir", follow_redirects=False)

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios?excluido=ok"
    assert db_session_test.get(Armario, armario.id) is None


def test_detalhe_armario_redireciona_para_listagem(cliente, db_session_test):
    armario = criar_armario(db_session_test)

    resposta = cliente.get(f"/armarios/{armario.id}", follow_redirects=False)

    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/armarios"

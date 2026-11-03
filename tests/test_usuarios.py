from app.models.usuario import Usuario
from app.auth import hash_senha, verificar_senha


def criar_usuario(db_session_test, nome="Maria Silva", email="maria@teste.com", role="operador"):
    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash=hash_senha("senha123"),
        role=role,
        ativo=True,
    )
    db_session_test.add(usuario)
    db_session_test.commit()
    return usuario


def test_listar_usuarios_exibe_usuario_cadastrado(cliente, db_session_test):
    criar_usuario(db_session_test)

    resposta = cliente.get("/usuarios/")

    assert resposta.status_code == 200
    assert "Maria Silva" in resposta.text


def test_formulario_de_novo_usuario_abre(cliente):
    resposta = cliente.get("/usuarios/novo")

    assert resposta.status_code == 200
    assert "Novo Usuário" in resposta.text


def test_criar_usuario_com_sucesso(cliente, db_session_test):
    resposta = cliente.post(
        "/usuarios/novo",
        data={"nome": "João Teste", "email": "joao@teste.com", "senha": "senha123", "role": "operador"},
        follow_redirects=False,
    )

    usuario = db_session_test.query(Usuario).filter_by(email="joao@teste.com").first()
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/usuarios?criado=ok"
    assert usuario is not None
    assert usuario.nome == "João Teste"
    assert usuario.senha_hash != "senha123"
    assert verificar_senha("senha123", usuario.senha_hash)


def test_criar_usuario_rejeita_email_duplicado(cliente, db_session_test):
    criar_usuario(db_session_test)

    resposta = cliente.post(
        "/usuarios/novo",
        data={"nome": "Outra Maria", "email": "maria@teste.com", "senha": "senha123", "role": "operador"},
    )

    assert resposta.status_code == 400
    assert "Este e-mail já está cadastrado." in resposta.text


def test_criar_usuario_rejeita_perfil_invalido(cliente):
    resposta = cliente.post(
        "/usuarios/novo",
        data={"nome": "Usuário", "email": "usuario@teste.com", "senha": "senha123", "role": "gerente"},
    )

    assert resposta.status_code == 400
    assert "Perfil de acesso inválido." in resposta.text


def test_formulario_de_edicao_exibe_dados_do_usuario(cliente, db_session_test):
    usuario = criar_usuario(db_session_test)

    resposta = cliente.get(f"/usuarios/{usuario.id}/editar")

    assert resposta.status_code == 200
    assert usuario.email in resposta.text


def test_editar_usuario_atualiza_dados_e_mantem_senha_em_branco(cliente, db_session_test):
    usuario = criar_usuario(db_session_test)
    senha_anterior = usuario.senha_hash

    resposta = cliente.post(
        f"/usuarios/{usuario.id}/editar",
        data={"nome": "Maria Atualizada", "email": "maria.atualizada@teste.com", "role": "admin", "senha": ""},
        follow_redirects=False,
    )

    db_session_test.refresh(usuario)
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/usuarios?editado=ok"
    assert usuario.nome == "Maria Atualizada"
    assert usuario.role == "admin"
    assert usuario.senha_hash == senha_anterior


def test_editar_usuario_rejeita_email_em_uso(cliente, db_session_test):
    usuario = criar_usuario(db_session_test)
    outro = criar_usuario(db_session_test, nome="Outro", email="outro@teste.com")

    resposta = cliente.post(
        f"/usuarios/{usuario.id}/editar",
        data={"nome": usuario.nome, "email": outro.email, "role": "operador", "senha": ""},
    )

    assert resposta.status_code == 400
    assert "Este e-mail já está em uso por outro usuário." in resposta.text


def test_toggle_ativo_altera_status_de_outro_usuario(cliente, db_session_test):
    usuario = criar_usuario(db_session_test)

    resposta = cliente.post(f"/usuarios/{usuario.id}/toggle-ativo", follow_redirects=False)

    db_session_test.refresh(usuario)
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/usuarios"
    assert usuario.ativo is False


def test_toggle_ativo_nao_desativa_proprio_admin(cliente, db_session_test):
    usuario = criar_usuario(db_session_test, nome="Admin Teste", email="teste@admin.com", role="admin")

    resposta = cliente.post(f"/usuarios/{usuario.id}/toggle-ativo", follow_redirects=False)

    db_session_test.refresh(usuario)
    assert resposta.status_code == 302
    assert resposta.headers["location"] == "/usuarios?erro=autoproprio"
    assert usuario.ativo is True

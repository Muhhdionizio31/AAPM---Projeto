from datetime import datetime, timedelta, timezone

from app.auth import hash_senha
from app.models.reset_token import ResetToken
from app.models.usuario import Usuario


def criar_usuario(db_session_test, email="admin@teste.com", senha="senha123", ativo=True, role="admin"):
    usuario = Usuario(nome="Administrador", email=email, senha_hash=hash_senha(senha), ativo=ativo, role=role)
    db_session_test.add(usuario)
    db_session_test.commit()
    return usuario


def test_cadastro_cria_usuario_com_senha_protegida(cliente, db_session_test):
    resposta = cliente.post(
        "/auth/cadastro",
        data={"nome": "Novo Usuário", "email": "novo@teste.com", "senha": "senha123"},
        follow_redirects=False,
    )

    usuario = db_session_test.query(Usuario).filter_by(email="novo@teste.com").one()
    assert resposta.headers["location"] == "/auth/login?cadastro=successo"
    assert usuario.senha_hash != "senha123"


def test_login_retorna_cookie_para_usuario_ativo(cliente, db_session_test):
    criar_usuario(db_session_test)

    resposta = cliente.post("/auth/login", data={"email": "admin@teste.com", "senha": "senha123"}, follow_redirects=False)

    assert resposta.headers["location"] == "/painel"
    assert "access_token=" in resposta.headers["set-cookie"]


def test_login_rejeita_credenciais_invalidas_e_usuario_inativo(cliente, db_session_test):
    criar_usuario(db_session_test)
    criar_usuario(db_session_test, email="inativo@teste.com", ativo=False)

    senha_incorreta = cliente.post("/auth/login", data={"email": "admin@teste.com", "senha": "errada"})
    inativo = cliente.post("/auth/login", data={"email": "inativo@teste.com", "senha": "senha123"})

    assert senha_incorreta.status_code == 401
    assert "E-mail ou senha incorretos." in senha_incorreta.text
    assert inativo.status_code == 403
    assert "Usuário inativo." in inativo.text


def test_solicitacao_de_redefinicao_cria_token_para_admin(cliente, db_session_test, monkeypatch):
    criar_usuario(db_session_test)
    monkeypatch.setattr("app.controllers.auth_controller.enviar_email_redefinicao", lambda *args: True)

    resposta = cliente.post("/auth/esqueci-senha", data={"email": "admin@teste.com"})

    assert resposta.status_code == 200
    assert db_session_test.query(ResetToken).filter_by(usuario_id=1).count() == 1


def test_redefinir_senha_rejeita_confirmacao_diferente_e_invalida_token_apos_uso(cliente, db_session_test):
    usuario = criar_usuario(db_session_test)
    token = ResetToken(token="token-valido", usuario_id=usuario.id, expira_em=datetime.now(timezone.utc) + timedelta(minutes=10))
    db_session_test.add(token)
    db_session_test.commit()

    divergente = cliente.post(f"/auth/redefinir-senha/{token.token}", data={"senha": "nova123", "confirmar_senha": "outra"})
    sucesso = cliente.post(f"/auth/redefinir-senha/{token.token}", data={"senha": "nova123", "confirmar_senha": "nova123"}, follow_redirects=False)

    db_session_test.refresh(token)
    assert "As senhas não coincidem." in divergente.text
    assert sucesso.headers["location"] == "/auth/login?redefinida=sucesso"
    assert token.usado is True

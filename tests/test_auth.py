#pip install pytest

from app.auth import hash_senha, verificar_senha

def test_hash_senha_gera_string_diferente_da_original():
   senha = "minhasenhateste123"
   senha_hash = hash_senha(senha)

   assert senha != senha_hash

def test_verificar_senha_aceita_senha_correta():
    senha = "minhasenhateste123"
    senha_hash = hash_senha(senha)

    resultado = verificar_senha(senha, senha_hash)

    assert resultado is True

def test_verificar_senha_rejeita_senha_incorreta():
    senha = "minhasenhateste123"
    senha_hash = hash_senha(senha)
    
    resultado = verificar_senha("senhaincorreta", senha_hash)

    assert resultado is False
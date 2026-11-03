import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db 
from app.auth import get_admin, get_usuario_logado, get_usuario_opcional

@pytest.fixture()
def db_session_test():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)

    teste_session_local = sessionmaker(autoflush=False, autocommit=False, bind=engine)
    session= teste_session_local()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def cliente(db_session_test):

    def get_db_teste():
            yield db_session_test

    def usurio_falso():
        return {"sub": "teste@admin.com", "nome": "admin teste", "role": "admin"}

    app.dependency_overrides[get_db] = get_db_teste
    app.dependency_overrides[get_usuario_logado] = usurio_falso 
    app.dependency_overrides[get_admin] = usurio_falso
    app.dependency_overrides[get_usuario_opcional] = usurio_falso

    with TestClient(app) as teste_cliente:   
        yield teste_cliente 

    app.dependency_overrides.clear()
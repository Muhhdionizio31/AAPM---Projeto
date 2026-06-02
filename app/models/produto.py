from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nome = Column(String(100), nullable=False)
    preco = Column(Float, nullable=False, default=0.0)
    estoque_atual = Column(Integer, default=0)
    descricao = Column(String(255), nullable=True)
    ativa = Column(Boolean, default=True)

    imagem_path = Column(String(255), nullable=True)

    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=False)

    categoria = relationship("Categoria", back_populates="produtos")

    variacoes = relationship("ProdutoVariacao", back_populates="produto", cascade="all, delete-orphan", lazy="select")

    @property
    def imagem_url(self):
        if self.imagem_path:
            return f"/static/{self.imagem_path}"
        else:
            return "/static/img/product-placeholder.png"
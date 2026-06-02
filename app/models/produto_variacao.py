from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class ProdutoVariacao(Base):
    __tablename__ = "produto_variacoes"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id", ondelete="CASCADE"), nullable=False)
    tamanho = Column(String(5), nullable=False)
    estoque_atual = Column(Integer, default=0)
    ativa = Column(Boolean, default=True)
    produto = relationship("Produto", back_populates="variacoes")
    __table_args__ = (UniqueConstraint("produto_id", "tamanho", name="uq_produto_tamanho"),)
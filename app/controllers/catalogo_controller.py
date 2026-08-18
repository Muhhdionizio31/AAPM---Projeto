import math

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from fastapi.templating import Jinja2Templates

from app.database import get_db
from app.models.produto import Produto
from app.models.categoria import Categoria

router = APIRouter(prefix="/catalogo", tags=["Catálogo"])
templates = Jinja2Templates(directory="app/templates")


@router.get("/")
def catalogo(
    request: Request,
    busca: str = "",
    categoria_id: int = 0,
    page: int = 1,
    per_page: int = 15,
    db: Session = Depends(get_db)
):
    query = db.query(Produto).filter(Produto.ativa == True)

    if busca:
        query = query.filter(Produto.nome.ilike(f"%{busca}%"))

    if categoria_id:
        query = query.filter(Produto.categoria_id == categoria_id)

    total_produtos = query.count()
    page = max(page, 1)
    per_page = max(per_page, 1)
    total_pages = math.ceil(total_produtos / per_page) if total_produtos else 1
    offset = (page - 1) * per_page
    produtos    = query.offset(offset).limit(per_page).all()
  
    categorias  = db.query(Categoria).filter(Categoria.ativa == True).all()
    
    return templates.TemplateResponse(
        request,
        "site/catalogo.html",
        {
            "request": request,
            "produtos": produtos,
            "categorias": categorias,
            "busca": busca,
            "categoria_id": categoria_id,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "total_produtos": total_produtos
        }
    )
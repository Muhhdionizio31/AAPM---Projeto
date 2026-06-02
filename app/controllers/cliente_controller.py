from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
 
from app.auth import get_usuario_opcional
from app.database import get_db
 
router = APIRouter(prefix="/clientes", tags=["Clientes"])
 
templates = Jinja2Templates(directory="app/templates")
 
 
@router.get("/")
def listar_clientes(
    request: Request,
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_opcional),
):
    if usuario is None:
        return RedirectResponse(url="/auth/login", status_code=302)
 
    return templates.TemplateResponse(
        request,
        "clientes/index.html",
        {
            "request": request,
            "usuario": usuario,
        },
    )
 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.api import deps

router = APIRouter()

# 1. GET: Llenar el Combobox del Plan de Trabajo
@router.get("/", response_model=List[schemas.CarteraResponse])
def listar_cartera_oficial(
    db: Session = Depends(deps.get_db),
    skip: int = 0, 
    limit: int = 10
):
    """
    Devuelve la lista oficial de clientes.
    Se usa para que el vendedor seleccione a quién va a visitar.
    """
    return crud.cartera.get_multi(db, skip=skip, limit=limit)

# 2. PUT: Actualizar un dato (Ej: Si el cliente cambió de celular)
@router.put("/{id_cliente}", response_model=schemas.CarteraResponse)
def actualizar_datos_cliente(
    *,
    db: Session = Depends(deps.get_db),
    id_cliente: int,
    cliente_in: schemas.CarteraUpdate,
):
    """
    Permite actualizar números de teléfono, correos o contactos 
    de un cliente que YA EXISTE en la cartera oficial.
    """
    cliente_actual = crud.cartera.get(db=db, id=id_cliente)
    if not cliente_actual:
        raise HTTPException(status_code=404, detail="Cliente oficial no encontrado")
        
    return crud.cartera.update(db=db, db_obj=cliente_actual, obj_in=cliente_in)
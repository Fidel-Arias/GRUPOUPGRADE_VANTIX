from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.kpi.ConfiguracionMetaResponse])
def listar_metas_globales(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user)
):
    """
    Listar todas las metas globales configuradas.
    """
    return crud.kpi.config_meta.get_multi(db)

@router.get("/dict", response_model=Dict[str, int])
def obtener_metas_como_diccionario(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user)
):
    """
    Obtener metas en formato clave-valor (ideal para el frontend).
    """
    return crud.kpi.config_meta.get_all_as_dict(db)

@router.put("/{id_meta}", response_model=schemas.kpi.ConfiguracionMetaResponse)
def actualizar_meta_global(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    id_meta: int,
    meta_in: schemas.kpi.ConfiguracionMetaUpdate
):
    """
    Actualizar el valor de una meta global. Requiere rol ADMIN.
    """
    meta_db = crud.kpi.config_meta.get(db, id=id_meta)
    if not meta_db:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    
    return crud.kpi.config_meta.update(db, db_obj=meta_db, obj_in=meta_in)

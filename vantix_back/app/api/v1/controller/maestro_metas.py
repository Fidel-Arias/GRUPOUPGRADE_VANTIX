from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.kpi.MaestroMetasResponse])
def listar_metas_maestras(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user)
):
    """Listar todas las metas maestras configuradas."""
    return crud.maestro_metas.get_multi(db)

@router.post("/", response_model=schemas.kpi.MaestroMetasResponse)
def crear_meta_maestra(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    obj_in: schemas.kpi.MaestroMetasCreate
):
    """Crear un nuevo conjunto de metas maestras generales. Requiere ADMIN."""
    return crud.maestro_metas.create(db, obj_in=obj_in)

@router.get("/{id_maestro}", response_model=schemas.kpi.MaestroMetasResponse)
def obtener_meta_maestra(
    id_maestro: int,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user)
):
    """Obtener una meta maestra específica."""
    meta = crud.maestro_metas.get(db, id=id_maestro)
    if not meta:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return meta

@router.put("/{id_maestro}", response_model=schemas.kpi.MaestroMetasResponse)
def actualizar_meta_maestra(
    *,
    id_maestro: int,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    obj_in: schemas.kpi.MaestroMetasUpdate
):
    """Actualizar una meta maestra."""
    meta_db = crud.maestro_metas.get(db, id=id_maestro)
    if not meta_db:
        raise HTTPException(status_code=404, detail="Meta no encontrada")

    return crud.maestro_metas.update(db, db_obj=meta_db, obj_in=obj_in)

@router.delete("/{id_maestro}", response_model=schemas.kpi.MaestroMetasResponse)
def eliminar_meta_maestra(
    id_maestro: int,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user)
):
    """Eliminar una meta maestra."""
    meta = crud.maestro_metas.get(db, id=id_maestro)
    if not meta:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return crud.maestro_metas.remove(db, id=id_maestro)

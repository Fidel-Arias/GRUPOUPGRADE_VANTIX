from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.GastoResponse)
def crear_gasto_movilidad(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    gasto_in: schemas.GastoCreate
):
    """
    Registrar un nuevo gasto de movilidad asociado a un plan semanal.
    """
    # Validar que el plan existe
    plan = crud.plan.get(db, id=gasto_in.id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="El plan de trabajo especificado no existe")
    
    return crud.gasto.create(db, obj_in=gasto_in)

@router.get("/", response_model=List[schemas.GastoResponse])
def listar_gastos_movilidad(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    id_plan: Optional[int] = Query(None, description="Filtrar por ID de Plan Semanal")
):
    """
    Listar gastos de movilidad. Se puede filtrar por plan.
    """
    if id_plan:
        return crud.gasto.get_by_plan(db, id_plan=id_plan)
    return crud.gasto.get_multi(db, skip=skip, limit=limit)

@router.get("/{id_gasto}", response_model=schemas.GastoResponse)
def obtener_gasto(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_gasto: int
):
    """
    Obtener un gasto de movilidad por su ID.
    """
    gasto = crud.gasto.get(db, id=id_gasto)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return gasto

@router.put("/{id_gasto}", response_model=schemas.GastoResponse)
def actualizar_gasto(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_gasto: int,
    gasto_in: schemas.GastoUpdate
):
    """
    Actualizar datos de un gasto de movilidad.
    """
    gasto = crud.gasto.get(db, id=id_gasto)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    return crud.gasto.update(db, db_obj=gasto, obj_in=gasto_in)

@router.delete("/{id_gasto}", response_model=schemas.GastoResponse)
def eliminar_gasto(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    id_gasto: int
):
    """
    Eliminar un registro de gasto de movilidad.
    """
    gasto = crud.gasto.get(db, id=id_gasto)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    return crud.gasto.remove(db, id=id_gasto)

@router.get("/total/{id_plan}")
def obtener_total_plan(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_plan: int
):
    """
    Obtener la suma total de gastos de movilidad para un plan específico.
    """
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    total = crud.gasto.get_total_gasto_by_plan(db, id_plan=id_plan)
    return {"id_plan": id_plan, "total_gastado": total}

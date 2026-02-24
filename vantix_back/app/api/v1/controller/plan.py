from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.services.sales.plan_validator import PlanValidatorService

router = APIRouter()

@router.post("/", response_model=schemas.PlanResponse)
def create_plan_trabajo(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    plan_in: schemas.PlanCreate,
    id_empleado: int = Query(..., description="ID del empleado dueño del plan")
):
    """
    Crear un Plan de Trabajo Semanal.
    Esto genera AUTOMÁTICAMENTE:
    1. La cabecera del plan.
    2. La agenda (DetallePlanTrabajo).
    3. El Informe de Productividad (Vacío, con metas por defecto).
    """
    return PlanValidatorService.create_weekly_plan(db, plan_in=plan_in, id_empleado=id_empleado)

@router.get("/", response_model=List[schemas.PlanResponse])
def list_planes_trabajo(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    id_empleado: Optional[int] = None
):
    """
    Listar planes de trabajo.
    Se puede filtrar por empleado.
    """
    if id_empleado:
        return crud.plan.get_multi_by_owner(db, id_empleado=id_empleado, skip=skip, limit=limit)
    return crud.plan.get_multi(db, skip=skip, limit=limit)

@router.get("/{id_plan}", response_model=schemas.PlanResponse)
def get_plan_trabajo(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_plan: int
):
    """
    Obtener un plan de trabajo por ID.
    Incluye:
    - Detalles de la agenda.
    - Informe de Productividad vinculado.
    """
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de trabajo no encontrado")
    return plan

@router.put("/{id_plan}", response_model=schemas.PlanResponse)
def update_plan_trabajo(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_plan: int,
    plan_in: schemas.PlanUpdate
):
    """
    Actualizar datos del encabezado (Estado, Observaciones).
    """
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de trabajo no encontrado")
    
    return crud.plan.update(db, db_obj=plan, obj_in=plan_in)

@router.delete("/{id_plan}", response_model=schemas.PlanResponse)
def delete_plan_trabajo(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    id_plan: int
):
    """
    Eliminar un plan de trabajo.
    (Cascade eliminará detalles e informe).
    """
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de trabajo no encontrado")
    return crud.plan.remove(db, id=id_plan)

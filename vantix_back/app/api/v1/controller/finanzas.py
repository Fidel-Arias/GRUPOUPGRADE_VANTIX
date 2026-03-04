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
    
    # Validar que el plan pertenezca al usuario (o que sea admin)
    if plan.id_empleado != current_user.id_empleado and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No puedes registrar gastos para un plan que no te pertenece.")
        
    # Validar que el plan esté aprobado
    from app.models.enums import EstadoPlanEnum, TipoActividadEnum
    if plan.estado != EstadoPlanEnum.APROBADO:
        raise HTTPException(status_code=403, detail="Solo puedes registrar gastos en un plan que ya ha sido Aprobado por el supervisor.")
    
    from app.models.enums import TipoActividadEnum
    from app.models.plan import DetallePlanTrabajo
    from app.models.finanzas import GastoMovilidad

    visitas_permitidas = db.query(DetallePlanTrabajo).filter(
        DetallePlanTrabajo.id_plan == gasto_in.id_plan,
        DetallePlanTrabajo.tipo_actividad.in_([TipoActividadEnum.VISITA, TipoActividadEnum.VISITA_ASISTIDA])
    ).count()

    gastos_actuales = db.query(GastoMovilidad).filter(
        GastoMovilidad.id_plan == gasto_in.id_plan
    ).count()

    if gastos_actuales >= visitas_permitidas:
        raise HTTPException(
            status_code=400,
            detail=f"Límite alcanzado: Solo puedes registrar {visitas_permitidas} gastos de movilidad según la cantidad de visitas programadas en tu agenda."
        )

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

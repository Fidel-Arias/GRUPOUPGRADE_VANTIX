from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.services.gamificacion.kpi_service import kpi_service
from datetime import date

router = APIRouter()

# --- ENDPOINTS DE INFORMES (KPI) ---

@router.get("/informes/", response_model=List[schemas.kpi.InformeProductividadResponse])
def listar_informes_productividad(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_empleado: Optional[int] = Query(None, description="Filtrar informes por empleado"),
    skip: int = 0,
    limit: int = 100
):
    """
    Lista los informes de productividad semanales. 
    Se puede filtrar por empleado para ver su historial de rendimiento.
    """
    if id_empleado:
        return kpi_service.get_performance_report(db, id_empleado=id_empleado)
    
    return crud.kpi.get_multi(db, skip=skip, limit=limit)

@router.get("/informes/{id_plan}", response_model=schemas.kpi.InformeProductividadResponse)
def obtener_informe_por_plan(
    id_plan: int,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user)
):
    """
    Obtiene el informe detallado de un plan de trabajo específico.
    """
    informe = crud.kpi.get_by_plan(db, id_plan=id_plan)
    if not informe:
        raise HTTPException(status_code=404, detail="Informe de productividad no encontrado para este plan")
    return informe


@router.put("/informes/actualizar", response_model=schemas.kpi.InformeProductividadResponse)
def actualizar_informe_flexible(
    obj_in: schemas.kpi.KpiUpdate,
    id_informe: Optional[int] = Query(None, description="ID directo del informe"),
    id_plan: Optional[int] = Query(None, description="ID del plan asociado"),
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user)
):
    """
    Actualiza un informe de productividad de manera flexible.
    """
    informe = None
    if id_informe:
        informe = crud.kpi.get(db, id=id_informe)
    elif id_plan:
        informe = crud.kpi.get_by_plan(db, id_plan=id_plan)
    
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")

    return crud.kpi.update(db, db_obj=informe, obj_in=obj_in)


# --- ENDPOINTS DE INCENTIVOS (PAGOS) ---

@router.get("/incentivos/", response_model=List[schemas.kpi.IncentivoPagoResponse])
def listar_incentivos(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_empleado: Optional[int] = Query(None),
    solo_pendientes: bool = False
):
    """
    Lista los bonos/incentivos generados.
    """
    if solo_pendientes:
        return crud.incentivo.get_pendientes_pago(db)
    if id_empleado:
        return crud.incentivo.get_by_empleado(db, id_empleado=id_empleado)
    return crud.incentivo.get_multi(db)

@router.patch("/incentivos/{id_incentivo}/pagar", response_model=schemas.kpi.IncentivoPagoResponse)
def marcar_incentivo_como_pagado(
    id_incentivo: int,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user)
):
    """
    Cambia el estado de un bono a 'Pagado'.
    """
    db_obj = crud.incentivo.get(db, id=id_incentivo)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Incentivo no encontrado")
    
    return crud.incentivo.update(db, db_obj=db_obj, obj_in={"estado_pago": "Pagado"})

@router.post("/informes/{id_informe}/sincronizar", response_model=schemas.kpi.InformeProductividadResponse)
def sincronizar_informe_kpi(
    id_informe: int,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user)
):
    """
    Sincroniza los valores reales del informe.
    """
    informe = kpi_service.sync_real_time_metrics(db, id_informe=id_informe)
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    return informe

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
@router.put("/informes/actualizar", response_model=schemas.kpi.InformeProductividadResponse)
def actualizar_informe_flexible(
    obj_in: schemas.kpi.KpiUpdate,
    id_informe: Optional[int] = Query(None, description="ID directo del informe"),
    id_plan: Optional[int] = Query(None, description="ID del plan asociado"),
    id_empleado: Optional[int] = Query(None, description="ID de empleado (requerido si se usa fecha)"),
    fecha: Optional[date] = Query(None, description="Fecha perteneciente a la semana del informe"),
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user)
):
    """
    Actualiza un informe de productividad de manera flexible.
    Busca por: id_informe > id_plan > (id_empleado + fecha).
    """
    informe = None

    # 1. Buscar por ID Directo
    if id_informe:
        informe = crud.kpi.get(db, id=id_informe)
    
    # 2. Buscar por ID de Plan
    elif id_plan:
        informe = crud.kpi.get_by_plan(db, id_plan=id_plan)
    
    # 3. Buscar por Empleado + Fecha (Encontrar plan que cubra esa fecha)
    elif id_empleado and fecha:
        plan = db.query(models.plan.PlanTrabajoSemanal).filter(
            models.plan.PlanTrabajoSemanal.id_empleado == id_empleado,
            models.plan.PlanTrabajoSemanal.fecha_inicio_semana <= fecha,
            models.plan.PlanTrabajoSemanal.fecha_fin_semana >= fecha
        ).first()
        
        if plan:
            informe = crud.kpi.get_by_plan(db, id_plan=plan.id_plan)

    # Validaciones finales
    if not informe:
        raise HTTPException(
            status_code=404, 
            detail="No se encontró un informe de productividad con los criterios proporcionados."
        )

    return crud.kpi.update(db, db_obj=informe, obj_in=obj_in)

@router.get("/metas", response_model=List[schemas.kpi.InformeMetasResponse])
def listar_metas_informes(
    id_informe: Optional[int] = Query(None, description="ID del informe específico (opcional)"),
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Obtiene las metas propuestas y puntaje objetivo. 
    Si no se envía id_informe, lista las metas registradas con paginación.
    """
    if id_informe:
        informe = crud.kpi.get(db, id=id_informe)
        if not informe:
            raise HTTPException(status_code=404, detail="Informe no encontrado")
        return [informe]
    
    return crud.kpi.get_multi(db, skip=skip, limit=limit)


@router.post("/metas", response_model=schemas.kpi.InformeMetasResponse)
def registrar_metas_semanales(
    obj_in: schemas.kpi.InformeMetasCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user)
):
    """
    Registra las metas propuestas para una semana específica (id_plan).
    Este proceso se realiza cada semana para establecer los objetivos.
    """
    # 1. Verificar que el plan exista
    plan = crud.plan.get(db, id=obj_in.id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de trabajo no encontrado")
    
    # 2. Verificar si ya tiene un informe (metas registradas)
    informe_existente = crud.kpi.get_by_plan(db, id_plan=obj_in.id_plan)
    if informe_existente:
        # Si ya existe, lo actualizamos con la nueva info (Upsert)
        return crud.kpi.update(db, db_obj=informe_existente, obj_in=obj_in)
    
    # 3. Si no existe, lo creamos
    return crud.kpi.create(db, obj_in=obj_in)


@router.post("/informes/{id_informe}/sincronizar", response_model=schemas.kpi.InformeProductividadResponse)
def sincronizar_informe_kpi(
    id_informe: int,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user)
):
    """
    Sincroniza los valores reales del informe consultando el CRM y UpgradeDB.
    Calcula puntos y actualiza el progreso semanal.
    """
    informe = kpi_service.sync_real_time_metrics(db, id_informe=id_informe)
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    return informe


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

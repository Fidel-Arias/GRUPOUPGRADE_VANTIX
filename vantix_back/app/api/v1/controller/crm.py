from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from app.services.gamificacion.kpi_service import kpi_service

router = APIRouter()

# --- LLAMADAS ---

@router.post("/llamadas/", response_model=schemas.crm.LlamadaResponse)
def registrar_llamada(
    *,
    db: Session = Depends(deps.get_db),
    llamada_in: schemas.crm.LlamadaCreate
):
    """
    Registra una llamada realizada y suma 1 punto al KPI.
    """
    # 1. Validar Plan
    plan = crud.plan.get(db, id=llamada_in.id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    # 2. Guardar en DB
    db_obj = crud.llamada.create(db, obj_in=llamada_in)
    
    # 3. Actualizar KPI (1 punto por llamada)
    kpi_service.update_kpi_metrics(
        db, 
        id_plan=llamada_in.id_plan, 
        field="real_llamadas", 
        puntos=1
    )
    
    return db_obj

@router.get("/llamadas/", response_model=List[schemas.crm.LlamadaResponse])
def listar_llamadas(
    db: Session = Depends(deps.get_db),
    id_plan: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    if id_plan:
        return crud.llamada.get_multi_by_plan(db, id_plan=id_plan, skip=skip, limit=limit)
    return crud.llamada.get_multi(db, skip=skip, limit=limit)


# --- EMAILS ---

@router.post("/emails/", response_model=schemas.crm.EmailResponse)
def registrar_email(
    *,
    db: Session = Depends(deps.get_db),
    email_in: schemas.crm.EmailCreate
):
    """
    Registra un email enviado y suma 0.5 puntos al KPI (o el valor que definas).
    """
    plan = crud.plan.get(db, id=email_in.id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    db_obj = crud.email.create(db, obj_in=email_in)
    
    # Actualizar KPI (0.5 puntos o podemos manejarlo como entero y dar 1 punto cada 2 emails)
    # Por ahora usemos 1 punto para simplificar o dejarlo en 0 si solo es auditoría.
    kpi_service.update_kpi_metrics(
        db, 
        id_plan=email_in.id_plan, 
        field="real_emails", 
        puntos=1 
    )
    
    return db_obj

@router.get("/emails/", response_model=List[schemas.crm.EmailResponse])
def listar_emails(
    db: Session = Depends(deps.get_db),
    id_plan: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    if id_plan:
        return crud.email.get_multi_by_plan(db, id_plan=id_plan, skip=skip, limit=limit)
    return crud.email.get_multi(db, skip=skip, limit=limit)

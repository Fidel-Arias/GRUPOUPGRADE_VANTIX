from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.services.gamificacion.kpi_service import kpi_service
from app.services.common.file_manager import FileManager

router = APIRouter()

# --- LLAMADAS ---

@router.post("/llamadas/", response_model=schemas.crm.LlamadaResponse)
async def registrar_llamada(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_plan: int = Form(...),
    numero_destino: str = Form(...),
    resultado: str = Form(...),
    nombre_destinatario: Optional[str] = Form(None),
    duracion_segundos: int = Form(0),
    notas_llamada: Optional[str] = Form(None),
    foto_prueba: Optional[UploadFile] = File(None)
):
    """
    Registra una llamada realizada y suma 1 punto al KPI.
    Permite subir una foto opcional como prueba.
    """
    # 1. Validar Plan
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    # 2. Gestionar Foto si existe
    url_foto = None
    if foto_prueba:
        url_foto = await FileManager.save_upload_file(foto_prueba, subdirectory="crm/llamadas", prefix="call")

    # 3. Preparar data
    llamada_in = schemas.crm.LlamadaCreate(
        id_plan=id_plan,
        numero_destino=numero_destino,
        resultado=resultado,
        nombre_destinatario=nombre_destinatario,
        duracion_segundos=duracion_segundos,
        notas_llamada=notas_llamada,
        url_foto_prueba=url_foto
    )
    
    # 4. Guardar en DB
    db_obj = crud.llamada.create(db, obj_in=llamada_in)
    
    # 5. Actualizar KPI (1 punto por llamada)
    kpi_service.update_kpi_metrics(
        db, 
        id_plan=id_plan, 
        field="real_llamadas", 
        puntos=1
    )
    
    return db_obj

@router.get("/llamadas/", response_model=List[schemas.crm.LlamadaResponse])
def listar_llamadas(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_plan: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    if id_plan:
        return crud.llamada.get_multi_by_plan(db, id_plan=id_plan, skip=skip, limit=limit)
    return crud.llamada.get_multi(db, skip=skip, limit=limit)


# --- EMAILS ---

@router.post("/emails/", response_model=schemas.crm.EmailResponse)
async def registrar_email(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_plan: int = Form(...),
    email_destino: str = Form(...),
    asunto: Optional[str] = Form(None),
    estado_envio: str = Form("Enviado"),
    foto_prueba: Optional[UploadFile] = File(None)
):
    """
    Registra un email enviado y suma 1 punto al KPI.
    Permite subir una foto opcional (captura de pantalla) como prueba.
    """
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    url_foto = None
    if foto_prueba:
        url_foto = await FileManager.save_upload_file(foto_prueba, subdirectory="crm/emails", prefix="email")

    email_in = schemas.crm.EmailCreate(
        id_plan=id_plan,
        email_destino=email_destino,
        asunto=asunto,
        estado_envio=estado_envio,
        url_foto_prueba=url_foto
    )

    db_obj = crud.email.create(db, obj_in=email_in)
    
    # 1 punto por email
    kpi_service.update_kpi_metrics(
        db, 
        id_plan=id_plan, 
        field="real_emails", 
        puntos=1 
    )
    
    return db_obj

@router.get("/emails/", response_model=List[schemas.crm.EmailResponse])
def listar_emails(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_plan: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    if id_plan:
        return crud.email.get_multi_by_plan(db, id_plan=id_plan, skip=skip, limit=limit)
    return crud.email.get_multi(db, skip=skip, limit=limit)

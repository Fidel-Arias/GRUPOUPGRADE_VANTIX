from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from app.models.enums import ResultadoEstadoEnum
from app.models.visita import RegistroVisita
from app.services.common.file_manager import FileManager
from decimal import Decimal
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=schemas.VisitaResponse)
async def registrar_visita(
    *,
    db: Session = Depends(deps.get_db),
    # Campos del Formulario (Multipart)
    id_plan: int = Form(...),
    id_cliente: int = Form(...),
    resultado: ResultadoEstadoEnum = Form(...),
    observaciones: Optional[str] = Form(None),
    lat: Optional[str] = Form(None), 
    lon: Optional[str] = Form(None),
    
    # Archivos
    foto_lugar: UploadFile = File(..., description="Foto del lugar/fachada"),
    foto_sello: UploadFile = File(..., description="Foto del sello/constancia")
):
    """
    Registrar una visita realizada, subiendo 2 fotos OBLIGATORIAS (Lugar y Sello).
    Usa el servicio FileManager para gestionar el guardado de archivos.
    """
    # 1. Validar Plan
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de trabajo no encontrado")

    # 2. Guardar Fotos usando el servicio FileManager
    path_lugar = await FileManager.save_upload_file(foto_lugar, subdirectory="visitas", prefix="lugar")
    path_sello = await FileManager.save_upload_file(foto_sello, subdirectory="visitas", prefix="sello")

    # 3. Crear Objeto Visita
    visita_data = {
        "id_plan": id_plan,
        "id_cliente": id_cliente,
        "resultado": resultado,
        "observaciones": observaciones,
        "geolocalizacion_lat": Decimal(lat) if lat else None,
        "geolocalizacion_lon": Decimal(lon) if lon else None,
        "url_foto_lugar": path_lugar,
        "url_foto_sello": path_sello
    }
    
    db_visita = RegistroVisita(**visita_data)
    db.add(db_visita)
    db.commit()
    db.refresh(db_visita)

    # 4. ACTUALIZAR KPI (Gamificación) usando el servicio centralizado
    kpi_service.update_kpi_metrics(
        db, 
        id_plan=id_plan, 
        field="real_visitas", 
        puntos=2
    )
    
    return db_visita

@router.get("/", response_model=List[schemas.VisitaResponse])
def listar_visitas(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    id_empleado: Optional[int] = None,
    id_plan: Optional[int] = None,
    id_cliente: Optional[int] = None
):
    """
    Listar visitas con múltiples filtros opcionales.
    """
    if id_empleado:
        return crud.visita.get_multi_by_owner(db, id_empleado=id_empleado, skip=skip, limit=limit)
    
    if id_plan:
        return crud.visita.get_by_plan(db, id_plan=id_plan)
        
    if id_cliente:
        return crud.visita.get_by_cliente(db, id_cliente=id_cliente)

    return crud.visita.get_multi(db, skip=skip, limit=limit)

@router.delete("/{id_visita}", response_model=schemas.VisitaResponse)
def eliminar_visita(
    *,
    db: Session = Depends(deps.get_db),
    id_visita: int
):
    """
    Eliminar una visita y sus archivos físicos asociados.
    """
    visita = crud.visita.get(db, id=id_visita)
    if not visita:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    # 1. Revertir KPI (Gamificación)
    kpi_service.update_kpi_metrics(
        db, 
        id_plan=visita.id_plan, 
        field="real_visitas", 
        increment=-1,
        puntos=-2
    )
        
    # 2. Borrar archivos físicos del disco para ahorrar espacio
    FileManager.delete_file(visita.url_foto_lugar)
    FileManager.delete_file(visita.url_foto_sello)

    # 3. Serializar los datos antes de borrar para evitar DetachedInstanceError en la respuesta
    # Esto carga las relaciones (como 'cliente') antes de que el objeto se desconecte de la sesión
    visita_validada = schemas.VisitaResponse.model_validate(visita)

    # 4. Borrar de la base de datos
    db.delete(visita)
    db.commit()
    
    return visita_validada

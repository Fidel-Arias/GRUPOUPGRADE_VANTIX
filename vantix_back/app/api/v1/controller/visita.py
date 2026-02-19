from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from app.models.enums import ResultadoEstadoEnum
from app.models.visita import RegistroVisita
from decimal import Decimal
import shutil
import os
import uuid
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "static/uploads/visitas"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.VisitaResponse)
def registrar_visita(
    *,
    db: Session = Depends(deps.get_db),
    # Campos del Formulario (Multipart)
    id_plan: int = Form(...),
    id_cliente: int = Form(...),
    resultado: ResultadoEstadoEnum = Form(...),
    observaciones: Optional[str] = Form(None),
    lat: Optional[str] = Form(None), # Recibimos como string y convertimos
    lon: Optional[str] = Form(None),
    
    # Archivos
    foto_lugar: UploadFile = File(..., description="Foto del lugar/fachada"),
    foto_sello: UploadFile = File(..., description="Foto del sello/constancia")
):
    """
    Registrar una visita realizada, subiendo 2 fotos OBLIGATORIAS (Lugar y Sello).
    Actualiza automáticamente el contador de visitas en el Informe Semanal.
    """
    # 1. Validar Plan
    plan = crud.plan.get(db, id=id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de trabajo no encontrado")

    # 2. Guardar Fotos
    def save_upload(upload_file: UploadFile, prefix: str) -> str:
        # Generar nombre único: uuid + prefix + extension
        ext = upload_file.filename.split(".")[-1]
        filename = f"{prefix}_{uuid.uuid4()}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        # Retornar URL relativa
        return f"/static/uploads/visitas/{filename}"

    path_lugar = save_upload(foto_lugar, "lugar")
    path_sello = save_upload(foto_sello, "sello")

    # 3. Crear Objeto Visita
    visita_data = {
        "id_plan": id_plan,
        "id_cliente": id_cliente,
        "resultado": resultado,
        "observaciones": observaciones,
        "geolocalizacion_lat": Decimal(lat) if lat else None,
        "geolocalizacion_lon": Decimal(lon) if lon else None,
        
        # Mapeo a las nuevas columnas de la BD
        "url_foto_lugar": path_lugar,
        "url_foto_sello": path_sello
    }
    
    db_visita = RegistroVisita(**visita_data)
    db.add(db_visita)
    db.commit()
    db.refresh(db_visita)

    # 4. ACTUALIZAR KPI (VITAMINIZADO)
    # Buscamos el informe del plan
    informe = crud.kpi.get_by_plan(db, id_plan=id_plan)
    if informe:
        # Incrementamos visitas
        informe.real_visitas += 1
        
        # Incrementamos puntos (Ejemplo: 2 puntos por visita realizada)
        # Esto debería estar en una regla de negocio más compleja, pero para empezar:
        PUNTOS_POR_VISITA = 2
        informe.puntos_alcanzados += PUNTOS_POR_VISITA
        
        db.add(informe)
        db.commit()
    
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
    Listar visitas con múltiples filtros opcionales:
    - Por Empleado (Historial completo de un vendedor)
    - Por Plan (Visitas de una semana específica)
    - Por Cliente (Historial de visitas a una empresa)
    """
    if id_empleado:
        return crud.visita.get_multi_by_owner(db, id_empleado=id_empleado, skip=skip, limit=limit)
    
    if id_plan:
        return crud.visita.get_by_plan(db, id_plan=id_plan) # TODO: Agregar skip/limit a este CRUD filter
        
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
    Eliminar una visita (Si se cometió un error).
    IMPORTANTE: Debería restar los puntos y el contador en el KPI.
    """
    visita = crud.visita.get(db, id=id_visita)
    if not visita:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    # 1. Revertir KPI
    informe = crud.kpi.get_by_plan(db, id_plan=visita.id_plan)
    if informe:
        # Evitar números negativos
        if informe.real_visitas > 0:
            informe.real_visitas -= 1
        
        # Restar los puntos (Asumiendo 2 por visita como en la creación)
        PUNTOS_POR_VISITA = 2
        if informe.puntos_alcanzados >= PUNTOS_POR_VISITA:
            informe.puntos_alcanzados -= PUNTOS_POR_VISITA
            
        db.add(informe)
        
    # 2. Borrar archivos (Opcional, para limpiar disco)
    # try:
    #     os.remove(visita.url_foto_lugar.lstrip('/'))
    #     os.remove(visita.url_foto_sello.lstrip('/'))
    # except:
    #     pass

    visita_borrada = crud.visita.remove(db, id=id_visita)
    return visita_borrada

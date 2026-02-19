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

from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.schemas.maestro import EntidadResponse # Para mostrar datos del cliente

class VisitaBase(BaseModel):
    id_plan: int
    id_entidad: int
    nombre_contacto: Optional[str] = None
    observaciones: Optional[str] = None
    # Lat/Lon opcionales al crear
    geolocalizacion_lat: Optional[Decimal] = None
    geolocalizacion_lon: Optional[Decimal] = None

class VisitaCreate(VisitaBase):
    # La foto se sube aparte y se obtiene la URL, o se envía base64 (pero URL es mejor)
    url_foto_evidencia: str 

class VisitaResponse(VisitaBase):
    id_visita: int
    fecha_hora_checkin: datetime
    url_foto_evidencia: str
    
    # Nested: Mostramos la info oficial de la entidad
    entidad: Optional[EntidadResponse] = None

    class Config:
        from_attributes = True
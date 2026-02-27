from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.enums import ResultadoEstadoEnum
from app.schemas.cartera import CarteraResponse

class VisitaBase(BaseModel):
    id_plan: int
    id_cliente: int  # ¡Ahora apunta a la Cartera!
    direccion_actual: Optional[str] = None
    nombre_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    email_contacto: Optional[str] = None # cambiado a str flexible
    nombre_tecnico: Optional[str] = None
    observaciones: Optional[str] = None
    
    # ¡Agregamos el Resultado de la visita!
    resultado: ResultadoEstadoEnum 
    
    geolocalizacion_lat: Optional[float] = None
    geolocalizacion_lon: Optional[float] = None

class VisitaCreate(VisitaBase):
    pass
    # No pedimos file paths aqui, porque se manejan en el controller multipart

class VisitaUpdate(BaseModel):
    id_plan: Optional[int] = None
    id_cliente: Optional[int] = None
    direccion_actual: Optional[str] = None
    nombre_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    email_contacto: Optional[str] = None
    nombre_tecnico: Optional[str] = None
    observaciones: Optional[str] = None
    resultado: Optional[ResultadoEstadoEnum] = None
    geolocalizacion_lat: Optional[float] = None
    geolocalizacion_lon: Optional[float] = None
    url_foto_lugar: Optional[str] = None
    url_foto_sello: Optional[str] = None

class VisitaResponse(VisitaBase):
    id_visita: int
    fecha_hora_checkin: datetime
    url_foto_lugar: str
    url_foto_sello: str
    
    cliente: Optional[CarteraResponse] = None

    class Config:
        from_attributes = True
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
    email_contacto: Optional[EmailStr] = None
    observaciones: Optional[str] = None
    
    # ¡Agregamos el Resultado de la visita!
    resultado: ResultadoEstadoEnum 
    
    geolocalizacion_lat: Optional[Decimal] = None
    geolocalizacion_lon: Optional[Decimal] = None

class VisitaCreate(VisitaBase):
    url_foto_evidencia: str # Se asume que el backend generó esto tras subir el archivo

class VisitaResponse(VisitaBase):
    id_visita: int
    fecha_hora_checkin: datetime
    url_foto_evidencia: str
    
    # Para que el Frontend muestre "Visité a [Nombre de Empresa]"
    cliente: Optional[CarteraResponse] = None

    class Config:
        from_attributes = True
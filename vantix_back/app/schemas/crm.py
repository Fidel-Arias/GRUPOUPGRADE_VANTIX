from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.models.enums import ResultadoEstadoEnum, ResultadoLlamadaEnum

# --- SCHEMAS LLAMADAS ---
class LlamadaCreate(BaseModel):
    id_plan: int
    numero_destino: str
    nombre_destinatario: Optional[str] = None
    duracion_segundos: int = 0
    resultado: ResultadoLlamadaEnum
    url_foto_prueba: Optional[str] = None
    notas_llamada: Optional[str] = None

class LlamadaUpdate(BaseModel):
    id_plan: Optional[int] = None
    numero_destino: Optional[str] = None
    nombre_destinatario: Optional[str] = None
    duracion_segundos: Optional[int] = None
    resultado: Optional[ResultadoLlamadaEnum] = None
    url_foto_prueba: Optional[str] = None
    notas_llamada: Optional[str] = None

class LlamadaResponse(LlamadaCreate):
    id_llamada: int
    fecha_hora: datetime
    class Config:
        from_attributes = True

# --- SCHEMAS EMAILS ---
class EmailCreate(BaseModel):
    id_plan: int
    email_destino: EmailStr
    asunto: Optional[str] = None
    url_foto_prueba: Optional[str] = None
    estado_envio: str = "Enviado"

class EmailUpdate(BaseModel):
    id_plan: Optional[int] = None
    email_destino: Optional[EmailStr] = None
    asunto: Optional[str] = None
    url_foto_prueba: Optional[str] = None
    estado_envio: Optional[str] = None

class EmailResponse(EmailCreate):
    id_email: int
    fecha_hora: datetime
    class Config:
        from_attributes = True
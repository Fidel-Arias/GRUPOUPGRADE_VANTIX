from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.geo import DistritoBase

class MaestroBase(BaseModel):
    nombre_entidad: str
    ruc: Optional[str] = Field(None, max_length=11)
    poder: Optional[str] = None
    sector: Optional[str] = None
    grupo: Optional[str] = None
    id_distrito: Optional[int] = None
    activo: bool = True

class MaestroCreate(MaestroBase):
    pass

class MaestroUpdate(MaestroBase):
    nombre_entidad: Optional[str] = None
    pass

class MaestroResponse(MaestroBase):
    id_entidad: int
    fecha_registro: datetime
    
    distrito: Optional[DistritoBase] = None

    class Config:
        from_attributes = True
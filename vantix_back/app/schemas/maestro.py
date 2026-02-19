from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime
from app.schemas.geo import DistritoBase

# 1. Esquema campos compartidos
class MaestroEntidadBase(BaseModel):
    nombre_entidad: str
    ruc: Optional[constr(max_length=11)] = None # Validación de longitud
    poder: Optional[str] = None
    sector: Optional[str] = None
    grupo: Optional[str] = None
    id_distrito: int # Para crear, solo enviamos el ID

# Esquema para crear
class MaestroEntidadCreate(MaestroEntidadBase):
    pass

# Esquema para actualizar
class MaestroEntidadUpdate(MaestroEntidadBase):
    pass

# Esquema de respuesta
class MaestroEntidadResponse(MaestroEntidadBase):
    id_entidad: int
    fecha_registro: datetime
    activo: bool
    
    # Incluimos el objeto Distrito completo dentro de la entidad
    distrito: Optional[DistritoBase] = None

    class Config:
        from_attributes = True # Para que funcione con SQLAlchemy
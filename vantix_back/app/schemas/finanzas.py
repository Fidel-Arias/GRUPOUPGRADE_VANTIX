from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from decimal import Decimal

class GastoBase(BaseModel):
    id_plan: int
    id_ciente: Optional[int] = None # Mantenemos el nombre de la BD
    fecha_gasto: date
    lugar_origen: Optional[str] = None
    lugar_destino: Optional[str] = None
    institucion_visitada: Optional[str] = None
    motivo_visita: Optional[str] = None
    monto_gastado: Decimal = Field(..., ge=0) # Validamos que sea mayor o igual a 0

class GastoCreate(GastoBase):
    pass

class GastoUpdate(BaseModel):
    id_ciente: Optional[int] = None
    fecha_gasto: Optional[date] = None
    lugar_origen: Optional[str] = None
    lugar_destino: Optional[str] = None
    institucion_visitada: Optional[str] = None
    motivo_visita: Optional[str] = None
    monto_gastado: Optional[Decimal] = None

class GastoResponse(GastoBase):
    id_gasto: int
    class Config:
        from_attributes = True
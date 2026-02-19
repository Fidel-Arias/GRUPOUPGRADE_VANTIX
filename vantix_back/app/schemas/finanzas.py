from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from decimal import Decimal

class GastoCreate(BaseModel):
    id_plan: int
    fecha_gasto: date
    lugar_origen: str
    lugar_destino: str
    motivo_visita: str
    empresa_visitada: str
    monto_gastado: Decimal = Field(..., gt=0) # Validamos que sea mayor a 0

class GastoResponse(GastoCreate):
    id_gasto: int
    class Config:
        from_attributes = True
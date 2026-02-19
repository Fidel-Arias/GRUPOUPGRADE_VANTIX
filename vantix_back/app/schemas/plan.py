from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.schemas.empleado import EmpleadoResponse

class PlanBase(BaseModel):
    fecha_inicio_semana: date
    fecha_fin_semana: date
    total_visitas_programadas: int = 0
    observaciones_supervisor: Optional[str] = None

class PlanCreate(PlanBase):
    id_empleado: int # Solo enviamos el ID al crear

class PlanUpdate(BaseModel):
    estado: Optional[str] = None
    observaciones_supervisor: Optional[str] = None

class PlanResponse(PlanBase):
    id_plan: int
    estado: str
    total_llamadas_realizadas: int
    total_emails_enviados: int
    
    # Podemos devolver el empleado completo
    empleado: Optional[EmpleadoResponse] = None

    class Config:
        from_attributes = True
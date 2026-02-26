from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime
from app.models.enums import TipoActividadEnum, DiaSemanaEnum, EstadoPlanEnum
from app.schemas.cartera import CarteraResponse
from app.schemas.kpi import InformeProductividadResponse

# --- 1. SCHEMAS DEL DETALLE (La Grilla Horaria) ---
class DetallePlanBase(BaseModel):
    dia_semana: DiaSemanaEnum
    hora_programada: time
    tipo_actividad: TipoActividadEnum
    id_cliente: int # Obligatorio saber a quién va a gestionar
    
class DetallePlanCreate(DetallePlanBase):
    pass

class DetallePlanUpdate(DetallePlanBase):
    pass

class DetallePlanResponse(DetallePlanBase):
    id_detalle: int
    id_plan: int
    cliente: Optional[CarteraResponse] = None

    class Config:
        from_attributes = True


# --- 2. SCHEMAS DE LA CABECERA (El Plan) ---
class PlanBase(BaseModel):
    fecha_inicio_semana: date
    fecha_fin_semana: date
    observaciones_supervisor: Optional[str] = None

class PlanCreate(PlanBase):
    # Cuando el frontend envía un plan, envía la lista de detalles incrustada
    detalles_agenda: List[DetallePlanCreate]

class PlanUpdate(BaseModel):
    estado: Optional[EstadoPlanEnum] = None # Para pasar de Borrador -> Aprobado -> Cerrado
    observaciones_supervisor: Optional[str] = None

class PlanResponse(PlanBase):
    id_plan: int
    id_empleado: int
    estado: EstadoPlanEnum
    created_at: datetime
    
    # Aquí la magia: Al pedir un plan, FastAPI devuelve toda la agenda anidada
    detalles_agenda: List[DetallePlanResponse] = []
    
    # Y también el informe de productividad vinculado (vacío al inicio)
    informe_kpi: Optional[InformeProductividadResponse] = None

    class Config:
        from_attributes = True
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from decimal import Decimal

# --- INFORME DE PRODUCTIVIDAD ---

class InformeProductividadBase(BaseModel):
    # Metas (Se pueden configurar por defecto o ajustar)
    meta_visitas: int = 25
    meta_visitas_asistidas: int = 0
    meta_llamadas: int = 30
    meta_emails: int = 100
    meta_cotizaciones: int = 0
    puntaje_objetivo: int = 205

class InformeMetasCreate(BaseModel):
    id_plan: int
    meta_visitas: int
    meta_llamadas: int
    meta_emails: int
    meta_cotizaciones: int
    puntaje_objetivo: int
    meta_visitas_asistidas: Optional[int] = 0

class InformeProductividadUpdate(BaseModel):
    # Campos que se pueden actualizar (Metas o Reales)
    meta_visitas: Optional[int] = None
    real_visitas: Optional[int] = None
    
    meta_visitas_asistidas: Optional[int] = None
    real_visitas_asistidas: Optional[int] = None
    
    meta_llamadas: Optional[int] = None
    real_llamadas: Optional[int] = None
    
    meta_emails: Optional[int] = None
    real_emails: Optional[int] = None
    
    meta_cotizaciones: Optional[int] = None
    real_cotizaciones: Optional[int] = None
    
    puntos_alcanzados: Optional[int] = None
    puntaje_objetivo: Optional[int] = None

# Alias para compatibilidad con código existente
KpiUpdate = InformeProductividadUpdate

class InformeMetasResponse(BaseModel):
    id_informe: int
    id_plan: int
    meta_visitas: int
    meta_visitas_asistidas: int
    meta_llamadas: int
    meta_emails: int
    meta_cotizaciones: int
    puntaje_objetivo: int
    fecha_evaluacion: Optional[date] = None

    class Config:
        from_attributes = True

class InformeProductividadResponse(InformeProductividadBase):
    id_informe: int
    id_plan: int
    
    # Reales (Se actualizan conforme trabajan)
    real_visitas: int
    real_visitas_asistidas: int
    real_llamadas: int
    real_emails: int
    real_cotizaciones: int
    
    # Gamificación
    puntos_alcanzados: int
    porcentaje_alcance: Optional[Decimal] = None # Puede ser null si puntaje_objetivo es 0
    
    fecha_evaluacion: Optional[date]

    class Config:
        from_attributes = True

# --- INCENTIVOS Y PAGOS ---

class IncentivoPagoBase(BaseModel):
    id_empleado: int
    id_plan_origen: int
    monto_bono: Decimal = Field(default=50.00)
    concepto: str
    estado_pago: str = "Pendiente"

class IncentivoPagoCreate(IncentivoPagoBase):
    pass

class IncentivoPagoUpdate(BaseModel):
    monto_bono: Optional[Decimal] = None
    concepto: Optional[str] = None
    estado_pago: Optional[str] = None

class IncentivoPagoResponse(IncentivoPagoBase):
    id_incentivo: int
    fecha_generacion: date

    class Config:
        from_attributes = True
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

# Alias para compatibilidad con código existente
KpiUpdate = InformeProductividadUpdate

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
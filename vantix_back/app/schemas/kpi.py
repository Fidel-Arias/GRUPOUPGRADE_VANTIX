from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import Optional

# --- INFORME KPI ---
class KpiUpdate(BaseModel):
    # Usamos esto para actualizar los puntos desde el backend
    monto_ventas_real: Decimal
    cant_clientes_nuevos: int
    cant_visitas_realizadas: int
    puntos_ventas: int
    puntos_nuevos_clientes: int
    puntos_visitas: int
    puntos_llamadas: int
    puntos_emails: int

class KpiResponse(KpiUpdate):
    id_informe: int
    id_plan: int
    puntaje_total_semanal: int # Este vendrá calculado
    fecha_evaluacion: date
    
    class Config:
        from_attributes = True

# --- INCENTIVOS ---
class IncentivoResponse(BaseModel):
    id_incentivo: int
    monto_bono: Decimal
    concepto: str
    estado_pago: str
    fecha_generacion: date
    
    class Config:
        from_attributes = True
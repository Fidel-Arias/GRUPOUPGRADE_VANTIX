from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from decimal import Decimal

# --- MAESTRO DE METAS (GENERAL) ---

class MaestroMetasBase(BaseModel):
    nombre_meta: str
    meta_visitas: int = 25
    meta_visitas_asistidas: int = 0
    meta_llamadas: int = 30
    meta_emails: int = 100
    meta_cotizaciones: int = 0
    meta_ventas: Optional[Decimal] = 0.00
    
    puntos_visita: int = 10
    puntos_visita_asistida: int = 5
    puntos_llamada: int = 1
    puntos_email: int = 1
    puntos_cotizacion: int = 0
    puntos_venta: Optional[int] = 0
    
    puntaje_objetivo: int = 205

class MaestroMetasCreate(MaestroMetasBase):
    pass

class MaestroMetasUpdate(BaseModel):
    nombre_meta: Optional[str] = None
    meta_visitas: Optional[int] = None
    meta_visitas_asistidas: Optional[int] = None
    meta_llamadas: Optional[int] = None
    meta_emails: Optional[int] = None
    meta_cotizaciones: Optional[int] = None
    meta_ventas: Optional[Decimal] = None
    puntos_visita: Optional[int] = None
    puntos_visita_asistida: Optional[int] = None
    puntos_llamada: Optional[int] = None
    puntos_email: Optional[int] = None
    puntos_cotizacion: Optional[int] = None
    puntos_venta: Optional[int] = None
    puntaje_objetivo: Optional[int] = None

class MaestroMetasResponse(MaestroMetasBase):
    id_maestro: int
    fecha_creacion: date

    class Config:
        from_attributes = True

# --- INFORME DE PRODUCTIVIDAD ---

class InformeProductividadUpdate(BaseModel):
    # Solo valores reales
    real_visitas: Optional[int] = None
    real_visitas_asistidas: Optional[int] = None
    real_llamadas: Optional[int] = None
    real_emails: Optional[int] = None
    real_cotizaciones: Optional[int] = None
    real_ventas_monto: Optional[Decimal] = None
    puntos_alcanzados: Optional[int] = None

class InformeProductividadResponse(BaseModel):
    id_informe: int
    id_plan: int
    id_maestro_meta: Optional[int] = None
    
    # Valores reales
    real_visitas: int
    real_visitas_asistidas: int
    real_llamadas: int
    real_emails: int
    real_cotizaciones: int
    real_ventas_monto: Optional[Decimal] = 0.00
    puntos_alcanzados: int
    
    # Relación al maestro para ver las metas asociadas
    maestro: Optional[MaestroMetasResponse] = None
    
    fecha_evaluacion: Optional[date]

    class Config:
        from_attributes = True

# Alias para compatibilidad
KpiUpdate = InformeProductividadUpdate

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

class ResumenVentasEmpleado(BaseModel):
    id_vendedor_externo: int
    nombre_empleado: str
    total_ventas: Decimal
    periodo: str
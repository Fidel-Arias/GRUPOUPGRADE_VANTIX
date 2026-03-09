from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# --- DETALLES DE COTIZACIÓN ---

class DetalleCotizacionBase(BaseModel):
    id_producto: int
    cantidad: int = Field(default=1, gt=0)
    precio_unitario: Decimal
    precio_producto: Decimal
    total: Decimal
    regalo: bool = False
    id_moneda: int

class DetalleCotizacionCreate(DetalleCotizacionBase):
    pass

class DetalleCotizacionUpdate(BaseModel):
    id_detalle: Optional[int] = None # Si es nuevo puede no tener
    id_producto: Optional[int] = None
    cantidad: Optional[int] = None
    precio_unitario: Optional[Decimal] = None
    precio_producto: Optional[Decimal] = None
    total: Optional[Decimal] = None
    regalo: Optional[bool] = None
    id_moneda: Optional[int] = None

class DetalleCotizacionResponse(DetalleCotizacionBase):
    id_detalle: int
    id_cotizacion: int

    class Config:
        from_attributes = True

# --- CABECERA DE COTIZACIÓN ---

class CotizacionBase(BaseModel):
    numero_cotizacion: Optional[int] = None
    id_almacen: int
    fecha_emision: Optional[date] = None
    id_cliente: int
    id_moneda: int
    total: Decimal = Field(default=Decimal("0.00"))
    observaciones: Optional[str] = None
    garantia_meses: Optional[int] = None
    id_forma_pago: Optional[int] = None
    descripcion: Optional[str] = None

class CotizacionCreate(CotizacionBase):
    detalles: List[DetalleCotizacionCreate]

class CotizacionUpdate(BaseModel):
    numero_cotizacion: Optional[int] = None
    id_almacen: Optional[int] = None
    fecha_emision: Optional[date] = None
    id_cliente: Optional[int] = None
    id_moneda: Optional[int] = None
    total: Optional[Decimal] = None
    observaciones: Optional[str] = None
    garantia_meses: Optional[int] = None
    id_forma_pago: Optional[int] = None
    descripcion: Optional[str] = None
    detalles: Optional[List[DetalleCotizacionUpdate]] = None

class CotizacionResponse(CotizacionBase):
    id_cotizacion: int
    id_empleado: int
    fecha_creacion: datetime
    
    detalles: List[DetalleCotizacionResponse] = []

    class Config:
        from_attributes = True

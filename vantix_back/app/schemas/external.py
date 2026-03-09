from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ExternalVentaDetalleResponse(BaseModel):
    numero_orden: int
    almacen_id: int
    vendedor_nombre: str
    cliente_nombre: str
    producto: str  # Aquí irá la lista de productos resumida
    total: float
    fecha: date
    moneda_simbolo: str

class ExternalProductoResponse(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    ecom_precio: Optional[float] = None

class ExternalAlmacenResponse(BaseModel):
    id: int
    nombre: str
    direccion: Optional[str] = None
    sucursal_id: Optional[int] = None
    inactivo: Optional[bool] = None
    codigo: Optional[str] = None

class ExternalMonedaResponse(BaseModel):
    id: int
    nombre: str
    simbolo: Optional[str] = None
    nacional: Optional[bool] = None
    inactivo: Optional[bool] = None

class ExternalFormaPagoResponse(BaseModel):
    id: int
    nombre: str
    efectivo: Optional[bool] = None
    inactivo: Optional[bool] = None

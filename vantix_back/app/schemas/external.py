from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ExternalCotizacionDetalleResponse(BaseModel):
    numero_cotizacion: int
    fecha: date
    nombre_cliente: str
    producto: str
    marca: str
    cantidad: int
    total_linea: float
    precio_producto: float
    precio_unitario_real: float
    moneda_simbolo: str
    creado: datetime
    vendedor_id_externo: int

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from app.models.enums import CategoriaClienteEnum # Importamos tu Enum
from app.schemas.geo import DistritoBase # Para anidar la respuesta geográfica

class CarteraBase(BaseModel):
    nombre_cliente: str
    ruc_dni: Optional[str] = Field(None, max_length=20)
    categoria: Optional[CategoriaClienteEnum] = None
    direccion: Optional[str] = None
    id_distrito: Optional[int] = None
    id_empleado: Optional[int] = None
    
    # Contactos (Principal)
    nombre_contacto: Optional[str] = None
    celular_contacto: Optional[str] = None
    email_contacto: Optional[str] = None
    
    # Contactos (Gerencia)
    nombre_gerente: Optional[str] = None
    celular_gerente: Optional[str] = None
    email_gerente: Optional[str] = None
    
    # Contactos (Logística/TI)
    nombre_logistico: Optional[str] = None
    celular_logistico: Optional[str] = None
    email_logistico: Optional[str] = None
    
    observaciones: Optional[str] = None
    activo: bool = True

class CarteraCreate(CarteraBase):
    pass # El id_distrito se envía como entero al crear

class CarteraUpdate(CarteraBase):
    pass

class CarteraResponse(CarteraBase):
    id_cliente: int
    fecha_ultima_visita: Optional[date] = None
    
    # Anidamos el distrito para que el Frontend vea el nombre, no solo el ID
    distrito: Optional[DistritoBase] = None

    class Config:
        from_attributes = True
from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

# Base: Campos Compartidos
class EmpleadoBase(BaseModel):
    nombre_completo: str
    dni: str
    cargo: Optional[str] = "Asesor de Ventas"
    email_corporativo: Optional[EmailStr] = None
    activo: Optional[bool] = True

# Create: Campos para crear un nuevo empleado
class EmpleadoCreate(EmpleadoBase):
    pass # Es igual a EmpleadoBase

# Response: Lo que devuelve la API
class EmpleadoResponse(EmpleadoBase):
    id_empleado: int
    fecha_ingreso: date

    class Config:
        from_attributes = True # ¡Vital! Permite leer datos del modelo SQLAlchemy
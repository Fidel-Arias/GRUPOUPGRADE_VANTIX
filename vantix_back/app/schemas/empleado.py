from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

# Base: Campos Compartidos
class EmpleadoBase(BaseModel):
    nombre_completo: str
    dni: str
    cargo: Optional[str] = "Asesor de Ventas"
    email_corporativo: Optional[EmailStr] = None
    is_admin: Optional[bool] = False
    activo: Optional[bool] = True
    id_vendedor_externo: Optional[int] = None

# Create: Campos para crear un nuevo empleado
class EmpleadoCreate(EmpleadoBase):
    email_corporativo: EmailStr
    password: str

# Update: Campos opcionales para actualizar
class EmpleadoUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    dni: Optional[str] = None
    cargo: Optional[str] = None
    email_corporativo: Optional[EmailStr] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    activo: Optional[bool] = None
    id_vendedor_externo: Optional[int] = None

# Response: Lo que devuelve la API
class EmpleadoResponse(EmpleadoBase):
    id_empleado: int
    fecha_ingreso: Optional[date] = None # Puede ser null al inicio o default

    class Config:
        from_attributes = True # ¡Vital! Permite leer datos del modelo SQLAlchemy
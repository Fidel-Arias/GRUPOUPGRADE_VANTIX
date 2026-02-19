from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- DEPARTAMENTO ---
class DepartamentoBase(BaseModel):
    nombre: str
    activo: bool = True

class DepartamentoCreate(DepartamentoBase):
    pass

class DepartamentoUpdate(BaseModel):
    nombre: Optional[str] = None
    activo: Optional[bool] = None

class DepartamentoResponse(DepartamentoBase):
    id_departamento: int
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)

# --- PROVINCIA ---
class ProvinciaBase(BaseModel):
    nombre: str
    activo: bool = True
    id_departamento: int

class ProvinciaCreate(ProvinciaBase):
    pass

class ProvinciaUpdate(BaseModel):
    nombre: Optional[str] = None
    activo: Optional[bool] = None
    id_departamento: Optional[int] = None

class ProvinciaResponse(ProvinciaBase):
    id_provincia: int
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)

# --- DISTRITO ---
class DistritoBase(BaseModel):
    nombre: str
    ubigeo: Optional[str] = None
    activo: bool = True
    id_provincia: int

class DistritoCreate(DistritoBase):
    pass

class DistritoUpdate(BaseModel):
    nombre: Optional[str] = None
    ubigeo: Optional[str] = None
    activo: Optional[bool] = None
    id_provincia: Optional[int] = None

class DistritoResponse(DistritoBase):
    id_distrito: int
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)
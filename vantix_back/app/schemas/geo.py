from pydantic import BaseModel
from typing import Optional, List

# --- SCHEMAS BASE (Para lectura simple) ---

class DistritoBase(BaseModel):
    id_distrito: int
    nombre: str
    ubigeo: Optional[str] = None
    activo: bool = True
    class Config:
        from_attributes = True

class ProvinciaBase(BaseModel):
    id_provincia: int
    nombre: str
    activo: bool = True
    class Config:
        from_attributes = True

class DepartamentoBase(BaseModel):
    id_departamento: int
    nombre: str
    activo: bool = True
    class Config:
        from_attributes = True

# --- SCHEMAS DE CREACIÓN (Para enviar datos al backend) ---

class DistritoCreate(DistritoBase):
    pass

class ProvinciaCreate(ProvinciaBase):
    pass

class DepartamentoCreate(DepartamentoBase):
    pass

# --- SCHEMAS DE ACTUALIZACIÓN (Para enviar datos al backend) ---

class DistritoUpdate(DistritoBase):
    pass

class ProvinciaUpdate(ProvinciaBase):
    pass

class DepartamentoUpdate(DepartamentoBase):
    pass

# --- SCHEMAS CON RELACIONES (Para respuestas anidadas) ---

# Ejemplo: Si pides una Provincia, te da sus distritos
class ProvinciaConDistritos(ProvinciaBase):
    distritos: List[DistritoBase] = []

# Ejemplo: Si pides un Departamento, te da sus provincias
class DepartamentoConProvincias(DepartamentoBase):
    provincias: List[ProvinciaBase] = []
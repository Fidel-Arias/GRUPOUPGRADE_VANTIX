from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.geo import Departamento, Provincia, Distrito
from app.schemas.geo import (
    DepartamentoCreate, DepartamentoUpdate,
    ProvinciaCreate, ProvinciaUpdate,
    DistritoCreate, DistritoUpdate
)

class CRUDDepartamento(CRUDBase[Departamento, DepartamentoCreate, DepartamentoUpdate]):
    def get_by_name(self, db: Session, *, nombre: str) -> Optional[Departamento]:
        return db.query(Departamento).filter(Departamento.nombre == nombre).first()

class CRUDProvincia(CRUDBase[Provincia, ProvinciaCreate, ProvinciaUpdate]):
    def get_by_departamento(self, db: Session, *, id_departamento: int) -> List[Provincia]:
        return db.query(Provincia).filter(Provincia.id_departamento == id_departamento).all()

class CRUDDistrito(CRUDBase[Distrito, DistritoCreate, DistritoUpdate]):
    def get_by_provincia(self, db: Session, *, id_provincia: int) -> List[Distrito]:
        return db.query(Distrito).filter(Distrito.id_provincia == id_provincia).all()

departamento = CRUDDepartamento(Departamento)
provincia = CRUDProvincia(Provincia)
distrito = CRUDDistrito(Distrito)
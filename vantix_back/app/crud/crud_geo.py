from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase # Aunque sea solo lectura, heredar ayuda

from app.models.geo import Departamento, Provincia, Distrito
from app.schemas.geo import DepartamentoBase, ProvinciaBase, DistritoBase

class CRUDDepartamento(CRUDBase[Departamento, DepartamentoBase, DepartamentoBase]):
    pass # Usa el get_multi por defecto

class CRUDProvincia(CRUDBase[Provincia, ProvinciaBase, ProvinciaBase]):
    def get_by_departamento(self, db: Session, *, id_departamento: int) -> List[Provincia]:
        return db.query(Provincia).filter(Provincia.id_departamento == id_departamento).all()

class CRUDDistrito(CRUDBase[Distrito, DistritoBase, DistritoBase]):
    def get_by_provincia(self, db: Session, *, id_provincia: int) -> List[Distrito]:
        return db.query(Distrito).filter(Distrito.id_provincia == id_provincia).all()

departamento = CRUDDepartamento(Departamento)
provincia = CRUDProvincia(Provincia)
distrito = CRUDDistrito(Distrito)
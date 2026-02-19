from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase

# Importamos Modelos
from app.models.crm import RegistroLlamada, RegistroEmail
# Importamos Schemas (Usamos Create y un Update genérico si no definiste uno específico)
from app.schemas.crm import LlamadaCreate, EmailCreate
from pydantic import BaseModel

class CRUDLlamada(CRUDBase[RegistroLlamada, LlamadaCreate, BaseModel]):
    def get_by_plan(self, db: Session, *, id_plan: int) -> List[RegistroLlamada]:
        return db.query(RegistroLlamada).filter(RegistroLlamada.id_plan == id_plan).all()

class CRUDEmail(CRUDBase[RegistroEmail, EmailCreate, BaseModel]):
    def get_by_plan(self, db: Session, *, id_plan: int) -> List[RegistroEmail]:
        return db.query(RegistroEmail).filter(RegistroEmail.id_plan == id_plan).all()

llamada = CRUDLlamada(RegistroLlamada)
email = CRUDEmail(RegistroEmail)
from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase

# Importamos Modelos
from app.models.crm import RegistroLlamada, RegistroEmail
# Importamos Schemas
from app.schemas.crm import LlamadaCreate, LlamadaUpdate, EmailCreate, EmailUpdate

class CRUDLlamada(CRUDBase[RegistroLlamada, LlamadaCreate, LlamadaUpdate]):
    def get_multi_by_plan(self, db: Session, *, id_plan: int, skip: int = 0, limit: int = 100) -> List[RegistroLlamada]:
        return db.query(RegistroLlamada).filter(RegistroLlamada.id_plan == id_plan).offset(skip).limit(limit).all()

class CRUDEmail(CRUDBase[RegistroEmail, EmailCreate, EmailUpdate]):
    def get_multi_by_plan(self, db: Session, *, id_plan: int, skip: int = 0, limit: int = 100) -> List[RegistroEmail]:
        return db.query(RegistroEmail).filter(RegistroEmail.id_plan == id_plan).offset(skip).limit(limit).all()

llamada = CRUDLlamada(RegistroLlamada)
email = CRUDEmail(RegistroEmail)
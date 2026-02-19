from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.visita import RegistroVisita
from app.schemas.visita import VisitaCreate, VisitaBase

class CRUDVisita(CRUDBase[RegistroVisita, VisitaCreate, VisitaBase]):
    
    def get_by_plan(self, db: Session, *, id_plan: int) -> List[RegistroVisita]:
        return db.query(RegistroVisita).filter(RegistroVisita.id_plan == id_plan).all()
        
    def get_by_cliente(self, db: Session, *, id_cliente: int) -> List[RegistroVisita]:
        # Útil para el historial: "Muéstrame todas las visitas que le hicimos a este cliente"
        return db.query(RegistroVisita).filter(RegistroVisita.id_cliente == id_cliente).all()

visita = CRUDVisita(RegistroVisita)
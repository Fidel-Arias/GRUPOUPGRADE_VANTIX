from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.visita import RegistroVisita
from app.schemas.visita import VisitaCreate, VisitaUpdate

class CRUDVisita(CRUDBase[RegistroVisita, VisitaCreate, VisitaUpdate]):
    
    def get_by_plan(self, db: Session, *, id_plan: int) -> List[RegistroVisita]:
        return db.query(RegistroVisita).filter(RegistroVisita.id_plan == id_plan).all()
        
    def get_by_cliente(self, db: Session, *, id_cliente: int) -> List[RegistroVisita]:
        # Útil para el historial: "Muéstrame todas las visitas que le hicimos a este cliente"
        return db.query(RegistroVisita).filter(RegistroVisita.id_cliente == id_cliente).all()

    def get_multi_by_owner(self, db: Session, *, id_empleado: int, skip: int = 0, limit: int = 100) -> List[RegistroVisita]:
        # Join con PlanTrabajoSemanal para filtrar por empleado
        from app.models.plan import PlanTrabajoSemanal
        return (
            db.query(RegistroVisita)
            .join(PlanTrabajoSemanal, RegistroVisita.id_plan == PlanTrabajoSemanal.id_plan)
            .filter(PlanTrabajoSemanal.id_empleado == id_empleado)
            .offset(skip)
            .limit(limit)
            .all()
        )

visita = CRUDVisita(RegistroVisita)
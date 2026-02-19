from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.plan import PlanTrabajoSemanal
from app.schemas.plan import PlanCreate, PlanUpdate

class CRUDPlan(CRUDBase[PlanTrabajoSemanal, PlanCreate, PlanUpdate]):
    
    # Sobreescribimos create para asignar el id_empleado si no viene en el schema
    def create_with_owner(
        self, db: Session, *, obj_in: PlanCreate, id_empleado: int
    ) -> PlanTrabajoSemanal:
        db_obj = PlanTrabajoSemanal(
            **obj_in.model_dump(),
            id_empleado=id_empleado, # Forzamos la relación
            estado="Borrador"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, id_empleado: int, skip: int = 0, limit: int = 100
    ) -> List[PlanTrabajoSemanal]:
        return (
            db.query(PlanTrabajoSemanal)
            .filter(PlanTrabajoSemanal.id_empleado == id_empleado)
            .offset(skip)
            .limit(limit)
            .all()
        )

plan = CRUDPlan(PlanTrabajoSemanal)
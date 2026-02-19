from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.plan import PlanTrabajoSemanal, DetallePlanTrabajo
from app.schemas.plan import PlanCreate, PlanUpdate, DetallePlanCreate, DetallePlanUpdate
from pydantic import BaseModel

# 1. CRUD DE LA CABECERA
class CRUDPlan(CRUDBase[PlanTrabajoSemanal, PlanCreate, PlanUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: PlanCreate, id_empleado: int
    ) -> PlanTrabajoSemanal:
        db_obj = PlanTrabajoSemanal(
            fecha_inicio_semana=obj_in.fecha_inicio_semana,
            fecha_fin_semana=obj_in.fecha_fin_semana,
            observaciones_supervisor=obj_in.observaciones_supervisor,
            id_empleado=id_empleado,
            estado="Borrador"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(self, db: Session, *, id_empleado: int, skip: int = 0, limit: int = 100) -> List[PlanTrabajoSemanal]:
        return db.query(PlanTrabajoSemanal).filter(PlanTrabajoSemanal.id_empleado == id_empleado).offset(skip).limit(limit).all()


# 2. CRUD DEL DETALLE
class CRUDDetallePlan(CRUDBase[DetallePlanTrabajo, DetallePlanCreate, DetallePlanUpdate]):
    
    # Este método es oro: Inserta toda la semana de golpe (Bulk Insert)
    def create_multiples(self, db: Session, *, id_plan: int, detalles: List[DetallePlanCreate]) -> List[DetallePlanTrabajo]:
        db_objs = []
        for detalle_in in detalles:
            obj_in_data = detalle_in.model_dump()
            db_obj = DetallePlanTrabajo(**obj_in_data, id_plan=id_plan)
            db_objs.append(db_obj)
        
        db.add_all(db_objs)
        db.commit()
        
        # Opcional: Refrescar si necesitas devolver los IDs generados
        for obj in db_objs:
            db.refresh(obj)
            
        return db_objs

    # Obtener la agenda de un plan específico
    def get_by_plan(self, db: Session, *, id_plan: int) -> List[DetallePlanTrabajo]:
        return db.query(DetallePlanTrabajo).filter(DetallePlanTrabajo.id_plan == id_plan).all()

# Instanciamos ambos
plan = CRUDPlan(PlanTrabajoSemanal)
detalle_plan = CRUDDetallePlan(DetallePlanTrabajo)
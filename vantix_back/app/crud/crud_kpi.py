from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase

# Modelos
from app.models.kpi import InformeProductividad, IncentivoPago
# Schemas
from app.schemas.kpi import KpiUpdate # Usamos Update porque el Create suele ser automático al crear el plan
from pydantic import BaseModel

# --- KPI (Informe Semanal) ---
class CRUDKpi(CRUDBase[InformeProductividad, BaseModel, KpiUpdate]):
    
    def get_by_plan(self, db: Session, *, id_plan: int) -> Optional[InformeProductividad]:
        return db.query(InformeProductividad).filter(InformeProductividad.id_plan == id_plan).first()
    
    # Crear un informe vacío cuando se crea un plan nuevo
    def create_initial(self, db: Session, *, id_plan: int) -> InformeProductividad:
        db_obj = InformeProductividad(id_plan=id_plan)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# --- INCENTIVOS (Pagos) ---
class CRUDIncentivo(CRUDBase[IncentivoPago, BaseModel, BaseModel]):
    
    def get_by_empleado(self, db: Session, *, id_empleado: int) -> List[IncentivoPago]:
        return db.query(IncentivoPago).filter(IncentivoPago.id_empleado == id_empleado).all()
        
    def get_pendientes_pago(self, db: Session) -> List[IncentivoPago]:
        return db.query(IncentivoPago).filter(IncentivoPago.estado_pago == 'Pendiente').all()

kpi = CRUDKpi(InformeProductividad)
incentivo = CRUDIncentivo(IncentivoPago)
from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase

# Modelos
from app.models.kpi import InformeProductividad, IncentivoPago, MaestroMetas
# Schemas
from app.schemas.kpi import (
    KpiUpdate, 
    IncentivoPagoCreate, 
    IncentivoPagoUpdate,
    MaestroMetasCreate,
    MaestroMetasUpdate
)
from pydantic import BaseModel

# --- KPI (Informe Semanal) ---
class CRUDKpi(CRUDBase[InformeProductividad, BaseModel, KpiUpdate]):
    
    def get_by_plan(self, db: Session, *, id_plan: int) -> Optional[InformeProductividad]:
        return db.query(InformeProductividad).filter(InformeProductividad.id_plan == id_plan).first()
    
    def create_initial(self, db: Session, *, id_plan: int, id_maestro: int) -> InformeProductividad:
        db_obj = InformeProductividad(id_plan=id_plan, id_maestro_meta=id_maestro)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# --- INCENTIVOS (Pagos) ---
class CRUDIncentivo(CRUDBase[IncentivoPago, IncentivoPagoCreate, IncentivoPagoUpdate]):
    
    def get_by_empleado(self, db: Session, *, id_empleado: int) -> List[IncentivoPago]:
        return db.query(IncentivoPago).filter(IncentivoPago.id_empleado == id_empleado).all()
        
    def get_pendientes_pago(self, db: Session) -> List[IncentivoPago]:
        return db.query(IncentivoPago).filter(IncentivoPago.estado_pago == 'Pendiente').all()

# --- MAESTRO DE METAS ---
class CRUDMaestroMetas(CRUDBase[MaestroMetas, MaestroMetasCreate, MaestroMetasUpdate]):
    
    def get_active(self, db: Session) -> Optional[MaestroMetas]:
        """Obtiene la primera meta marcada como activa."""
        return db.query(MaestroMetas).filter(MaestroMetas.is_active == 1).first()

kpi = CRUDKpi(InformeProductividad)
incentivo = CRUDIncentivo(IncentivoPago)
maestro_metas = CRUDMaestroMetas(MaestroMetas)
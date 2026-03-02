from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase

# Modelos
from app.models.kpi import InformeProductividad, IncentivoPago, ConfiguracionMeta
# Schemas
from app.schemas.kpi import (
    KpiUpdate, IncentivoPagoCreate, IncentivoPagoUpdate,
    ConfiguracionMetaCreate, ConfiguracionMetaUpdate
)
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
class CRUDIncentivo(CRUDBase[IncentivoPago, IncentivoPagoCreate, IncentivoPagoUpdate]):
    
    def get_by_empleado(self, db: Session, *, id_empleado: int) -> List[IncentivoPago]:
        return db.query(IncentivoPago).filter(IncentivoPago.id_empleado == id_empleado).all()
        
    def get_pendientes_pago(self, db: Session) -> List[IncentivoPago]:
        return db.query(IncentivoPago).filter(IncentivoPago.estado_pago == 'Pendiente').all()

# --- CONFIGURACIÓN DE METAS GLOBALES ---
class CRUDConfigMeta(CRUDBase[ConfiguracionMeta, ConfiguracionMetaCreate, ConfiguracionMetaUpdate]):
    
    def get_by_clave(self, db: Session, *, clave: str) -> Optional[ConfiguracionMeta]:
        return db.query(ConfiguracionMeta).filter(ConfiguracionMeta.clave == clave).first()
    
    def get_all_as_dict(self, db: Session) -> dict:
        """
        Devuelve un diccionario {clave: valor} con todas las metas actuales.
        Útil para inicializar informes.
        """
        metas = db.query(ConfiguracionMeta).all()
        return {m.clave: m.valor for m in metas}

kpi = CRUDKpi(InformeProductividad)
incentivo = CRUDIncentivo(IncentivoPago)
config_meta = CRUDConfigMeta(ConfiguracionMeta)
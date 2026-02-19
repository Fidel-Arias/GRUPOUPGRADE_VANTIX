from typing import List
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models.finanzas import GastoMovilidad
from app.schemas.finanzas import GastoCreate
from pydantic import BaseModel

class CRUDGasto(CRUDBase[GastoMovilidad, GastoCreate, BaseModel]):
    
    def get_by_plan(self, db: Session, *, id_plan: int) -> List[GastoMovilidad]:
        return db.query(GastoMovilidad).filter(GastoMovilidad.id_plan == id_plan).all()

    # Extra: Sumar todo lo gastado en una semana
    def get_total_gasto_by_plan(self, db: Session, *, id_plan: int) -> Decimal:
        result = db.query(func.sum(GastoMovilidad.monto_gastado)).filter(GastoMovilidad.id_plan == id_plan).scalar()
        return result or Decimal(0)

gasto = CRUDGasto(GastoMovilidad)
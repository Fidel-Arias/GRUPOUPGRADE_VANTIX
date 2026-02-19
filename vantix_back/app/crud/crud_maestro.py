from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.clientes import MaestroEntidades
from app.schemas.maestro import MaestroCreate, MaestroUpdate, MaestroResponse

class CRUDMaestro(CRUDBase[MaestroEntidades, MaestroCreate, MaestroUpdate]):
    
    def get_by_ruc(self, db: Session, *, ruc: str) -> Optional[MaestroEntidades]:
        return db.query(MaestroEntidades).filter(MaestroEntidades.ruc == ruc).first()

maestro = CRUDMaestro(MaestroEntidades)
from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.clientes import CarteraClientes
from app.schemas.cartera import CarteraCreate, CarteraUpdate # Asumiendo que creaste estos schemas

class CRUDCartera(CRUDBase[CarteraClientes, CarteraCreate, CarteraUpdate]):
    
    # Buscar por RUC/DNI para evitar duplicados al importar o registrar
    def get_by_ruc_dni(self, db: Session, *, ruc_dni: str) -> Optional[CarteraClientes]:
        return db.query(CarteraClientes).filter(CarteraClientes.ruc_dni == ruc_dni).first()

    # Obtener clientes activos asignados a un vendedor específico
    def get_activos_by_vendedor(self, db: Session, id_vendedor: int) -> List[CarteraClientes]:
        return db.query(CarteraClientes).filter(
            CarteraClientes.activo == True,
            CarteraClientes.id_empleado == id_vendedor
        ).all()

cartera = CRUDCartera(CarteraClientes)
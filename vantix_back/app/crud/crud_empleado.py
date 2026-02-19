from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.empleado import Empleado
from app.schemas.empleado import EmpleadoCreate, EmpleadoBase # Usamos Base para update simple

class CRUDEmpleado(CRUDBase[Empleado, EmpleadoCreate, EmpleadoBase]):
    
    def get_by_dni(self, db: Session, *, dni: str) -> Optional[Empleado]:
        return db.query(Empleado).filter(Empleado.dni == dni).first()

    def get_by_email(self, db: Session, *, email: str) -> Optional[Empleado]:
        return db.query(Empleado).filter(Empleado.email_corporativo == email).first()

# Instanciamos el objeto para importarlo después
empleado = CRUDEmpleado(Empleado)
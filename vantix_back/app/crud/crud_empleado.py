from typing import Optional, List, Union, Dict, Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.empleado import Empleado
from app.schemas.empleado import EmpleadoCreate, EmpleadoUpdate

class CRUDEmpleado(CRUDBase[Empleado, EmpleadoCreate, EmpleadoUpdate]):
    
    def get_by_dni(self, db: Session, *, dni: str) -> Optional[Empleado]:
        return db.query(Empleado).filter(Empleado.dni == dni).first()

    def create(self, db: Session, *, obj_in: EmpleadoCreate) -> Empleado:
        from app.core.security import get_password_hash
        obj_in_data = obj_in.model_dump()
        password = obj_in_data.pop("password")
        hashed_password = get_password_hash(password)
        db_obj = Empleado(**obj_in_data, hashed_password=hashed_password)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Empleado,
        obj_in: Union[EmpleadoUpdate, Dict[str, Any]]
    ) -> Empleado:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        if update_data.get("password"):
            from app.core.security import get_password_hash
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
            
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def get_by_email(self, db: Session, *, email: str) -> Optional[Empleado]:
        return db.query(Empleado).filter(Empleado.email_corporativo == email).first()

    def authenticate(
        self, db: Session, *, email: str, password: str
    ) -> Optional[Empleado]:
        from app.core.security import verify_password
        db_obj = self.get_by_email(db, email=email)
        if not db_obj:
            return None
        if not verify_password(password, db_obj.hashed_password):
            return None
        return db_obj

# Instanciamos el objeto para importarlo después
empleado = CRUDEmpleado(Empleado)
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.cotizacion import Cotizacion, DetalleCotizacion
from app.schemas.cotizacion import CotizacionCreate, CotizacionUpdate
from typing import List, Optional

class CRUDCotizacion(CRUDBase[Cotizacion, CotizacionCreate, CotizacionUpdate]):
    def create_with_details(
        self, db: Session, *, obj_in: CotizacionCreate, id_empleado: int
    ) -> Cotizacion:
        # Convertimos obj_in a dict y sacamos los detalles para no afectar la creación de la cabecera
        obj_in_data = obj_in.model_dump()
        detalles_data = obj_in_data.pop("detalles")
        
        # Agregamos el id_empleado de quien la crea
        obj_in_data["id_empleado"] = id_empleado
        
        db_obj = Cotizacion(**obj_in_data)
        db.add(db_obj)
        db.flush() # Para obtener el ID generado sin commitear aún
        
        # Creamos los detalles
        for detalle in detalles_data:
            db_detalle = DetalleCotizacion(
                id_cotizacion=db_obj.id_cotizacion,
                **detalle
            )
            db.add(db_detalle)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_empleado(
        self, db: Session, *, id_empleado: int, skip: int = 0, limit: int = 100
    ) -> List[Cotizacion]:
        return (
            db.query(self.model)
            .filter(self.model.id_empleado == id_empleado)
            .offset(skip)
            .limit(limit)
            .all()
        )

cotizacion = CRUDCotizacion(Cotizacion)

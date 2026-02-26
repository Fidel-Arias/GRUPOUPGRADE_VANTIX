from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.api import deps
from app.services.external.upgrade_db import ExternalDBService
from app.schemas.external import ExternalCotizacionDetalleResponse
from app import crud

router = APIRouter()

@router.get("/cotizaciones-detalladas", response_model=List[ExternalCotizacionDetalleResponse])
def mostrar_reporte_cotizaciones(
    id_empleado: Optional[int] = Query(None, description="Filtrar por ID de empleado local (Vantix)"),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Reporte Detallado de Cotizaciones desde UpgradeDB.
    Si se envía id_empleado local, el sistema busca automáticamente su id_vendedor_externo 
    vinculado para filtrar las cotizaciones.
    """
    vendedor_externo_id = None
    if id_empleado:
        empleado = crud.empleado.get(db, id=id_empleado)
        if not empleado:
             raise HTTPException(status_code=404, detail="Empleado local no encontrado")
        vendedor_externo_id = empleado.id_vendedor_externo
        
        if not vendedor_externo_id:
            raise HTTPException(
                status_code=400, 
                detail=f"El empleado {empleado.nombre_completo} no tiene un ID de vendedor vinculado de la base externa."
            )

    return ExternalDBService.fetch_cotizaciones_detalladas(vendedor_id_externo=vendedor_externo_id)

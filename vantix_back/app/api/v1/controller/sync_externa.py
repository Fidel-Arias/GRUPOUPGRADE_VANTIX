from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.api import deps
from app.services.external.upgrade_db import ExternalDBService
from app.schemas.external import ExternalCotizacionDetalleResponse, ExternalVentaDetalleResponse
from app import crud, schemas

router = APIRouter()

@router.get("/cotizaciones-detalladas", response_model=List[ExternalCotizacionDetalleResponse])
def mostrar_reporte_cotizaciones(
    id_empleado: Optional[int] = Query(None, description="Filtrar por ID de empleado local (Vantix)"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicial del rango (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha final del rango (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de registros a retornar"),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Reporte Detallado de Cotizaciones desde UpgradeDB.
    Permite filtrar por empleado local, rango de fechas y límite.
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

    return ExternalDBService.fetch_cotizaciones_detalladas(
        vendedor_id_externo=vendedor_externo_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        limit=limit
    )
@router.get("/ventas-detalladas", response_model=List[schemas.external.ExternalVentaDetalleResponse])
def mostrar_reporte_ventas(
    id_empleado: Optional[int] = Query(None, description="Filtrar por ID de empleado local (Vantix)"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicial del rango (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha final del rango (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de registros a retornar"),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Reporte Detallado de Ventas desde UpgradeDB.
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
                detail=f"El empleado {empleado.nombre_completo} no tiene un ID de vendedor vinculado."
            )

    return ExternalDBService.fetch_ventas_detalladas(
        vendedor_id_externo=vendedor_externo_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        limit=limit
    )

@router.get("/productos", response_model=List[schemas.external.ExternalProductoResponse])
def mostrar_listado_productos(
    search: Optional[str] = Query(None, description="Buscar por nombre o código"),
    skip: int = Query(0, description="Cantidad de registros a saltar (offset)"),
    limit: int = Query(100, ge=1, le=1000, description="Límite máximo de productos a retornar"),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Obtiene el catálogo de productos disponibles desde la base de datos externa UpgradeDB.
    Se utiliza principalmente para poder armar las cotizaciones en Vantix.
    Soporta búsqueda parcial por nombre o código.
    """
    return ExternalDBService.fetch_productos(limit=limit, offset=skip, search=search)

@router.get("/almacenes", response_model=List[schemas.external.ExternalAlmacenResponse])
def mostrar_listado_almacenes(
    search: Optional[str] = Query(None, description="Buscar por nombre o código"),
    skip: int = Query(0, description="Cantidad de registros a saltar (offset)"),
    limit: int = Query(100, ge=1, le=1000, description="Límite máximo de almacenes a retornar"),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Obtiene el catálogo de almacenes disponibles desde la base de datos externa UpgradeDB.
    Se utiliza principalmente para poder armar las cotizaciones en Vantix.
    Soporta búsqueda parcial por nombre o código.
    """
    return ExternalDBService.fetch_almacenes(limit=limit, offset=skip, search=search)

@router.get("/monedas", response_model=List[schemas.external.ExternalMonedaResponse])
def mostrar_listado_monedas(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Obtiene el catálogo de monedas disponibles desde la base de datos externa UpgradeDB.
    """
    return ExternalDBService.fetch_monedas()

@router.get("/formas-pago", response_model=List[schemas.external.ExternalFormaPagoResponse])
def mostrar_listado_formas_pago(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Obtiene el catálogo de formas de pago disponibles desde la base de datos externa UpgradeDB.
    """
    return ExternalDBService.fetch_formas_pago()

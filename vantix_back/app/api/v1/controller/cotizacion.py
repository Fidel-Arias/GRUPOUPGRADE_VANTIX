from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.CotizacionResponse)
def crear_cotizacion(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    cotizacion_in: schemas.CotizacionCreate
):
    """
    Crear una nueva cotización con sus respectivos detalles (productos).
    """
    # Validamos que el cliente enviado pertenezca a la cartera o exista
    cliente = crud.cartera.get(db, id=cotizacion_in.id_cliente)
    if not cliente:
         raise HTTPException(status_code=404, detail="El cliente especificado no existe en la cartera")
         
    # Creamos la cabecera y el detalle utilizando el método especializado del CRUD
    return crud.cotizacion.create_with_details(db=db, obj_in=cotizacion_in, id_empleado=current_user.id_empleado)

@router.get("/", response_model=List[schemas.CotizacionResponse])
def listar_cotizaciones(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    id_empleado: Optional[int] = Query(None, description="Filtrar por ID de empleado")
):
    """
    Listar cotizaciones. Se puede filtrar por empleado (vendedor).
    """
    if id_empleado:
        return crud.cotizacion.get_multi_by_empleado(db, id_empleado=id_empleado, skip=skip, limit=limit)
    
    # Si no es admin y no manda filtro, solo ve sus propias cotizaciones
    if not current_user.is_admin:
        return crud.cotizacion.get_multi_by_empleado(db, id_empleado=current_user.id_empleado, skip=skip, limit=limit)
        
    return crud.cotizacion.get_multi(db, skip=skip, limit=limit)

@router.get("/{id_cotizacion}", response_model=schemas.CotizacionResponse)
def obtener_cotizacion(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_cotizacion: int
):
    """
    Obtener el detalle completo de una cotización específica.
    """
    cotizacion = crud.cotizacion.get(db, id=id_cotizacion)
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
    # Validar propiedad
    if not current_user.is_admin and cotizacion.id_empleado != current_user.id_empleado:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver esta cotización")
        
    return cotizacion

@router.put("/{id_cotizacion}", response_model=schemas.CotizacionResponse)
def actualizar_cotizacion(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_cotizacion: int,
    cotizacion_in: schemas.CotizacionUpdate
):
    """
    Actualizar datos de una cabecera de cotización.
    Nota: La actualización de la lista de detalles requiere logica adicional si se envían.
    """
    cotizacion = crud.cotizacion.get(db, id=id_cotizacion)
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
    if not current_user.is_admin and cotizacion.id_empleado != current_user.id_empleado:
        raise HTTPException(status_code=403, detail="No puedes modificar una cotización que no creaste")
    
    return crud.cotizacion.update(db, db_obj=cotizacion, obj_in=cotizacion_in)

@router.delete("/{id_cotizacion}", response_model=schemas.CotizacionResponse)
def eliminar_cotizacion(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_cotizacion: int
):
    """
    Eliminar una cotización y sus detalles asociados en cascada.
    """
    cotizacion = crud.cotizacion.get(db, id=id_cotizacion)
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
        
    if not current_user.is_admin and cotizacion.id_empleado != current_user.id_empleado:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar esta cotización")
    
    return crud.cotizacion.remove(db, id=id_cotizacion)

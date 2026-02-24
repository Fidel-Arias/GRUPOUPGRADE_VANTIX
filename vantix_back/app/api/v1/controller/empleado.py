from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models
from app.api import deps
from app.schemas.empleado import EmpleadoCreate, EmpleadoUpdate, EmpleadoResponse

router = APIRouter()

@router.get("/", response_model=List[EmpleadoResponse])
def read_empleados(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Listar todos los empleados registrados.
    """
    return crud.empleado.get_multi(db, skip=skip, limit=limit)

@router.get("/me", response_model=EmpleadoResponse)
def read_empleado_me(
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
):
    """
    Obtener el perfil del usuario actual logueado.
    """
    return current_user


@router.post("/", response_model=EmpleadoResponse)
def create_empleado(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    empleado_in: EmpleadoCreate
):
    """
    Registrar un nuevo empleado.
    Valida que el DNI y el Email no existan.
    """
    # 1. Validar DNI
    empleado_dni = crud.empleado.get_by_dni(db, dni=empleado_in.dni)
    if empleado_dni:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un empleado con este DNI registrado."
        )
    
    # 2. Validar Email (Mandatorio para el login)
    empleado_email = crud.empleado.get_by_email(db, email=empleado_in.email_corporativo)
    if empleado_email:
         raise HTTPException(
            status_code=400,
            detail="Ya existe un empleado con este correo corporativo."
        )
             
    empleado = crud.empleado.create(db, obj_in=empleado_in)
    return empleado

@router.put("/{id_empleado}", response_model=EmpleadoResponse)
def update_empleado(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    id_empleado: int,
    empleado_in: EmpleadoUpdate
):
    """
    Actualizar datos de un empleado.
    """
    empleado = crud.empleado.get(db, id=id_empleado)
    if not empleado:
        raise HTTPException(
            status_code=404,
            detail="Empleado no encontrado"
        )
    return crud.empleado.update(db, db_obj=empleado, obj_in=empleado_in)

@router.post("/{id_empleado}/toggle-active", response_model=EmpleadoResponse)
def toggle_active_empleado(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user),
    id_empleado: int
):
    """
    Activar o Desactivar un empleado (Soft Delete).
    """
    empleado = crud.empleado.get(db, id=id_empleado)
    if not empleado:
        raise HTTPException(
            status_code=404,
            detail="Empleado no encontrado"
        )
    
    # Invertir el estado actual
    new_status = not empleado.activo
    update_data = {"activo": new_status}
    
    return crud.empleado.update(db, db_obj=empleado, obj_in=update_data)

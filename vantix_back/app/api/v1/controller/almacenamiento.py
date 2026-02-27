from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app import crud
from app.api import deps
from app.models.empleado import Empleado
from app.services.external.remote_storage import RemoteStorageService

router = APIRouter()

@router.get("/fotos", response_model=List[str])
def listar_fotos_remotas(
    *,
    db: Session = Depends(deps.get_db),
    id_empleado: int = Query(..., description="ID del empleado para buscar sus fotos"),
    activity_type: str = Query(..., description="Tipo de actividad (Visita, Llamada, Correo)"),
    current_user: Empleado = Depends(deps.get_current_active_user)
):
    """
    Lista las URLs de todas las fotos almacenadas en el hosting para un empleado específico (por ID) y actividad.
    El sistema busca automáticamente el nombre completo del empleado en la base de datos.
    """
    # 1. Obtener el empleado de la base de datos para tener su nombre oficial
    empleado = crud.empleado.get(db, id=id_empleado)
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # 2. Usar su nombre completo para buscar en el storage remoto (con la normalización ya implementada)
    return RemoteStorageService.list_files(empleado.nombre_completo, activity_type)

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps

router = APIRouter()

# --- DEPARTAMENTOS ---

@router.get("/departamentos", response_model=List[schemas.DepartamentoResponse])
def read_departamentos(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    """Listar departamentos."""
    return crud.departamento.get_multi(db, skip=skip, limit=limit)

@router.post("/departamentos/{id}/toggle-active", response_model=schemas.DepartamentoResponse)
def toggle_active_departamento(
    *,
    db: Session = Depends(deps.get_db),
    id: int
):
    """Activar/Desactivar departamento."""
    dept = crud.departamento.get(db, id=id)
    if not dept:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    # Invertir estado
    update_data = {"activo": not dept.activo}
    return crud.departamento.update(db, db_obj=dept, obj_in=update_data)


# --- PROVINCIAS ---

@router.get("/provincias", response_model=List[schemas.ProvinciaResponse])
def read_provincias(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    id_departamento: int = None
):
    """Listar provincias. Opcional filtrar por departamento."""
    if id_departamento:
        return crud.provincia.get_by_departamento(db, id_departamento=id_departamento)
    return crud.provincia.get_multi(db, skip=skip, limit=limit)

@router.post("/provincias/{id}/toggle-active", response_model=schemas.ProvinciaResponse)
def toggle_active_provincia(
    *,
    db: Session = Depends(deps.get_db),
    id: int
):
    """Activar/Desactivar provincia."""
    prov = crud.provincia.get(db, id=id)
    if not prov:
        raise HTTPException(status_code=404, detail="Provincia no encontrada")
    update_data = {"activo": not prov.activo}
    return crud.provincia.update(db, db_obj=prov, obj_in=update_data)


# --- DISTRITOS ---

@router.get("/distritos", response_model=List[schemas.DistritoResponse])
def read_distritos(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    id_provincia: int = None
):
    """Listar distritos. Opcional filtrar por provincia."""
    if id_provincia:
        return crud.distrito.get_by_provincia(db, id_provincia=id_provincia)
    return crud.distrito.get_multi(db, skip=skip, limit=limit)

@router.post("/distritos/{id}/toggle-active", response_model=schemas.DistritoResponse)
def toggle_active_distrito(
    *,
    db: Session = Depends(deps.get_db),
    id: int
):
    """Activar/Desactivar distrito."""
    dist = crud.distrito.get(db, id=id)
    if not dist:
        raise HTTPException(status_code=404, detail="Distrito no encontrado")
    update_data = {"activo": not dist.activo}
    return crud.distrito.update(db, db_obj=dist, obj_in=update_data)

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from app.models.geo import Departamento, Provincia, Distrito

router = APIRouter()

# --- DEPARTAMENTOS ---

@router.get("/departamentos", response_model=List[schemas.DepartamentoResponse])
def read_departamentos(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 10
):
    """Listar departamentos."""
    return crud.departamento.get_multi(db, skip=skip, limit=limit)

@router.post("/departamentos", response_model=schemas.DepartamentoResponse)
def create_departamento(
    *,
    db: Session = Depends(deps.get_db),
    departamento_in: schemas.DepartamentoCreate
):
    """Crear nuevo departamento."""
    return crud.departamento.create(db, obj_in=departamento_in)

@router.put("/departamentos/{id}", response_model=schemas.DepartamentoResponse)
def update_departamento(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    departamento_in: schemas.DepartamentoUpdate
):
    """Actualizar departamento."""
    dept = crud.departamento.get(db, id=id)
    if not dept:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return crud.departamento.update(db, db_obj=dept, obj_in=departamento_in)

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

@router.post("/provincias", response_model=schemas.ProvinciaResponse)
def create_provincia(
    *,
    db: Session = Depends(deps.get_db),
    provincia_in: schemas.ProvinciaCreate
):
    """Crear provincia."""
    return crud.provincia.create(db, obj_in=provincia_in)

@router.put("/provincias/{id}", response_model=schemas.ProvinciaResponse)
def update_provincia(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    provincia_in: schemas.ProvinciaUpdate
):
    """Actualizar provincia."""
    prov = crud.provincia.get(db, id=id)
    if not prov:
        raise HTTPException(status_code=404, detail="Provincia no encontrada")
    return crud.provincia.update(db, db_obj=prov, obj_in=provincia_in)

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

@router.post("/distritos", response_model=schemas.DistritoResponse)
def create_distrito(
    *,
    db: Session = Depends(deps.get_db),
    distrito_in: schemas.DistritoCreate
):
    """Crear distrito."""
    return crud.distrito.create(db, obj_in=distrito_in)

@router.put("/distritos/{id}", response_model=schemas.DistritoResponse)
def update_distrito(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    distrito_in: schemas.DistritoUpdate
):
    """Actualizar distrito."""
    dist = crud.distrito.get(db, id=id)
    if not dist:
        raise HTTPException(status_code=404, detail="Distrito no encontrado")
    return crud.distrito.update(db, db_obj=dist, obj_in=distrito_in)

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

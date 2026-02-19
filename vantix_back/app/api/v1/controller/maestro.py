from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.MaestroResponse)
def registrar_cliente_nuevo(
    *,
    db: Session = Depends(deps.get_db),
    prospecto_in: schemas.MaestroCreate,
):
    """
    Registra un cliente nuevo en el Maestro
    y lo pasa automáticamente a la Cartera de Clientes.
    """
    # 1. Verificar si ya existe el RUC para no duplicar basura
    if prospecto_in.ruc:
        existe_maestro = crud.maestro.get_by_ruc(db=db, ruc=prospecto_in.ruc)
        if existe_maestro:
            raise HTTPException(status_code=400, detail="El RUC ya está registrado en el sistema.")

    # 2. GUARDAR EN MAESTRO_ENTIDADES (Cumplimos con la empresa)
    nuevo_maestro = crud.maestro.create(db=db, obj_in=prospecto_in)

    # 3. MIGRACIÓN AUTOMÁTICA A CARTERA_CLIENTES (Para que el sistema funcione)
    # Mapeamos los campos del maestro hacia el formato de la cartera
    nueva_cartera_in = schemas.CarteraCreate(
        nombre_cliente=nuevo_maestro.nombre_entidad,
        ruc_dni=nuevo_maestro.ruc,
        id_distrito=nuevo_maestro.id_distrito,
        categoria=None, # Se puede actualizar después
        observaciones="Migrado automáticamente desde Maestro de Entidades"
    )
    
    # Lo guardamos en la cartera oficial
    crud.cartera.create(db=db, obj_in=nueva_cartera_in)

    # 4. Devolvemos la respuesta del maestro al Frontend
    return nuevo_maestro
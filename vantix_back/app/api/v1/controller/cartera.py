from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
from app import crud, schemas, models
import io
from app.api import deps
from app.models.clientes import CarteraClientes
from app.models.enums import CategoriaClienteEnum

router = APIRouter()

# 1. GET: Llenar el Combobox del Plan de Trabajo
@router.get("/", response_model=List[schemas.CarteraResponse])
def listar_cartera_oficial(
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_empleado: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100
):
    """
    Devuelve la lista oficial de clientes.
    Se puede filtrar por id_empleado para ver sus clientes asignados.
    """
    if id_empleado:
        return crud.cartera.get_activos_by_vendedor(db, id_vendedor=id_empleado)
    return crud.cartera.get_multi(db, skip=skip, limit=limit)

# 2. PUT: Actualizar un dato (Ej: Si el cliente cambió de celular)
@router.put("/{id_cliente}", response_model=schemas.CarteraResponse)
def actualizar_datos_cliente(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_active_user),
    id_cliente: int,
    cliente_in: schemas.CarteraUpdate,
):
    """
    Permite actualizar números de teléfono, correos o contactos 
    de un cliente que YA EXISTE en la cartera oficial.
    """
    cliente_actual = crud.cartera.get(db=db, id=id_cliente)
    if not cliente_actual:
        raise HTTPException(status_code=404, detail="Cliente oficial no encontrado")
        
    return crud.cartera.update(db=db, db_obj=cliente_actual, obj_in=cliente_in)

# ==========================================
# NUEVO: ENDPOINT DE CARGA MASIVA
# ==========================================
def limpiar_dato(valor):
    # Validamos si es nulo de Pandas o texto vacío
    if pd.isna(valor) or str(valor).strip() == '' or str(valor).lower() == 'nan':
        return None
    return str(valor).strip()

def mapear_categoria(valor):
    valor = limpiar_dato(valor)

    if not valor: 
        return None
        
    val_upper = valor.upper()
    
    # GOBIERNO
    if any(x in val_upper for x in ['GOBIERNO', 'ESTADO', 'PUBLICO', 'MUNICIPALIDAD', 'MINISTERIO', 'UGEL']): 
        return CategoriaClienteEnum.GOBIERNO.value
        
    # CORPORATIVO (Empresas grandes, B2B)
    if any(x in val_upper for x in ['CORPORATIVO', 'EMPRESA', 'PRIVADO', 'INDUSTRIA', 'B2B']): 
        return CategoriaClienteEnum.CORPORATIVO.value
        
    # RETAIL (Comercio, B2C)
    if any(x in val_upper for x in ['RETAIL', 'MINORISTA', 'TIENDA', 'COMERCIO', 'B2C']): 
        return CategoriaClienteEnum.RETAIL.value
        
    # Default: Si dice "Cliente", asumimos Corporativo por defecto? Mejor dejarlo en None si no estamos seguros.
    return None

@router.post("/importar-masivo/")
async def importar_cartera_excel(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: models.empleado.Empleado = Depends(deps.get_current_admin_user)
):
    """
    Recibe un archivo .xlsx completo, recorre TODAS las hojas,
    limpia columnas duplicadas y guarda los clientes.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Por favor, sube un archivo Excel (.xlsx o .xls)")

    try:
        contents = await file.read()
        todas_las_hojas = pd.read_excel(io.BytesIO(contents), sheet_name=None, header=None)
        
        rucs_en_bd = {
            c.ruc_dni for c in db.query(CarteraClientes.ruc_dni).filter(CarteraClientes.ruc_dni.isnot(None)).all()
        }
        
        # Obtenemos empleados para vinculación automática por nombre de hoja
        empleados = db.query(models.empleado.Empleado).filter(models.empleado.Empleado.activo == True).all()
        
        import re
        import unicodedata

        def normalizar(texto):
            return ''.join(
                c for c in unicodedata.normalize('NFD', texto)
                if unicodedata.category(c) != 'Mn'
            ).lower()

        clientes_nuevos = []
        filas_omitidas = 0
        hojas_procesadas = []

        for nombre_hoja, df in todas_las_hojas.items():
            
            # Saltamos hojas que no son carteras
            if "calendarizaci" in nombre_hoja.lower() or "edutec" in nombre_hoja.lower():
                continue
            
            # --- Busqueda de empleado por nombre de hoja ---
            # 1. Limpiar nombre de hoja: '6. Alfonso Ruiz' -> 'alfonso ruiz'
            nombre_hoja_limpio = re.sub(r'^\d+\.\s*', '', nombre_hoja).lower().strip()
            
            id_empleado_hoja = None
            if nombre_hoja_limpio:
                nombre_hoja_norm = normalizar(nombre_hoja_limpio)
                for emp in empleados:
                    emp_nombre_norm = normalizar(emp.nombre_completo)
                    if nombre_hoja_norm in emp_nombre_norm:
                        id_empleado_hoja = emp.id_empleado
                        break
                
            hojas_procesadas.append(f"{nombre_hoja} (Asignado a ID: {id_empleado_hoja})" if id_empleado_hoja else nombre_hoja)

            # --- BUSCADOR INTELIGENTE DE ENCABEZADOS ---
            header_idx = 0
            for i, row in df.iterrows():
                fila_texto = " ".join([str(val).lower() for val in row.values])
                if 'ruc' in fila_texto and 'cliente' in fila_texto:
                    header_idx = i
                    break
            
            # Asignamos esa fila como los verdaderos encabezados y cortamos lo de arriba
            df.columns = df.iloc[header_idx]
            df = df[(header_idx + 1):]
            
            # 1. Limpiamos los nombres de las columnas
            # - Lowercase
            # - Reemplazar saltos de línea con espacio (Evita 'Categoría del\ncliente')
            # - Strip
            # - Unidecode opcional (pero 'categor' y 'direcci' suelen ser seguros)
            columnas_limpias = []
            for c in df.columns:
                s = str(c).lower()
                s = s.replace('\n', ' ').replace('\r', ' ')
                s = " ".join(s.split()) # Quita espacios dobles
                columnas_limpias.append(s)
            
            df.columns = columnas_limpias


            # =================================================================
            # FIX: ELIMINAR COLUMNAS DUPLICADAS (Evita el error de Series)
            # Solo conservamos la primera aparición de cualquier columna repetida
            # =================================================================
            df = df.loc[:, ~df.columns.duplicated(keep='first')]

            # --- PROCESAMIENTO DE DATOS ---
            for index, row in df.iterrows():
                # Búsqueda dinámica de columnas (ahora es 100% seguro que devuelven 1 solo valor)
                nombre_col = next((col for col in df.columns if 'nombre' in col and 'cliente' in col), None)
                if not nombre_col: continue 
                
                nombre = limpiar_dato(row.get(nombre_col))
                if not nombre:
                    filas_omitidas += 1
                    continue
                
                ruc_col = next((col for col in df.columns if 'ruc' in col), None)
                ruc_dni = limpiar_dato(row.get(ruc_col)) if ruc_col else None
                
                if ruc_dni and ruc_dni.endswith('.0'):
                    ruc_dni = ruc_dni[:-2]
                    
                if ruc_dni in rucs_en_bd:
                    filas_omitidas += 1
                    continue
                
                # Búsqueda más robusta de Categoría
                cat_col = next((col for col in df.columns if any(x in col for x in ['categor', 'sector', 'clasifica', 'tipo', 'rubro'])), None)

                if cat_col and index < 5:
                     val_cat = row.get(cat_col)
                     # print(f"DEBUG ROW {index}: Col='{cat_col}' Val='{val_cat}'")

                # Búsqueda más robusta de Dirección
                dir_col = next((col for col in df.columns if any(x in col for x in ['direcci', 'domicilio', 'ubicaci', 'calle', 'av.'])), None)


                
                # Como limpiamos las columnas duplicadas, 'celular' y 'correo electrónico' 
                # tomarán estrictamente el primero que aparezca (el del contacto principal)
                cel_contacto = limpiar_dato(row.get('celular'))
                email_contacto = limpiar_dato(row.get('correo electrónico'))
                
                # Los campos de Gerente y Logístico quedarán en None, según tu regla de "tomar solo el primero"
                
                nuevo_cliente = CarteraClientes(
                    nombre_cliente=nombre,
                    ruc_dni=ruc_dni,
                    id_empleado=id_empleado_hoja,
                    categoria=mapear_categoria(row.get(cat_col)) if cat_col else None,
                    direccion=limpiar_dato(row.get(dir_col)) if dir_col else None,
                    celular_contacto=cel_contacto,
                    email_contacto=email_contacto,
                    observaciones=f"Importado de la hoja: {nombre_hoja}"
                )
                
                clientes_nuevos.append(nuevo_cliente)
                if ruc_dni:
                    rucs_en_bd.add(ruc_dni)

        # 5. Guardar todo en la BD
        if clientes_nuevos:
            db.add_all(clientes_nuevos)
            db.commit()

        return {
            "mensaje": "¡Importación masiva finalizada con éxito!",
            "hojas_leidas": hojas_procesadas,
            "registros_insertados": len(clientes_nuevos),
            "registros_omitidos_o_duplicados": filas_omitidas
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")